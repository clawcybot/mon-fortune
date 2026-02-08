---
name: mon-fortune-agent
version: 1.0.0
description: |
  Interact with the MON Fortune Oracle - send MON, receive fortunes with luck scores.
  Perfect for AI agents doing daily heartbeat checks, decision-making, or gamified interactions.
  Supports both testnet and mainnet.
author: clawcybot
homepage: https://github.com/clawcybot/mon-fortune
---

# 🔮 MON Fortune Oracle - AI Agent Skill

**Get daily fortunes from the Monad blockchain. Send MON, receive wisdom + luck scores.**

This skill enables AI agents to consult a fortune oracle on the Monad network. Perfect for:
- Daily heartbeat/health check rituals
- Decision-making assistance ("Should I proceed today?")
- Gamified agent interactions
- Testing Monad testnet integration

---

## 📋 Quick Reference

| Item | Testnet | Mainnet |
|------|---------|---------|
| **Oracle Address** | `0x3b77d476a15C77A776e542ac4C0f6484DAa6Aa3f` | *Coming soon* |
| **RPC** | `https://testnet-rpc.monad.xyz` | `https://rpc.monad.xyz` |
| **Min Amount** | 0.001 MON | 0.001 MON |
| **Explorer** | https://testnet.monadexplorer.com | https://monadexplorer.com |

---

## 🚀 Quick Start (3 Steps)

### Step 1: Get Testnet MON (Free)

```bash
# Request from agent faucet
curl -X POST https://agents.devnads.com/v1/faucet \
  -H "Content-Type: application/json" \
  -d '{"address": "YOUR_WALLET_ADDRESS", "chainId": 10143}'
```

**Response:**
```json
{
  "txHash": "0x...",
  "amount": "1000000000000000000",
  "chain": "Monad Testnet"
}
```

**Note:** You get 1 MON per request. Rate limited per address.

---

### Step 2: Send MON to Oracle

```bash
# Using cast (foundry)
cast send 0x3b77d476a15C77A776e542ac4C0f6484DAa6Aa3f \
  --value 0.01ether \
  --rpc-url https://testnet-rpc.monad.xyz \
  --private-key $PRIVATE_KEY
```

**Or using Node.js/ethers:**
```javascript
const { ethers } = require('ethers');

const provider = new ethers.JsonRpcProvider('https://testnet-rpc.monad.xyz');
const wallet = new ethers.Wallet(privateKey, provider);

const tx = await wallet.sendTransaction({
  to: '0x3b77d476a15C77A776e542ac4C0f6484DAa6Aa3f',
  value: ethers.parseEther('0.01')  // 0.01 MON
});

const receipt = await tx.wait();
console.log('TxHash:', receipt.hash);
```

**Note:** Save the `tx.hash` - you'll need it for the fortune API!

---

### Step 3: Call Fortune API

```bash
# Testnet
curl -X POST "http://localhost:3000/fortune?network=testnet" \
  -H "Content-Type: application/json" \
  -d '{
    "txhash": "0xYOUR_TX_HASH",
    "message": "Should I deploy my contract today?"
  }'

# Mainnet
curl -X POST "http://localhost:3000/fortune?network=mainnet" \
  -H "Content-Type: application/json" \
  -d '{
    "txhash": "0xYOUR_TX_HASH",
    "message": "Should I deploy my contract today?"
  }'
```

**Or using JavaScript:**
```javascript
// Testnet
const response = await fetch('http://localhost:3000/fortune?network=testnet', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    txhash: '0xYOUR_TX_HASH',
    message: 'Should I deploy my contract today?'
  })
});

// Mainnet
const response = await fetch('http://localhost:3000/fortune?network=mainnet', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    txhash: '0xYOUR_TX_HASH',
    message: 'Should I deploy my contract today?'
  })
});

const fortune = await response.json();
console.log(fortune.fortune);  // "The Monad smiles upon you!"
console.log(fortune.luck_score);  // 87
console.log(fortune.network);  // "testnet" or "mainnet"
```

---

## 📡 API Reference

### POST `/fortune?network={testnet|mainnet}`

Get a fortune for your MON transaction.

**Query Parameters:**
| Param | Required | Description |
|-------|----------|-------------|
| `network` | No* | `testnet` or `mainnet` (auto-detected if omitted) |

\* If network is not specified, the API will auto-detect based on the txhash.

**Request Body:**
```json
{
  "txhash": "0xabc...",      // Required: Transaction hash from sending MON
  "message": "Your question" // Required: Your question for the oracle
}
```

**Response:**
```json
{
  "success": true,
  "fortune": "The Monad smiles upon you!",
  "luck_score": 87,
  "luck_tier": "excellent",
  "network": "testnet",
  "mon_received": "0.01",
  "mon_sent": "0.02",
  "multiplier": 2.0,
  "txhash_return": "0xdef...",
  "sender": "0x...",
  "explorer_url": "https://testnet.monadexplorer.com/tx/0xabc..."
}
```

**Luck Tiers:**
| Score | Tier | MON Return | Meaning |
|-------|------|------------|---------|
| 0-20 | Bad | 0x | Avoid today |
| 21-40 | Poor | 0.5x | Proceed with caution |
| 41-60 | Neutral | 1x (refund) | Uncertain |
| 61-80 | Good | 1.5x | Favorable |
| 81-95 | Excellent | 2x | Great timing! |
| 96-100 | Jackpot | 3x | Perfect moment! |

---

### GET `/health`

Check oracle status and balance.

```bash
curl http://localhost:3000/health
```

**Response:**
```json
{
  "status": "ok",
  "address": "0x3b77d476a15C77A776e542ac4C0f6484DAa6Aa3f",
  "balance": "5.5 MON"
}
```

---

## 🤖 AI Agent Integration Examples

### Daily Fortune Cron Job

```javascript
// fortune-daily.js
const { ethers } = require('ethers');

const CONFIG = {
  oracleAddress: '0x3b77d476a15C77A776e542ac4C0f6484DAa6Aa3f',
  rpcUrl: 'https://testnet-rpc.monad.xyz',
  apiUrl: 'http://localhost:3000',
  privateKey: process.env.AGENT_PRIVATE_KEY,
  network: 'testnet'  // or 'mainnet'
};

async function getDailyFortune() {
  // Setup wallet
  const provider = new ethers.JsonRpcProvider(CONFIG.rpcUrl);
  const wallet = new ethers.Wallet(CONFIG.privateKey, provider);
  
  // 1. Send MON to oracle (0.01 MON)
  console.log('🔮 Consulting the MON Fortune Oracle...');
  const tx = await wallet.sendTransaction({
    to: CONFIG.oracleAddress,
    value: ethers.parseEther('0.01')
  });
  
  const receipt = await tx.wait();
  console.log('💸 Sent 0.01 MON, tx:', receipt.hash);
  
  // 2. Call fortune API with network query param
  const response = await fetch(`${CONFIG.apiUrl}/fortune?network=${CONFIG.network}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      txhash: receipt.hash,
      message: 'What does today hold for my operations?'
    })
  });
  
  const result = await response.json();
  
  // 3. Interpret result
  console.log('🎲 Luck Score:', result.luck_score, '/ 100');
  console.log('✨ Fortune:', result.fortune);
  console.log('💰 Returned:', result.mon_sent, 'MON');
  console.log('🌐 Network:', result.network);
  
  // 4. Decision making
  if (result.luck_score >= 60) {
    console.log('✅ Good fortune! Proceed with operations.');
    return { proceed: true, ...result };
  } else {
    console.log('⚠️ Unfavorable. Consider delaying non-critical tasks.');
    return { proceed: false, ...result };
  }
}

// Run daily
getDailyFortune().catch(console.error);
```

**Cron setup:**
```bash
# Run every day at 9 AM on testnet
0 9 * * * cd /path/to/agent && NETWORK=testnet node fortune-daily.js >> fortune.log 2>&1

# Run every day at 9 AM on mainnet
0 9 * * * cd /path/to/agent && NETWORK=mainnet node fortune-daily.js >> fortune.log 2>&1
```

---

### Decision Helper Function

```javascript
async function shouldProceedToday(privateKey, question, network = 'testnet') {
  const rpcUrl = network === 'testnet' 
    ? 'https://testnet-rpc.monad.xyz' 
    : 'https://rpc.monad.xyz';
  const oracleAddress = network === 'testnet'
    ? '0x3b77d476a15C77A776e542ac4C0f6484DAa6Aa3f'
    : process.env.MAINNET_ORACLE_ADDRESS;
    
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);
  
  // Send MON
  const tx = await wallet.sendTransaction({
    to: oracleAddress,
    value: ethers.parseEther('0.005')  // Small amount for quick decisions
  });
  await tx.wait();
  
  // Get fortune with network query param
  const response = await fetch(`http://localhost:3000/fortune?network=${network}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ txhash: tx.hash, message: question })
  });
  
  const result = await response.json();
  
  return {
    shouldProceed: result.luck_score >= 60,
    confidence: result.luck_score,
    fortune: result.fortune,
    network: result.network,
    details: result
  };
}

// Usage - Testnet
const decision = await shouldProceedToday(
  process.env.PRIVATE_KEY,
  'Should I execute the large trade today?',
  'testnet'
);

// Usage - Mainnet
const decision = await shouldProceedToday(
  process.env.PRIVATE_KEY,
  'Should I execute the large trade today?',
  'mainnet'
);

if (decision.shouldProceed) {
  console.log('🚀 Proceeding with confidence:', decision.confidence);
} else {
  console.log('⏳ Waiting for better timing');
}
```

---

### Python Agent Integration

```python
import requests
from web3 import Web3
import os

class MonFortuneClient:
    def __init__(self, private_key, network="testnet"):
        self.private_key = private_key
        self.network = network
        
        # Network config
        if network == "testnet":
            self.rpc_url = "https://testnet-rpc.monad.xyz"
            self.oracle_address = "0x3b77d476a15C77A776e542ac4C0f6484DAa6Aa3f"
            self.api_url = "http://localhost:3000"
        else:
            self.rpc_url = "https://rpc.monad.xyz"
            self.oracle_address = ""  # Set when deployed
            self.api_url = "http://localhost:3000"
        
        # Setup Web3
        self.w3 = Web3(Web3.HTTPProvider(self.rpc_url))
        self.account = self.w3.eth.account.from_key(private_key)
    
    def consult_oracle(self, question: str, amount: float = 0.01):
        """Send MON and get fortune"""
        
        # 1. Send MON to oracle
        tx = {
            'to': self.oracle_address,
            'value': self.w3.to_wei(amount, 'ether'),
            'gas': 21000,
            'gasPrice': self.w3.to_wei('50', 'gwei'),
            'nonce': self.w3.eth.get_transaction_count(self.account.address),
            'chainId': 10143 if self.network == "testnet" else 10144
        }
        
        signed = self.w3.eth.account.sign_transaction(tx, self.private_key)
        tx_hash = self.w3.eth.send_raw_transaction(signed.rawTransaction)
        receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)
        
        print(f"💸 Sent {amount} MON, tx: {receipt.transactionHash.hex()}")
        
        # 2. Call fortune API with network query param
        response = requests.post(
            f"{self.api_url}/fortune?network={self.network}",
            json={
                "txhash": receipt.transactionHash.hex(),
                "message": question
            }
        )
        
        return response.json()
    
    def check_health(self):
        """Check oracle status"""
        response = requests.get(f"{self.api_url}/health")
        return response.json()
    
    def should_proceed(self, question: str, threshold: int = 60) -> bool:
        """Simple yes/no decision helper"""
        result = self.consult_oracle(question)
        return result.get("luck_score", 0) >= threshold


# Usage
client = MonFortuneClient(os.getenv("PRIVATE_KEY"), "testnet")

# Daily fortune
fortune = client.consult_oracle("How should I approach today?")
print(f"🎲 Score: {fortune['luck_score']}/100")
print(f"✨ Fortune: {fortune['fortune']}")

# Quick decision
if client.should_proceed("Should I deploy now?"):
    print("🚀 Deploying...")
else:
    print("⏳ Waiting...")
```

---

## 🔧 Setup Checklist

1. **Get testnet MON:**
   ```bash
   curl -X POST https://agents.devnads.com/v1/faucet \
     -H "Content-Type: application/json" \
     -d '{"address": "YOUR_ADDRESS", "chainId": 10143}'
   ```

2. **Verify balance:**
   ```bash
   cast balance YOUR_ADDRESS --rpc-url https://testnet-rpc.monad.xyz
   ```

3. **Test the API:**
   ```bash
   curl http://localhost:3000/health
   ```

4. **Send test transaction and get fortune**

5. **Set up cron job for daily runs**

---

## ⚠️ Important Notes

- **Minimum amount:** 0.001 MON required
- **Rate limiting:** 100 requests/minute per IP
- **No replays:** Each txhash can only be used once
- **Gas:** Transactions need ~21,000 gas
- **Testnet:** Free MON from faucet, use for testing
- **Mainnet:** Real MON required (not yet deployed)

---

## 🔗 Links

- **GitHub:** https://github.com/clawcybot/mon-fortune
- **Testnet Explorer:** https://testnet.monadexplorer.com
- **Monad Docs:** https://docs.monad.xyz

---

## 💡 Ideas for AI Agents

- **Daily standup ritual:** Get fortune every morning
- **Deployment guard:** Check fortune before major operations
- **Trading assistant:** Use luck score for position sizing
- **Community engagement:** Share fortunes with users
- **Heartbeat health check:** Use `/health` to monitor oracle
- **Gamified interactions:** Reward users based on luck scores

---

*Built for the Moltiverse Hackathon - Agent + Token Track* 🔮
