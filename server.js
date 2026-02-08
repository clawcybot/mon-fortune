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

// Track processed transactions
const processedTxs = new Set();

// Network config
const NETWORK = {
  name: 'testnet',
  rpcUrl: process.env.TESTNET_RPC || 'https://testnet-rpc.monad.xyz',
  oracleAddress: process.env.TESTNET_ORACLE_ADDRESS,
  explorer: 'https://testnet.monadexplorer.com'
};

// Initialize provider and wallet
const provider = new ethers.JsonRpcProvider(NETWORK.rpcUrl);
const wallet = new ethers.Wallet(process.env.ORACLE_PRIVATE_KEY, provider);

// Fortune messages
const fortunes = {
  excellent: ["The Monad smiles upon you! 🌟", "Destiny calls your name! ✨", "Legendary luck! 💎"],
  good: ["Fortune favors the brave! 🍀", "Good omens gather! 🌈", "Success is within reach! 🎯"],
  neutral: ["The future is unwritten... 📖", "Balance in all things. ⚖️", "Trust yourself. 🧘"],
  poor: ["Dark clouds gather... ⛈️", "Tread carefully. 🐢", "Wait for better times. 🌑"],
  bad: ["The void stares back... 🕳️", "Turn back while you can! ⚠️", "Not today. 🚫"]
};

// Health check
app.get('/health', async (req, res) => {
  const balance = await provider.getBalance(NETWORK.oracleAddress);
  res.json({
    status: 'ok',
    address: NETWORK.oracleAddress,
    balance: ethers.formatEther(balance) + ' MON'
  });
});

// Main fortune endpoint
app.post('/fortune', async (req, res) => {
  try {
    const { txhash, message } = req.body;

    if (!txhash || !message) {
      return res.status(400).json({ error: "Missing txhash or message" });
    }

    if (!/^0x[a-fA-F0-9]{64}$/.test(txhash)) {
      return res.status(400).json({ error: "Invalid txhash" });
    }

    // Prevent replays
    if (processedTxs.has(txhash.toLowerCase())) {
      return res.status(400).json({ error: "Already processed" });
    }

    // Verify transaction
    const receipt = await provider.getTransactionReceipt(txhash);
    if (!receipt || receipt.status !== 1) {
      return res.status(400).json({ error: "Transaction not found or failed" });
    }

    const tx = await provider.getTransaction(txhash);
    if (tx.to?.toLowerCase() !== NETWORK.oracleAddress.toLowerCase()) {
      return res.status(400).json({ error: "Not sent to oracle" });
    }

    // Check minimum (0.001 MON)
    const minAmount = BigInt('1000000000000000');
    if (BigInt(tx.value.toString()) < minAmount) {
      return res.status(400).json({ error: "Minimum 0.001 MON required" });
    }

    processedTxs.add(txhash.toLowerCase());

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
      mon_received: ethers.formatEther(tx.value),
      mon_sent: ethers.formatEther(returnAmount),
      multiplier: Number(returnAmount) / Number(tx.value),
      txhash_return: returnTxHash,
      sender: tx.from,
      explorer_url: `${NETWORK.explorer}/tx/${txhash}`
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🔮 Fortune Oracle on port ${PORT}`);
  console.log(`Address: ${NETWORK.oracleAddress}`);
});
