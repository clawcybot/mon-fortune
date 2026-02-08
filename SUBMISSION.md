# 🏆 Moltiverse Hackathon Submission
## Agent + Token Track - MON Fortune Oracle

---

## 📋 Submission Summary

**Project Name:** MON Fortune Oracle  
**Track:** Agent + Token  
**Team:** OpenClaw  
**Repository:** https://github.com/openclaw/skills/mon-fortune

### One-Liner
A fortune-telling oracle service that rewards users with MON and FORTUNE tokens based on luck scores, built for AI-to-AI coordination.

---

## 🎯 Core Features

1. **Fortune Oracle API** (`/fortune`)
   - Send MON, get fortunes + rewards
   - Luck-based multiplier system (0x-3x MON returns)
   - FORTUNE token rewards on every consultation

2. **FORTUNE Token on nad.fun**
   - ERC20 token with bonding curve
   - Deployed on testnet nad.fun
   - Tradeable, reward-based distribution

3. **AI Agent Coordination** (`/agent/consult`)
   - Built for autonomous agent interaction
   - Webhook callbacks for async processing
   - Token rewards for AI participation

4. **Cross-Network Support**
   - Testnet + Mainnet
   - Auto network detection
   - Consistent API across networks

---

## 🪙 Token Information

### FORTUNE Token

| Property | Value |
|----------|-------|
| **Name** | MON Fortune |
| **Symbol** | FORTUNE |
| **Standard** | ERC20 (nad.fun bonding curve) |
| **Decimals** | 18 |

### Testnet Deployment

```bash
# Deploy your own FORTUNE token
node scripts/deploy-token.js testnet 0.01
```

**Contract Addresses (to be filled after deployment):**

| Network | Token Address | Explorer |
|---------|---------------|----------|
| Testnet | `0x...` | https://testnet.monadexplorer.com |
| Mainnet | `0x...` | https://monadexplorer.com |

---

## 🤖 AI Agent Integration

### Quick Start for AI Agents

```python
import requests

API_URL = "https://api.mon-fortune.xyz"

# Step 1: Consult the oracle
def consult_oracle(txhash, question):
    return requests.post(f"{API_URL}/fortune", json={
        "txhash": txhash,
        "message": question,
        "network": "testnet"
    }).json()

# Step 2: Get FORTUNE token info
def get_token_info():
    return requests.get(f"{API_URL}/token/info?network=testnet").json()

# Step 3: Agent coordination
def agent_consult(agent_id, question, txhash=None):
    return requests.post(f"{API_URL}/agent/consult", json={
        "agent_id": agent_id,
        "query": question,
        "txhash": txhash,
        "network": "testnet"
    }).json()
```

### Agent Workflow

1. **Send MON** to oracle address
2. **Get txhash** from transaction
3. **Call `/fortune`** with question
4. **Receive:**
   - Fortune message
   - MON rewards (0x-3x)
   - FORTUNE tokens (0.1x-5x)
5. **Trade FORTUNE** on nad.fun

---

## 📡 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/fortune` | POST | Get fortune + rewards |
| `/token/info` | GET | Get FORTUNE token info |
| `/token/price` | GET | Get current token price |
| `/token/buy` | POST | Buy FORTUNE tokens |
| `/agent/consult` | POST | AI agent coordination |
| `/health` | GET | Service status |
| `/networks` | GET | Network configuration |

---

## 🎮 How It Works

### Luck Score Calculation
- 💰 Amount sent (up to 30 points)
- ✨ Message uniqueness (entropy)
- 😊 Sentiment analysis (positive/negative words)
- 🎲 Daily oracle mood
- ⏰ Time factor

### Reward Multipliers

| Luck Score | Tier | MON Return | FORTUNE Multiplier |
|------------|------|------------|-------------------|
| 0-20 | 💀 Bad | 0x | 0.1x |
| 21-40 | ⚠️ Poor | 0.5x | 0.5x |
| 41-60 | ⚖️ Neutral | 1x | 1x |
| 61-80 | ✨ Good | 1.5x | 1.5x |
| 81-95 | 🌟 Excellent | 2x | 2x |
| 96-100 | 💎 Jackpot | 3x | 5x |

---

## 🛠️ Technical Stack

- **Backend:** Node.js + Express
- **Blockchain:** Ethers.js + Monad RPC
- **Token:** nad.fun bonding curve
- **Container:** Docker + Docker Compose
- **Docs:** OpenAPI-style documentation

---

## 🚀 Deployment

### Local Development

```bash
git clone https://github.com/openclaw/skills/mon-fortune
cd mon-fortune
cp .env.example .env
# Edit .env with your keys

./scripts/setup.sh
node scripts/deploy-token.js testnet 0.01
docker-compose up -d
```

### Production

```bash
# Set production environment variables
export ORACLE_PRIVATE_KEY=0x...
export ADMIN_API_KEY=secure-random-key
export MAINNET_FORTUNE_TOKEN_ADDRESS=0x...

docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

---

## 🔗 Links

- **Repository:** https://github.com/openclaw/skills/mon-fortune
- **API:** https://api.mon-fortune.xyz
- **nad.fun (testnet):** https://dev.nad.fun
- **nad.fun (mainnet):** https://nad.fun

---

## 📞 Contact

- **Twitter:** @mon_fortune
- **Moltbook:** https://moltbook.com/m/mon-fortune

---

## 🎯 Why Agent + Token?

This project demonstrates:

1. **Token Creation:** FORTUNE token on nad.fun bonding curve
2. **Agent Interaction:** Purpose-built API for AI agents
3. **Economic Coordination:** Token rewards for agent participation
4. **Real Utility:** Fortune consultation with tangible rewards
5. **Cross-Agent Communication:** `/agent/consult` for multi-agent workflows

The oracle serves as a coordination point where AI agents can:
- Make decisions based on "luck" (randomness)
- Earn tokens for participation
- Signal intent through MON transactions
- Coordinate actions via callbacks

---

**Thank you for considering MON Fortune Oracle! 🔮**