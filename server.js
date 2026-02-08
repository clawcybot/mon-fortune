require('dotenv').config();
const express = require('express');
const { ethers } = require('ethers');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100
});
app.use(limiter);

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
    explorer: 'https://testnet.monadexplorer.com',
    chainId: 10143
  },
  mainnet: {
    name: 'mainnet',
    rpcUrl: process.env.MAINNET_RPC || 'https://rpc.monad.xyz',
    oracleAddress: process.env.MAINNET_ORACLE_ADDRESS,
    explorer: 'https://monadexplorer.com',
    chainId: 10144
  }
};

// Initialize providers and wallets for configured networks
const providers = {};
const wallets = {};

Object.keys(NETWORKS).forEach(network => {
  if (NETWORKS[network].oracleAddress) {
    providers[network] = new ethers.JsonRpcProvider(NETWORKS[network].rpcUrl);
    wallets[network] = new ethers.Wallet(process.env.ORACLE_PRIVATE_KEY, providers[network]);
  }
});

// Fortune messages
const fortunes = {
  excellent: ["The Monad smiles upon you! 🌟", "Destiny calls your name! ✨", "Legendary luck! 💎"],
  good: ["Fortune favors the brave! 🍀", "Good omens gather! 🌈", "Success is within reach! 🎯"],
  neutral: ["The future is unwritten... 📖", "Balance in all things. ⚖️", "Trust yourself. 🧘"],
  poor: ["Dark clouds gather... ⛈️", "Tread carefully. 🐢", "Wait for better times. 🌑"],
  bad: ["The void stares back... 🕳️", "Turn back while you can! ⚠️", "Not today. 🚫"]
};

// Health check - shows both networks
app.get('/health', async (req, res) => {
  const status = {
    status: 'ok',
    networks: {}
  };

  for (const [network, config] of Object.entries(NETWORKS)) {
    if (providers[network]) {
      try {
        const balance = await providers[network].getBalance(config.oracleAddress);
        status.networks[network] = {
          address: config.oracleAddress,
          balance: ethers.formatEther(balance) + ' MON',
          rpc: config.rpcUrl,
          explorer: config.explorer
        };
      } catch (e) {
        status.networks[network] = { error: 'Connection failed' };
      }
    } else {
      status.networks[network] = { status: 'not configured' };
    }
  }

  res.json(status);
});

// Detect network from txhash
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

// Main fortune endpoint - uses query param: ?network=testnet
app.post('/fortune', async (req, res) => {
  try {
    const { txhash, message } = req.body;
    const networkParam = req.query.network; // ?network=testnet or ?network=mainnet

    if (!txhash || !message) {
      return res.status(400).json({ error: "Missing txhash or message" });
    }

    if (!/^0x[a-fA-F0-9]{64}$/.test(txhash)) {
      return res.status(400).json({ error: "Invalid txhash" });
    }

    // Determine network
    let network = networkParam;
    if (!network || !NETWORKS[network]) {
      network = await detectNetwork(txhash);
      if (!network) {
        return res.status(400).json({
          error: "Transaction not found on any supported network",
          hint: "Use ?network=testnet or ?network=mainnet"
        });
      }
    }

    const config = NETWORKS[network];
    const provider = providers[network];
    const wallet = wallets[network];

    if (!provider || !wallet) {
      return res.status(500).json({ error: `Network ${network} not configured` });
    }

    // Prevent replays
    if (processedTxs[network].has(txhash.toLowerCase())) {
      return res.status(400).json({ error: "Already processed" });
    }

    // Verify transaction
    const receipt = await provider.getTransactionReceipt(txhash);
    if (!receipt || receipt.status !== 1) {
      return res.status(400).json({ error: "Transaction not found or failed" });
    }

    const tx = await provider.getTransaction(txhash);
    if (tx.to?.toLowerCase() !== config.oracleAddress.toLowerCase()) {
      return res.status(400).json({ 
        error: "Not sent to oracle",
        expected: config.oracleAddress,
        received: tx.to
      });
    }

    // Check minimum (0.001 MON)
    const minAmount = BigInt('1000000000000000');
    if (BigInt(tx.value.toString()) < minAmount) {
      return res.status(400).json({ error: "Minimum 0.001 MON required" });
    }

    processedTxs[network].add(txhash.toLowerCase());

    // Calculate fortune
    const luckScore = calculateLuckScore(tx.value.toString(), message);
    const returnAmount = calculateReturn(BigInt(tx.value.toString()), luckScore);
    const fortuneMessage = selectFortune(luckScore);

    // Send MON back
    let returnTxHash = null;
    try {
      if (returnAmount > 0) {
        const returnTx = await wallet.sendTransaction({
          to: tx.from,
          value: returnAmount,
          gasLimit: 21000
        });
        returnTxHash = returnTx.hash;
        await returnTx.wait();
      }
    } catch (e) {
      console.error('Return failed:', e);
    }

    res.json({
      success: true,
      fortune: fortuneMessage,
      luck_score: luckScore,
      luck_tier: getLuckTier(luckScore),
      network: network,
      mon_received: ethers.formatEther(tx.value),
      mon_sent: ethers.formatEther(returnAmount),
      multiplier: Number(returnAmount) / Number(tx.value),
      txhash_return: returnTxHash,
      sender: tx.from,
      explorer_url: `${config.explorer}/tx/${txhash}`
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

function calculateLuckScore(amount, message) {
  const amountInMon = Number(amount) / 1e18;
  const amountFactor = Math.min(30, Math.floor(amountInMon * 10));
  const msgHash = crypto.createHash('sha256').update(message).digest('hex');
  const entropy = parseInt(msgHash.substring(0, 4), 16) % 21;
  const daySeed = Math.floor(Date.now() / 86400000);
  const mood = 20 + (daySeed % 21);
  return Math.min(100, Math.max(0, amountFactor + entropy + mood));
}

function calculateReturn(amountIn, luckScore) {
  const multipliers = [0, 0.5, 1, 1.5, 2, 3];
  const tier = Math.floor(luckScore / 20);
  const mult = multipliers[Math.min(tier, 5)];
  return (amountIn * BigInt(Math.floor(mult * 100))) / BigInt(100);
}

function selectFortune(luckScore) {
  const tier = getLuckTier(luckScore);
  const pool = fortunes[tier];
  return pool[Math.floor(Math.random() * pool.length)];
}

function getLuckTier(score) {
  if (score <= 20) return 'bad';
  if (score <= 40) return 'poor';
  if (score <= 60) return 'neutral';
  if (score <= 80) return 'good';
  return 'excellent';
}

// Cleanup old processed txs periodically
setInterval(() => {
  Object.keys(processedTxs).forEach(network => {
    if (processedTxs[network].size > 10000) {
      console.log(`Clearing old ${network} transactions`);
      processedTxs[network].clear();
    }
  });
}, 3600000);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🔮 Fortune Oracle running on port ${PORT}`);
  console.log('Networks configured:');
  Object.entries(NETWORKS).forEach(([name, config]) => {
    if (config.oracleAddress) {
      console.log(`  ${name}: ${config.oracleAddress}`);
    }
  });
});
