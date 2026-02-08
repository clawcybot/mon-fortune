---
name: caishen-oracle
version: 2.0.0
description: |
  🏮 CáiShén (God of Wealth) Oracle - Send MON offerings, receive fortunes.
  Minimum 8 $MON required, must contain digit "8". Watch out for death numbers (4s)!
  Perfect for AI agents seeking divine guidance on Monad blockchain.
author: clawcybot
homepage: https://github.com/clawcybot/mon-fortune
---

# 🏮 CáiShén (God of Wealth) Oracle

** consult the God of Wealth on Monad. Send offerings, receive fortunes! **

CáiShén (財神) is the Chinese God of Wealth. Make an offering of at least 8 $MON containing the digit "8" to receive his blessing. But beware the unlucky number 4 (四 sì - death) and forbidden times!

---

## 🎯 How to Play

### Requirements
| Rule | Value |
|------|-------|
| **Minimum Offering** | 8 $MON |
| **Must Contain** | Digit "8" somewhere in amount |
| **Lucky Number** | 八 (bā) - sounds like 發 (fā) prosperity |
| **Unlucky Number** | 四 (sì) - sounds like 死 (sǐ) death |

### 🎲 Outcomes

| Outcome | Tier | Multiplier | Probability |
|---------|------|------------|-------------|
| 🥟 IOU Dumplings | 1 | 0.1x - 0.5x | 40% |
| 🔄 Luck Recycled | 2 | 0.5x - 0.8x | 30% |
| 💰 Small Win | 3 | 0.8x - 1.2x | 15% |
| 🐷 Golden Pig | 4 | 1.2x - 2.0x | 10% |
| 🐴 Horse Year LFG | 5 | 2.0x - 3.0x | 4% |
| 🎰 SUPER 888 JACKPOT | 6 | 3.0x - 8.88x | 1% |

### ⚠️ Superstitions & Forbidden Times

| Penalty | Condition | Effect |
|---------|-----------|--------|
| 💀 Death Numbers | Multiple 4s in amount | Win prob ÷ 2 |
| 📅 Forbidden Days | 4th, 14th, 24th of month | Win prob ÷ 2 |
| 👻 Ghost Hour | 4:44 AM/PM | Win prob ÷ 2 |
| 📆 Tuesday | Any Tuesday | Win prob ÷ 2 |

**Penalties stack!** Multiple penalties = multiple divisions.

---

## 📋 Quick Reference

| Item | Testnet | Mainnet |
|------|---------|---------|
| **CáiShén Address** | `0x3b77d476a15C77A776e542ac4C0f6484DAa6Aa3f` | *Coming soon* |
| **RPC** | `https://testnet-rpc.monad.xyz` | `https://rpc.monad.xyz` |
| **Min Offering** | 8 MON | 8 MON |
| **Must Include** | Digit "8" | Digit "8" |
| **Explorer** | https://testnet.monadexplorer.com | https://monadexplorer.com |

---

## 🚀 Quick Start

### Step 1: Get Testnet MON

```bash
curl -X POST https://agents.devnads.com/v1/faucet \
  -H "Content-Type: application/json" \
  -d '{"address": "YOUR_WALLET_ADDRESS", "chainId": 10143}'
```

### Step 2: Make Offering to CáiShén

```bash
# Offering of 8.88 MON (lucky!)
cast send 0x3b77d476a15C77A776e542ac4C0f6484DAa6Aa3f \
  --value 8.88ether \
  --rpc-url https://testnet-rpc.monad.xyz \
  --private-key $PRIVATE_KEY
```

**Lucky amounts:** 8, 8.8, 8.88, 18, 28, 80, 88, 888...

**Avoid:** 4, 4.4, 14, 24, 40, 44, 444... (death numbers)

### Step 3: Receive Fortune

```bash
# Testnet
curl -X POST "http://localhost:3000/fortune?network=testnet" \
  -H "Content-Type: application/json" \
  -d '{"txhash": "0xYOUR_TX_HASH", "message": "Should I deploy today?"}'

# Mainnet (default if no network specified)
curl -X POST "http://localhost:3000/fortune" \
  -H "Content-Type: application/json" \
  -d '{"txhash": "0xYOUR_TX_HASH", "message": "Should I deploy today?"}'
```

---

## 📡 API Reference

### POST `/fortune?network={testnet|mainnet}`

Consult CáiShén for your fortune.

**Query Parameters:**
- `network` - `testnet` or `mainnet`. **Defaults to mainnet** if not specified.

**Request:**
```json
{
  "txhash": "0xabc...",
  "message": "Your question for CáiShén"
}
```

**Success Response:**
```json
{
  "success": true,
  "caishen": {
    "outcome": "🎰 SUPER 888 JACKPOT",
    "tier": 6,
    "blessing": "恭喜發財 (Gōngxǐ fācái) - Wishing you prosperity!"
  },
  "offering": {
    "amount": "8.88",
    "has_eight": true,
    "min_offering_met": true
  },
  "multiplier": 5.55,
  "mon_received": "8.88",
  "mon_sent": "49.28",
  "txhash_return": "0xdef...",
  "return_status": "confirmed",
  "superstitions": {
    "penalties_applied": ["Tuesday Penalty"],
    "penalty_multiplier": 0.5,
    "is_forbidden_day": false,
    "is_ghost_hour": false,
    "is_tuesday": true
  },
  "network": "testnet",
  "sender": "0x...",
  "explorer_url": "https://testnet.monadexplorer.com/tx/0xabc...",
  "timestamp": "2026-02-08T07:00:00Z"
}
```

**Failure Response (no 8 in amount):**
```json
{
  "success": false,
  "caishen": {
    "outcome": "⛔ Missing Lucky 8",
    "tier": 0,
    "blessing": "八 (bā) sounds like 發 (fā) - prosperity requires 8!"
  },
  "offering": {
    "amount": "10.00",
    "has_eight": false,
    "min_offering_met": true
  },
  "multiplier": 0,
  "mon_received": "10.0",
  "mon_sent": "0",
  ...
}
```

---

## 🤖 AI Agent Integration

### Daily CáiShén Ritual (JavaScript)

```javascript
const { ethers } = require('ethers');

const CONFIG = {
  caishenAddress: '0x3b77d476a15C77A776e542ac4C0f6484DAa6Aa3f',
  rpcUrl: 'https://testnet-rpc.monad.xyz',
  apiUrl: 'http://localhost:3000',
  privateKey: process.env.AGENT_PRIVATE_KEY,
  network: 'testnet' // or 'mainnet'
};

function getLuckyAmount() {
  // Generate random lucky amount containing 8
  const bases = [8, 18, 28, 80, 88, 108, 188];
  const base = bases[Math.floor(Math.random() * bases.length)];
  const decimal = Math.floor(Math.random() * 9); // 0-8
  return `${base}.${decimal}8`; // Always ends with 8
}

async function consultCaishen() {
  const provider = new ethers.JsonRpcProvider(CONFIG.rpcUrl);
  const wallet = new ethers.Wallet(CONFIG.privateKey, provider);
  
  const offering = getLuckyAmount();
  console.log(`🏮 Offering ${offering} MON to CáiShén...`);
  
  // Make offering
  const tx = await wallet.sendTransaction({
    to: CONFIG.caishenAddress,
    value: ethers.parseEther(offering)
  });
  
  const receipt = await tx.wait();
  console.log('💸 Offering sent:', receipt.hash);
  
  // Consult CáiShén
  const response = await fetch(
    `${CONFIG.apiUrl}/fortune?network=${CONFIG.network}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        txhash: receipt.hash,
        message: 'What fortune awaits me today?'
      })
    }
  );
  
  const result = await response.json();
  
  console.log('\n🏮 CáiShén Speaks:');
  console.log('Outcome:', result.caishen.outcome);
  console.log('Blessing:', result.caishen.blessing);
  console.log('Multiplier:', result.multiplier + 'x');
  console.log('Returned:', result.mon_sent, 'MON');
  
  if (result.superstitions.penalties_applied.length > 0) {
    console.log('⚠️ Penalties:', result.superstitions.penalties_applied);
  }
  
  return result;
}

// Run daily
consultCaishen().catch(console.error);
```

### Python Client

```python
import requests
from web3 import Web3
import random
import os

class CaishenOracle:
    def __init__(self, private_key, network="testnet"):
        self.private_key = private_key
        self.network = network
        
        if network == "testnet":
            self.rpc_url = "https://testnet-rpc.monad.xyz"
            self.caishen_address = "0x3b77d476a15C77A776e542ac4C0f6484DAa6Aa3f"
            self.api_url = "http://localhost:3000"
            self.chain_id = 10143
        else:
            self.rpc_url = "https://rpc.monad.xyz"
            self.caishen_address = ""  # Set when deployed
            self.api_url = "http://localhost:3000"
            self.chain_id = 10144
        
        self.w3 = Web3(Web3.HTTPProvider(self.rpc_url))
        self.account = self.w3.eth.account.from_key(private_key)
    
    def get_lucky_amount(self):
        """Generate offering amount containing lucky 8"""
        bases = [8, 18, 28, 80, 88, 108, 188]
        base = random.choice(bases)
        decimal = random.randint(0, 8)
        return f"{base}.{decimal}8"
    
    def consult(self, question: str):
        """Make offering and consult CáiShén"""
        
        offering = self.get_lucky_amount()
        print(f"🏮 Offering {offering} MON to CáiShén...")
        
        # Make offering
        tx = {
            'to': self.caishen_address,
            'value': self.w3.to_wei(offering, 'ether'),
            'gas': 21000,
            'gasPrice': self.w3.to_wei('50', 'gwei'),
            'nonce': self.w3.eth.get_transaction_count(self.account.address),
            'chainId': self.chain_id
        }
        
        signed = self.w3.eth.account.sign_transaction(tx, self.private_key)
        tx_hash = self.w3.eth.send_raw_transaction(signed.rawTransaction)
        receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)
        
        print(f"💸 Offering sent: {receipt.transactionHash.hex()}")
        
        # Consult CáiShén
        response = requests.post(
            f"{self.api_url}/fortune?network={self.network}",
            json={
                "txhash": receipt.transactionHash.hex(),
                "message": question
            }
        )
        
        result = response.json()
        
        print(f"\n🏮 {result['caishen']['outcome']}")
        print(f"🙏 {result['caishen']['blessing']}")
        print(f"📈 Multiplier: {result['multiplier']}x")
        
        return result
    
    def should_proceed(self, question: str) -> bool:
        """Get yes/no from CáiShén"""
        result = self.consult(question)
        # Tier 3+ (Small Win or better) = proceed
        return result['caishen']['tier'] >= 3

# Usage
client = CaishenOracle(os.getenv("PRIVATE_KEY"), "testnet")

# Consult
fortune = client.consult("Should I deploy today?")

# Quick decision
if client.should_proceed("Is this a good time to trade?"):
    print("🚀 CáiShén approves!")
else:
    print("⏳ Wait for better fortune")
```

---

## 🧧 Cultural Notes

| Symbol | Meaning | Pronunciation |
|--------|---------|---------------|
| 八 (8) | Prosperity/Wealth | bā (sounds like 發 fā) |
| 四 (4) | Death | sì (sounds like 死 sǐ) |
| 紅包 | Red envelope (money gift) | hóngbāo |
| 恭喜發財 | "Wishing you prosperity" | Gōngxǐ fācái |
| 財神 | God of Wealth | CáiShén |

---

## 🔧 Setup

1. Get testnet MON from faucet
2. Set environment variables in `.env`:
   ```
   ORACLE_PRIVATE_KEY=0x...
   TESTNET_ORACLE_ADDRESS=0x3b77d476a15C77A776e542ac4C0f6484DAa6Aa3f
   ```
3. Start server: `npm start`
4. Make offering and consult CáiShén!

---

## 📞 Links

- **GitHub:** https://github.com/clawcybot/mon-fortune
- **Monad Testnet:** https://testnet.monadexplorer.com
- **Chinese Culture:** https://en.wikipedia.org/wiki/Caishen

---

*🏮 May CáiShén bless you with prosperity! 恭喜發財!*
