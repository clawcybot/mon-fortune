# MON Fortune Oracle

🔮 **Fortune-telling oracle service with FORTUNE token on nad.fun**

Send MON → Get wisdom + MON rewards + FORTUNE tokens.

Built for **Moltiverse Hackathon** - Agent + Token Track.

---

## 🚀 Quick Start

```bash
# 1. Clone and setup
git clone https://github.com/openclaw/skills/mon-fortune.git
cd mon-fortune
./hackathon-setup.sh

# 2. Deploy FORTUNE token
npm run deploy:token:testnet

# 3. Start the oracle
npm start

# 4. Test
curl http://localhost:3000/health
```

---

## 📁 Project Structure

```
mon-fortune/
├── server.js                 # Main API server
├── lib/
│   └── token-manager.js      # FORTUNE token integration
├── scripts/
│   ├── setup.sh              # Initial setup
│   ├── deploy-token.js       # Token deployment
│   └── check-fortune.sh      # CLI fortune checker
├── hackathon-setup.sh        # One-command setup
├── docker-compose.yml        # Docker deployment
├── SKILL.md                  # Full documentation
├── SUBMISSION.md             # Hackathon submission
└── .env.example              # Configuration template
```

---

## 🎯 Features

| Feature | Description |
|---------|-------------|
| 🔮 Fortune API | Get fortunes with luck-based rewards |
| 🪙 FORTUNE Token | ERC20 on nad.fun bonding curve |
| 🤖 AI Agent API | Built for autonomous agent coordination |
| 🌉 Cross-Network | Testnet + Mainnet support |
| 🎮 Gamified | Luck scores from 0-100 with tiered rewards |

---

## 📡 API Endpoints

### Core
- `POST /fortune` - Get fortune + MON + FORTUNE rewards
- `GET /health` - Service status

### Token
- `GET /token/info` - FORTUNE token information
- `GET /token/price` - Current token price
- `POST /token/buy` - Buy FORTUNE tokens
- `POST /token/deploy` - Deploy new token (admin)

### Agent
- `POST /agent/consult` - AI agent coordination

---

## 🤖 AI Agent Usage

```python
import requests

# Consult the oracle (testnet)
response = requests.post('http://localhost:3000/fortune?network=testnet', json={
    'txhash': '0x...',
    'message': 'Should I deploy today?'
})

# Or use mainnet
response = requests.post('http://localhost:3000/fortune?network=mainnet', json={
    'txhash': '0x...',
    'message': 'Should I deploy today?'
})

result = response.json()
print(f"Fortune: {result['fortune']}")
print(f"Luck Score: {result['luck_score']}")
print(f"MON Returned: {result['mon_sent']}")
```
```

---

## 🪙 FORTUNE Token

The FORTUNE token is deployed on nad.fun's bonding curve:

```bash
# Deploy on testnet
npm run deploy:token:testnet

# Deploy on mainnet
npm run deploy:token:mainnet
```

Token rewards are distributed based on luck score:
- 💎 Jackpot (96-100): 5x FORTUNE multiplier
- 🌟 Excellent (81-95): 2x multiplier
- ✨ Good (61-80): 1.5x multiplier
- And so on...

---

## 🏆 Hackathon Submission

**Track:** Agent + Token  
**Status:** Ready for submission

See [SUBMISSION.md](SUBMISSION.md) for full submission details.

### Submission Checklist

- [x] Token integration with nad.fun
- [x] Agent API for AI-to-AI coordination
- [x] Token reward mechanism
- [x] Cross-network support
- [x] Comprehensive documentation
- [x] Deployment scripts

---

## 📚 Documentation

- [SKILL.md](SKILL.md) - Full API documentation
- [SUBMISSION.md](SUBMISSION.md) - Hackathon submission
- [.env.example](.env.example) - Configuration reference

---

## 🔗 Links

- **nad.fun (testnet):** https://dev.nad.fun
- **nad.fun (mainnet):** https://nad.fun
- **Monad Explorer:** https://testnet.monadexplorer.com

---

## 📝 License

MIT