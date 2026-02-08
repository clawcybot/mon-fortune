require('dotenv').config();
const express = require('express');
const { ethers } = require('ethers');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const { FortuneTokenManager } = require('./lib/token-manager');

const app = express();
app.use(express.json());
app.use(cors());

// Rate limiting - generous for hackathon
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { error: 'Rate limit exceeded. Try again in a minute.' }
});
app.use('/api/', limiter);

// Track processed transactions per network
const processedTxs = {
  testnet: new Set(),
  mainnet: new Set()
};

// Network configurations
const NETWORKS = {
  testnet: {
    name: 'testnet',
    rpcUrl: process.env.TESTNET_RPC || 'https://testnet-rpc.monad.xyz',
    oracleAddress: process.env.TESTNET_ORACLE_ADDRESS,
    explorer: 'https://testnet.monadexplorer.com'
  },
  mainnet: {
    name: 'mainnet',
    rpcUrl: process.env.MAINNET_RPC || 'https://rpc.monad.xyz',
    oracleAddress: process.env.MAINNET_ORACLE_ADDRESS,
    explorer: 'https://monadexplorer.com'
  }
};

// Initialize providers and wallets
const providers = {};
const wallets = {};

Object.keys(NETWORKS).forEach(network => {
  if (NETWORKS[network].oracleAddress) {
    providers[network] = new ethers.JsonRpcProvider(NETWORKS[network].rpcUrl);
    wallets[network] = new ethers.Wallet(process.env.ORACLE_PRIVATE_KEY, providers[network]);
  }
});

// Initialize Fortune Token Managers
const tokenManagers = {};
Object.keys(NETWORKS).forEach(network => {
  if (providers[network] && wallets[network]) {
    tokenManagers[network] = new FortuneTokenManager(providers[network], wallets[network], network);
  }
});

// Fortune message pools
const fortunes = {
  excellent: [
    "The Monad smiles upon you! Great fortune awaits! 🌟",
    "Destiny calls your name! The stars align! ✨",
    "A prophecy fulfilled! You are the chosen one! 🔮",
    "The universe conspires in your favor! 🌌",
    "Legendary luck! Fortune beyond measure! 💎",
    "The threads of fate weave in your favor! 🧵"
  ],
  good: [
    "Fortune favors the brave. Proceed with confidence! 🍀",
    "The path ahead is bright. Trust your instincts! ☀️",
    "Good omens gather around you! 🌈",
    "The spirits whisper: 'Yes, now is the time!' 👻",
    "Your efforts will bear fruit. Stay the course! 🌱",
    "Success is within reach. Seize the moment! 🎯"
  ],
  neutral: [
    "The future is unwritten. Choose wisely... 📖",
    "Balance in all things. Neither good nor bad. ⚖️",
    "The mist clears slowly. Patience is key. 🌫️",
    "A crossroads approaches. Consider all paths. 🛤️",
    "The answer lies within you. Trust yourself. 🧘",
    "Not all is revealed. Wait and observe. 👁️"
  ],
  poor: [
    "Dark clouds gather... Tread carefully. ⛈️",
    "Caution is your ally. Hesitation may save you. 🐢",
    "The signs are unclear. Wait for better times. 🌑",
    "Shadows lengthen. Do not rush forward. 🌆",
    "The winds oppose you. Consider retreat. 🌪️",
    "Patience now prevents regret later. ⏳"
  ],
  bad: [
    "The void stares back. Perhaps another time... 🕳️",
    "Turn back while you can. Danger lies ahead! ⚠️",
    "The Monad frowns. Seek protection! 😰",
    "A warning from the beyond: 'Stop!' 👁️",
    "Misfortune follows close. Hide while you can! 🏃",
    "Not today. The timing is all wrong. 🚫"
  ]
};

// Health check endpoint
app.get('/health', async (req, res) => {
  const status = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    networks: {},
    tokens: {}
  };

  for (const [network, config] of Object.entries(NETWORKS)) {
    if (providers[network]) {
      try {
        const balance = await providers[network].getBalance(config.oracleAddress);
        status.networks[network] = {
          oracle: config.oracleAddress,
          balance: ethers.formatEther(balance) + ' MON',
          rpc: config.rpcUrl
        };

        // Add token info
        const tm = tokenManagers[network];
        if (tm?.token) {
          const tokenInfo = await tm.getTokenInfo();
          status.tokens[network] = {
            address: tm.tokenAddress,
            symbol: tokenInfo?.symbol || 'FORTUNE',
            oracleBalance: tokenInfo?.oracleBalance || '0',
            price: tokenInfo?.price || '0',
            nadfunUrl: tm.getNadFunUrl()
          };
        }
      } catch (e) {
        status.networks[network] = { error: 'Connection failed' };
      }
    }
  }

  res.json(status);
});

// Get network info
app.get('/networks', (req, res) => {
  res.json({
    networks: Object.entries(NETWORKS).map(([name, config]) => ({
      name,
      oracleAddress: config.oracleAddress,
      rpcUrl: config.rpcUrl,
      explorer: config.explorer
    }))
  });
});

// Detect which network a transaction belongs to
async function detectNetwork(txhash) {
  for (const [network, provider] of Object.entries(providers)) {
    try {
      const receipt = await provider.getTransactionReceipt(txhash);
      if (receipt) return network;
    } catch (e) {
      continue;
    }
  }
  return null;
}

// Main fortune endpoint
app.post('/fortune', async (req, res) => {
  try {
    const { txhash, message, network: requestedNetwork, callback_url } = req.body;

    // Validation
    if (!txhash || !message) {
      return res.status(400).json({
        error: "Missing required fields: txhash, message"
      });
    }

    if (!/^0x[a-fA-F0-9]{64}$/.test(txhash)) {
      return res.status(400).json({ error: "Invalid txhash format" });
    }

    // Determine network
    let network = requestedNetwork;
    if (!network || !NETWORKS[network]) {
      network = await detectNetwork(txhash);
      if (!network) {
        return res.status(400).json({
          error: "Transaction not found on any supported network",
          hint: "Specify network explicitly: testnet or mainnet"
        });
      }
    }

    const config = NETWORKS[network];
    const provider = providers[network];
    const wallet = wallets[network];

    if (!provider || !wallet) {
      return res.status(500).json({ error: `Network ${network} not configured` });
    }

    // Prevent replay attacks
    if (processedTxs[network].has(txhash.toLowerCase())) {
      return res.status(400).json({ error: "Transaction already processed" });
    }

    // Get transaction
    const receipt = await provider.getTransactionReceipt(txhash);
    if (!receipt) {
      return res.status(400).json({ error: "Transaction not found or still pending" });
    }

    if (receipt.status !== 1) {
      return res.status(400).json({ error: "Transaction failed on-chain" });
    }

    const tx = await provider.getTransaction(txhash);

    // Verify sent to oracle
    if (tx.to?.toLowerCase() !== config.oracleAddress.toLowerCase()) {
      return res.status(400).json({
        error: "Transaction not sent to oracle address",
        expected: config.oracleAddress,
        received: tx.to
      });
    }

    // Check minimum amount
    const minAmount = BigInt(process.env.MIN_MON_AMOUNT || '1000000000000000');
    const amountIn = BigInt(tx.value.toString());
    if (amountIn < minAmount) {
      return res.status(400).json({
        error: `Minimum ${ethers.formatEther(minAmount)} MON required`,
        received: ethers.formatEther(amountIn)
      });
    }

    // Mark as processed
    processedTxs[network].add(txhash.toLowerCase());

    // Calculate fortune
    const luckScore = calculateLuckScore(amountIn, message);
    const returnAmount = calculateReturn(amountIn, luckScore);
    const fortuneMessage = selectFortune(message, luckScore);

    // Send MON back
    let returnTxHash = null;
    let returnStatus = 'pending';

    try {
      if (returnAmount > 0) {
        const returnTx = await wallet.sendTransaction({
          to: tx.from,
          value: returnAmount,
          gasLimit: 21000
        });
        returnTxHash = returnTx.hash;

        // Wait briefly for confirmation
        const receipt = await Promise.race([
          returnTx.wait(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), 30000)
          )
        ]);

        returnStatus = receipt?.status === 1 ? 'confirmed' : 'failed';
      } else {
        returnStatus = 'none';
      }
    } catch (sendError) {
      console.error('Failed to send return transaction:', sendError);
      returnStatus = 'failed';
    }

    // Reward with FORTUNE tokens if available
    let tokenReward = null;
    const tokenManager = tokenManagers[network];
    if (tokenManager?.token) {
      try {
        tokenReward = await tokenManager.rewardWithTokens(
          tx.from,
          luckScore,
          ethers.formatEther(amountIn)
        );
      } catch (tokenError) {
        console.error('Token reward failed (non-critical):', tokenError.message);
      }
    }

    const response = {
      success: true,
      fortune: fortuneMessage,
      luck_score: luckScore,
      luck_tier: getLuckTier(luckScore),
      network: network,
      mon_received: ethers.formatEther(amountIn),
      mon_sent: ethers.formatEther(returnAmount),
      multiplier: Number(returnAmount) / Number(amountIn),
      txhash_return: returnTxHash,
      return_status: returnStatus,
      token_reward: tokenReward ? {
        amount: tokenReward.amount,
        txhash: tokenReward.txHash,
        token_address: tokenManager.tokenAddress,
        multiplier: tokenReward.multiplier
      } : null,
      original_txhash: txhash,
      sender: tx.from,
      oracle_address: config.oracleAddress,
      explorer_url: `${config.explorer}/tx/${txhash}`,
      timestamp: new Date().toISOString()
    };

    // Async callback if provided
    if (callback_url) {
      sendCallback(callback_url, response).catch(console.error);
    }

    res.json(response);

  } catch (error) {
    console.error('Fortune request failed:', error);
    res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
});

// Helper functions
function calculateLuckScore(amount, message) {
  const amountInMon = Number(amount) / 1e18;
  const amountFactor = Math.min(30, Math.floor(amountInMon * 10));
  const messageHash = crypto.createHash('sha256').update(message).digest('hex');
  const entropy = parseInt(messageHash.substring(0, 4), 16) % 21;
  const sentiment = analyzeSentiment(message);
  const daySeed = Math.floor(Date.now() / 86400000);
  const mood = 20 + (daySeed % 21);
  const timeFactor = Date.now() % 11;

  const total = amountFactor + entropy + sentiment + mood + timeFactor;
  return Math.min(100, Math.max(0, total));
}

function analyzeSentiment(message) {
  const positive = ['good', 'great', 'success', 'win', 'yes', 'love', 'happy', 'luck', 'deploy', 'launch'];
  const negative = ['bad', 'fail', 'lose', 'no', 'hate', 'sad', 'unlucky', 'worried', 'afraid', 'delay'];

  const lower = message.toLowerCase();
  let score = 0;

  positive.forEach(word => { if (lower.includes(word)) score++; });
  negative.forEach(word => { if (lower.includes(word)) score--; });

  return Math.max(-10, Math.min(10, score * 2));
}

function calculateReturn(amountIn, luckScore) {
  const tiers = [
    { min: 0, max: 20, multiplier: 0 },
    { min: 21, max: 40, multiplier: 0.5 },
    { min: 41, max: 60, multiplier: 1 },
    { min: 61, max: 80, multiplier: 1.5 },
    { min: 81, max: 95, multiplier: 2 },
    { min: 96, max: 100, multiplier: 3 }
  ];

  const tier = tiers.find(t => luckScore >= t.min && luckScore <= t.max);
  const multiplier = tier ? tier.multiplier : 1;

  const maxReturn = BigInt(process.env.MAX_RETURN || '10000000000000000000');
  const returnAmount = (amountIn * BigInt(Math.floor(multiplier * 100))) / BigInt(100);

  return returnAmount > maxReturn ? maxReturn : returnAmount;
}

function selectFortune(message, luckScore) {
  const tier = getLuckTier(luckScore);
  const pool = fortunes[tier];

  const seed = crypto.createHash('sha256')
    .update(message + Date.now().toString())
    .digest('hex');
  const index = parseInt(seed.substring(0, 8), 16) % pool.length;

  return pool[index];
}

function getLuckTier(score) {
  if (score <= 20) return 'bad';
  if (score <= 40) return 'poor';
  if (score <= 60) return 'neutral';
  if (score <= 80) return 'good';
  return 'excellent';
}

async function sendCallback(url, data) {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.ok;
  } catch (error) {
    console.error('Callback failed:', error);
    return false;
  }
}

// Cleanup old processed txs
setInterval(() => {
  Object.keys(processedTxs).forEach(network => {
    if (processedTxs[network].size > 10000) {
      console.log(`Clearing old ${network} transactions`);
      processedTxs[network].clear();
    }
  });
}, 3600000);

// ==================== TOKEN ENDPOINTS ====================

// Get FORTUNE token info
app.get('/token/info', async (req, res) => {
  try {
    const { network = 'testnet' } = req.query;
    const manager = tokenManagers[network];
    
    if (!manager || !manager.token) {
      return res.status(404).json({
        error: 'FORTUNE token not deployed on this network',
        network,
        deployUrl: `/token/deploy?network=${network}`
      });
    }

    const info = await manager.getTokenInfo();
    res.json({
      success: true,
      ...info,
      nadfunUrl: manager.getNadFunUrl()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Deploy FORTUNE token (admin only - requires API key)
app.post('/token/deploy', async (req, res) => {
  try {
    const { network = 'testnet', initialBuy = '0.01', api_key } = req.body;
    
    // Simple API key check (in production, use proper auth)
    if (api_key !== process.env.ADMIN_API_KEY) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const manager = tokenManagers[network];
    if (!manager) {
      return res.status(500).json({ error: `Network ${network} not configured` });
    }

    const result = await manager.deployToken(initialBuy);
    
    // Update env for future restarts
    const envVar = `${network.toUpperCase()}_FORTUNE_TOKEN_ADDRESS`;
    console.log(`⚠️  Add to .env: ${envVar}=${result.tokenAddress}`);
    
    res.json({
      success: true,
      ...result,
      network,
      explorerUrl: manager.getExplorerUrl(result.txHash),
      nadfunUrl: manager.getNadFunUrl(),
      envVariable: `${envVar}=${result.tokenAddress}`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Buy FORTUNE tokens
app.post('/token/buy', async (req, res) => {
  try {
    const { network = 'testnet', monAmount, minTokens = 0 } = req.body;
    
    if (!monAmount || parseFloat(monAmount) <= 0) {
      return res.status(400).json({ error: 'Invalid MON amount' });
    }

    const manager = tokenManagers[network];
    if (!manager || !manager.token) {
      return res.status(404).json({ error: 'Token not available' });
    }

    const result = await manager.buyTokens(monAmount, minTokens);
    res.json({
      success: true,
      ...result,
      network
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get token price
app.get('/token/price', async (req, res) => {
  try {
    const { network = 'testnet', amount = 1 } = req.query;
    const manager = tokenManagers[network];
    
    if (!manager || !manager.token) {
      return res.status(404).json({ error: 'Token not available' });
    }

    const [buyPrice, sellPrice, info] = await Promise.all([
      manager.getBuyPrice(amount),
      manager.getSellPrice(amount),
      manager.getTokenInfo()
    ]);

    res.json({
      success: true,
      tokenAmount: amount,
      buyPrice: buyPrice || 'N/A',
      sellPrice: sellPrice || 'N/A',
      currentPrice: info?.price || 'N/A',
      marketCap: info?.marketCap || 'N/A',
      network
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get luck leaderboard (simulated - would use DB in production)
app.get('/leaderboard', async (req, res) => {
  try {
    const { network = 'testnet', limit = 10 } = req.query;
    
    // This would query a database in production
    // For now, return mock data structure
    res.json({
      success: true,
      network,
      leaderboard: [],
      message: 'Leaderboard coming soon - requires database integration'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// AI Agent coordination endpoint
app.post('/agent/consult', async (req, res) => {
  try {
    const { 
      agent_id, 
      query, 
      txhash, 
      network = 'testnet',
      callback_url,
      preferred_response = 'fortune' // 'fortune', 'token', or 'both'
    } = req.body;

    if (!agent_id || !query) {
      return res.status(400).json({ 
        error: 'Missing required fields: agent_id, query' 
      });
    }

    // If no txhash provided, return guidance
    if (!txhash) {
      const manager = tokenManagers[network];
      const oracleAddress = NETWORKS[network]?.oracleAddress;
      
      return res.json({
        success: false,
        action_required: 'SEND_MON',
        message: 'To consult the oracle, first send MON to the oracle address',
        oracle_address: oracleAddress,
        network,
        instructions: {
          step1: `Send MON to ${oracleAddress}`,
          step2: 'Use the returned txhash in your next request',
          step3: 'Include your question in the query field'
        },
        token_info: manager?.token ? await manager.getTokenInfo() : null
      });
    }

    // Process the fortune request
    // Reuse the existing /fortune logic
    const fortuneReq = { 
      body: { txhash, message: query, network, callback_url } 
    };
    
    // Mock response for now - in production would call the fortune logic
    res.json({
      success: true,
      agent_id,
      consultation: {
        query,
        fortune: 'Processing...',
        recommendation: 'Use /fortune endpoint with your txhash'
      },
      endpoints: {
        fortune: '/fortune',
        token_info: '/token/info',
        token_buy: '/token/buy',
        health: '/health'
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🔮 MON Fortune Oracle running on port ${PORT}`);
  console.log('Networks configured:');
  Object.entries(NETWORKS).forEach(([name, config]) => {
    if (config.oracleAddress) {
      console.log(`  ${name}: ${config.oracleAddress}`);
    }
  });
  console.log('Tokens configured:');
  Object.entries(tokenManagers).forEach(([name, tm]) => {
    if (tm.tokenAddress) {
      console.log(`  ${name}: ${tm.tokenAddress}`);
    } else {
      console.log(`  ${name}: Not deployed (use POST /token/deploy)`);
    }
  });
});
