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

// 🏮 CáiShén (God of Wealth) Fortune Outcomes
const OUTCOMES = [
  { name: "🥟 IOU Dumplings", tier: 1, minMult: 0.1, maxMult: 0.5, probability: 0.40 },
  { name: "🔄 Luck Recycled", tier: 2, minMult: 0.5, maxMult: 0.8, probability: 0.30 },
  { name: "💰 Small Win", tier: 3, minMult: 0.8, maxMult: 1.2, probability: 0.15 },
  { name: "🐷 Golden Pig", tier: 4, minMult: 1.2, maxMult: 2.0, probability: 0.10 },
  { name: "🐴 Horse Year LFG", tier: 5, minMult: 2.0, maxMult: 3.0, probability: 0.04 },
  { name: "🎰 SUPER 888 JACKPOT", tier: 6, minMult: 3.0, maxMult: 8.88, probability: 0.01 }
];

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

// 🏮 Check if amount contains lucky 8 (八 bā - prosperity)
function containsEight(amountStr) {
  return amountStr.includes('8');
}

// 💀 Check for death number 4 (四 sì - death)
function hasMultipleFours(amountStr) {
  const fours = (amountStr.match(/4/g) || []).length;
  return fours >= 2;
}

// 📅 Check forbidden days (4th, 14th, 24th)
function isForbiddenDay() {
  const day = new Date().getDate();
  return day === 4 || day === 14 || day === 24;
}

// 👻 Check ghost hour (4:44 AM/PM)
function isGhostHour() {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  return (hour === 4 || hour === 16) && minute === 44;
}

// 📆 Check Tuesday penalty
function isTuesday() {
  return new Date().getDay() === 2; // 0 = Sunday, 2 = Tuesday
}

// 🎲 Calculate CáiShén fortune with all superstitions
function calculateCaichenFortune(amountWei, txhash, message) {
  const amountMon = Number(amountWei) / 1e18;
  const amountStr = amountMon.toString();
  
  // Check requirements
  const hasEight = containsEight(amountStr);
  const minOffering = amountMon >= 8;
  
  if (!minOffering) {
    return {
      outcome: { name: "⛔ Offering Too Small", tier: 0, minMult: 0, maxMult: 0 },
      multiplier: 0,
      message: "CáiShén requires a minimum offering of 8 $MON",
      blessing: "恭喜發財 - Wishing you prosperity (try again with 8+ MON)"
    };
  }
  
  if (!hasEight) {
    return {
      outcome: { name: "⛔ Missing Lucky 8", tier: 0, minMult: 0, maxMult: 0 },
      multiplier: 0,
      message: "Your offering must contain the digit '8' to please CáiShén",
      blessing: "八 (bā) sounds like 發 (fā) - prosperity requires 8!"
    };
  }
  
  // Calculate base luck from amount and message
  const msgHash = crypto.createHash('sha256').update(txhash + message).digest('hex');
  const entropy = parseInt(msgHash.substring(0, 8), 16) / 0xFFFFFFFF;
  
  // Apply superstition penalties
  let penalty = 1.0;
  let penaltiesApplied = [];
  
  if (hasMultipleFours(amountStr)) {
    penalty *= 0.5;
    penaltiesApplied.push("Death Numbers (multiple 4s)");
  }
  
  if (isForbiddenDay()) {
    penalty *= 0.5;
    penaltiesApplied.push("Forbidden Day (4th/14th/24th)");
  }
  
  if (isGhostHour()) {
    penalty *= 0.5;
    penaltiesApplied.push("Ghost Hour (4:44)");
  }
  
  if (isTuesday()) {
    penalty *= 0.5;
    penaltiesApplied.push("Tuesday Penalty");
  }
  
  // Calculate weighted outcome
  const adjustedEntropy = entropy * penalty;
  
  // Select outcome based on probability
  let selectedOutcome;
  let cumulative = 0;
  for (const outcome of OUTCOMES) {
    cumulative += outcome.probability;
    if (adjustedEntropy <= cumulative) {
      selectedOutcome = outcome;
      break;
    }
  }
  if (!selectedOutcome) selectedOutcome = OUTCOMES[OUTCOMES.length - 1];
  
  // Calculate multiplier within the outcome's range
  const range = selectedOutcome.maxMult - selectedOutcome.minMult;
  const multEntropy = parseInt(msgHash.substring(8, 16), 16) / 0xFFFFFFFF;
  const multiplier = selectedOutcome.minMult + (range * multEntropy);
  
  // Generate blessing message
  const blessings = [
    "恭喜發財 (Gōngxǐ fācái) - Wishing you prosperity!",
    "紅包拿來 (Hóngbāo ná lái) - Hand over the red envelope!",
    "財源滾滾 (Cái yuán gǔn gǔn) - May wealth flow in!",
    "大吉大利 (Dàjí dàlì) - Great luck and prosperity!",
    "年年有餘 (Nián nián yǒu yú) - Abundance year after year!"
  ];
  const blessing = blessings[Math.floor(entropy * blessings.length)];
  
  return {
    outcome: selectedOutcome,
    multiplier: multiplier,
    penaltiesApplied: penaltiesApplied,
    penaltyMultiplier: penalty,
    blessing: blessing,
    hasEight: hasEight,
    minOffering: minOffering
  };
}

// Main fortune endpoint - CáiShén God of Wealth
// ?network=testnet for testnet, defaults to mainnet
app.post('/fortune', async (req, res) => {
  try {
    const { txhash, message } = req.body;
    const networkParam = req.query.network;

    if (!txhash || !message) {
      return res.status(400).json({ error: "Missing txhash or message" });
    }

    if (!/^0x[a-fA-F0-9]{64}$/.test(txhash)) {
      return res.status(400).json({ error: "Invalid txhash" });
    }

    // Determine network - DEFAULT TO MAINNET
    let network = networkParam;
    if (!network) {
      // Default to mainnet, only use detected network if mainnet not configured
      if (providers['mainnet'] && NETWORKS['mainnet'].oracleAddress) {
        network = 'mainnet';
      } else {
        // Fall back to detection if mainnet not available
        network = await detectNetwork(txhash);
        if (!network) {
          return res.status(400).json({
            error: "Transaction not found",
            hint: "Use ?network=testnet for testnet"
          });
        }
      }
    }
    
    if (!NETWORKS[network]) {
      return res.status(400).json({ error: "Invalid network. Use 'testnet' or 'mainnet'" });
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
        error: "Not sent to CáiShén oracle",
        expected: config.oracleAddress,
        received: tx.to
      });
    }

    processedTxs[network].add(txhash.toLowerCase());

    // 🏮 Calculate CáiShén fortune
    const fortune = calculateCaichenFortune(tx.value.toString(), txhash, message);
    
    // Calculate return amount
    const returnAmount = fortune.multiplier > 0 
      ? (BigInt(tx.value.toString()) * BigInt(Math.floor(fortune.multiplier * 100))) / BigInt(100)
      : BigInt(0);

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
        await returnTx.wait();
        returnStatus = 'confirmed';
      } else {
        returnStatus = 'no_return';
      }
    } catch (e) {
      console.error('Return failed:', e);
      returnStatus = 'failed';
    }

    res.json({
      success: fortune.outcome.tier > 0,
      caishen: {
        outcome: fortune.outcome.name,
        tier: fortune.outcome.tier,
        blessing: fortune.blessing
      },
      offering: {
        amount: ethers.formatEther(tx.value),
        has_eight: fortune.hasEight,
        min_offering_met: fortune.minOffering
      },
      multiplier: fortune.multiplier,
      mon_received: ethers.formatEther(tx.value),
      mon_sent: ethers.formatEther(returnAmount),
      txhash_return: returnTxHash,
      return_status: returnStatus,
      superstitions: {
        penalties_applied: fortune.penaltiesApplied,
        penalty_multiplier: fortune.penaltyMultiplier,
        is_forbidden_day: isForbiddenDay(),
        is_ghost_hour: isGhostHour(),
        is_tuesday: isTuesday()
      },
      network: network,
      sender: tx.from,
      explorer_url: `${config.explorer}/tx/${txhash}`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

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
  console.log(`🏮 CáiShén (God of Wealth) Oracle running on port ${PORT}`);
  console.log('Networks configured:');
  Object.entries(NETWORKS).forEach(([name, config]) => {
    if (config.oracleAddress) {
      console.log(`  ${name}: ${config.oracleAddress}`);
    }
  });
  console.log('Rules: Minimum 8 $MON, must contain "8", watch out for 4s!');
});
