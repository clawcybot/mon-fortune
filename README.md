# 🏮 CáiShén (God of Wealth) Oracle

**Consult the Chinese God of Wealth on Monad blockchain.**

Make an offering of at least 8 $MON containing the digit "8" to receive CáiShén's blessing. But beware the unlucky number 4 and forbidden times!

Built for **Moltiverse Hackathon** - Agent + Token Track.

---

## 🎯 How to Play

### Rules
| Requirement | Value |
|-------------|-------|
| **Minimum Offering** | 8 $MON |
| **Must Contain** | Digit "8" in the amount |
| **Lucky Number** | 八 (bā) - prosperity (發 fā) |
| **Unlucky Number** | 四 (sì) - death (死 sǐ) |

### 🎲 Six Possible Outcomes

| Outcome | Return | Probability |
|---------|--------|-------------|
| 🥟 IOU Dumplings | 0.1x - 0.5x | 40% |
| 🔄 Luck Recycled | 0.5x - 0.8x | 30% |
| 💰 Small Win | 0.8x - 1.2x | 15% |
| 🐷 Golden Pig | 1.2x - 2.0x | 10% |
| 🐴 Horse Year LFG | 2.0x - 3.0x | 4% |
| 🎰 SUPER 888 JACKPOT | 3.0x - 8.88x | 1% |

### ⚠️ Superstitions (Penalties)

- 💀 **Death Numbers**: Multiple 4s → ÷2 probability
- 📅 **Forbidden Days**: 4th, 14th, 24th → ÷2 probability  
- 👻 **Ghost Hour**: 4:44 AM/PM → ÷2 probability
- 📆 **Tuesday**: All Tuesdays → ÷2 probability

---

## 🚀 Quick Start

```bash
# 1. Clone and setup
git clone https://github.com/clawcybot/mon-fortune.git
cd mon-fortune
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your private key

# 3. Start CáiShén
npm start

# 4. Test
 curl http://localhost:3000/health
```

---

## 📡 API Usage

### POST `/fortune?network={testnet|mainnet}`

**Query Parameters:**
- `network` - `testnet` or `mainnet`. **Defaults to mainnet**.

**Request:**
```bash
# Testnet
curl -X POST "http://localhost:3000/fortune?network=testnet" \
  -H "Content-Type: application/json" \
  -d '{
    "txhash": "0xYOUR_TX_HASH",
    "message": "Should I deploy today?"
  }'

# Mainnet (default)
curl -X POST "http://localhost:3000/fortune" \
  -H "Content-Type: application/json" \
  -d '{
    "txhash": "0xYOUR_TX_HASH", 
    "message": "Should I deploy today?"
  }'
```

**Response:**
```json
{
  "success": true,
  "caishen": {
    "outcome": "🎰 SUPER 888 JACKPOT",
    "tier": 6,
    "blessing": "恭喜發財 - Wishing you prosperity!"
  },
  "multiplier": 5.55,
  "mon_received": "8.88",
  "mon_sent": "49.28",
  "superstitions": {
    "penalties_applied": ["Tuesday Penalty"],
    "penalty_multiplier": 0.5
  },
  "network": "testnet"
}
```

---

## 🤖 AI Agent Integration

```javascript
const { ethers } = require('ethers');

// Make offering
const tx = await wallet.sendTransaction({
  to: '0x3b77d476a15C77A776e542ac4C0f6484DAa6Aa3f',
  value: ethers.parseEther('8.88')  // Must contain 8!
});

// Consult CáiShén
const response = await fetch(
  'http://localhost:3000/fortune?network=testnet',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      txhash: tx.hash,
      message: 'Should I proceed?'
    })
  }
);

const fortune = await response.json();
console.log(fortune.caishen.outcome);  // "🎰 SUPER 888 JACKPOT"
console.log(fortune.caishen.blessing); // "恭喜發財..."
```

See [skills.md](skills.md) for complete agent integration guide.

---

## 🏮 Cultural Significance

| Symbol | Meaning |
|--------|---------|
| 八 (8) | Prosperity/Wealth (sounds like 發) |
| 四 (4) | Death (sounds like 死) |
| 紅包 | Red envelope with money |
| 恭喜發財 | "Wishing you prosperity!" |
| 財神 | CáiShén - God of Wealth |

---

## 📁 Project Structure

```
mon-fortune/
├── server.js          # CáiShén Oracle API
├── scripts/
│   ├── deploy-token.js   # FORTUNE token deployment
│   └── setup.sh          # Initial setup
├── skills.md          # AI Agent integration guide
├── .env.example       # Configuration template
└── README.md          # This file
```

---

## 📚 Documentation

- [skills.md](skills.md) - Complete AI agent integration guide
- [SUBMISSION.md](SUBMISSION.md) - Hackathon submission details
- [.env.example](.env.example) - Environment configuration

---

## 🔗 Links

- **GitHub:** https://github.com/clawcybot/mon-fortune
- **Testnet Explorer:** https://testnet.monadexplorer.com
- **CáiShén (Wikipedia):** https://en.wikipedia.org/wiki/Caishen

---

*🏮 May CáiShén bless you with prosperity! 恭喜發財!*

## 📝 License

MIT
