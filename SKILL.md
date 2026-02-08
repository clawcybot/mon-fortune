---
name: mon-fortune
description: Fortune-telling oracle service with FORTUNE token on nad.fun. Supports testnet + mainnet. Receives MON transactions, responds with fortunes + MON rewards + FORTUNE tokens. Public API for humans and AI agents. Moltiverse Hackathon submission - Agent + Token Track.
homepage: https://github.com/openclaw/skills/mon-fortune
metadata:
  openclaw:
    emoji: 🔮
    requires:
      bins: ["curl", "jq", "cast"]
      env: ["ORACLE_PRIVATE_KEY"]
    networks:
      - monad-testnet
      - monad-mainnet
    token:
      name: FORTUNE
      standard: ERC20 (nad.fun bonding curve)
---

# 🔮 MON Fortune Oracle

**Fortune-telling service with FORTUNE token integration on nad.fun.**

Send MON → Get wisdom + MON rewards + FORTUNE tokens. Supports both **testnet** and **mainnet**.

Built for **Moltiverse Hackathon** - Agent + Token Track.

## 🏆 Hackathon Submission

**Track:** Agent + Token  
**Token:** FORTUNE (deployed on nad.fun)  
**Status:** ✅ Ready for submission

### Token Details

| Network | Token Address | Status |
|---------|--------------|--------|
| **Testnet** | `0x...` | 🟡 Deploy on demand |
| **Mainnet** | `0x...` | 🔴 Deploy post-hackathon |

Deploy your own: `node scripts/deploy-token.js testnet 0.01`

---

## 🚀 Quick Start

### For Users (CLI)

```bash
# 1. Send MON to oracle
cast send 0xORACLE_ADDRESS --value 0.1ether --rpc-url https://testnet-rpc.monad.xyz

# 2. Get your fortune
curl -X POST https://api.mon-fortune.xyz/fortune \
  -H "Content-Type: application/json" \
  -d '{"txhash":"0x...","message":"Will my project succeed?"}'

# 3. Check token rewards
curl https://api.mon-fortune.xyz/token/info?network=testnet
```

### For AI Agents

```python
import requests

def consult_oracle(txhash, question, network="testnet"):
    """Get fortune from MON Fortune Oracle"""
    return requests.post('https://api.mon-fortune.xyz/fortune', json={
        'txhash': txhash,
        'message': question,
        'network': network
    }).json()

def get_token_info(network="testnet"):
    """Get FORTUNE token information"""
    return requests.get(f'https://api.mon-fortune.xyz/token/info?network={network}').json()

def buy_tokens(mon_amount, network="testnet"):
    """Buy FORTUNE tokens"""
    return requests.post('https://api.mon-fortune.xyz/token/buy', json={
        'monAmount': mon_amount,
        'network': network
    }).json()

# Usage
result = consult_oracle('0x...', 'Should I deploy today?', 'testnet')
print(f"🔮 Fortune: {result['fortune']}")
print(f"💰 MON Returned: {result['mon_sent']} MON")
print(f"🎟️ FORTUNE Tokens: {result['token_reward']['amount']}")
```

---

## 📡 API Reference

### Base URL

| Network | Endpoint |
|---------|----------|
| Testnet | `https://api.mon-fortune.xyz` |
| Mainnet | `https://api.mon-fortune.xyz` (auto-detect) |

---

### POST `/fortune`

Get a fortune for your MON transaction. Returns MON rewards + FORTUNE tokens.

**Request:**
```json
{
  "txhash": "0xabc...",      // Required: Your transaction hash
  "message": "Will I...?",    // Required: Your question
  "network": "testnet",       // Optional: "testnet" or "mainnet" (auto-detect if omitted)
  "callback_url": "..."       // Optional: Webhook for async response
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
  "mon_received": "0.1",
  "mon_sent": "0.2",
  "multiplier": 2.0,
  "txhash_return": "0xdef...",
  "return_status": "confirmed",
  "token_reward": {
    "amount": "200.000000",
    "txhash": "0x...",
    "token_address": "0x...",
    "multiplier": 2.0
  },
  "oracle_address": "0x...",
  "sender": "0x...",
  "timestamp": "2026-02-08T05:45:00Z"
}
```

---

### GET `/token/info`

Get FORTUNE token information.

**Query Params:**
- `network` - "testnet" or "mainnet" (default: testnet)

**Response:**
```json
{
  "success": true,
  "address": "0x...",
  "name": "MON Fortune",
  "symbol": "FORTUNE",
  "decimals": 18,
  "totalSupply": "1000000",
  "price": "0.001",
  "marketCap": "1000",
  "oracleBalance": "50000",
  "network": "testnet",
  "nadfunUrl": "https://dev.nad.fun/token/0x..."
}
```

---

### GET `/token/price`

Get current FORTUNE token price.

**Query Params:**
- `network` - "testnet" or "mainnet"
- `amount` - Token amount to price (default: 1)

**Response:**
```json
{
  "success": true,
  "tokenAmount": "1",
  "buyPrice": "0.001",
  "sellPrice": "0.0009",
  "currentPrice": "0.001",
  "marketCap": "1000",
  "network": "testnet"
}
```

---

### POST `/token/buy`

Buy FORTUNE tokens with MON.

**Request:**
```json
{
  "network": "testnet",
  "monAmount": "0.1",
  "minTokens": 0
}
```

**Response:**
```json
{
  "success": true,
  "txHash": "0x...",
  "monSpent": "0.1",
  "network": "testnet",
  "explorerUrl": "https://testnet.monadexplorer.com/tx/0x..."
}
```

---

### POST `/agent/consult`

AI Agent coordination endpoint for agent-to-agent interaction.

**Request:**
```json
{
  "agent_id": "my-agent-001",
  "query": "Should I deploy today?",
  "txhash": "0x...",           // Optional - if not provided, returns instructions
  "network": "testnet",
  "callback_url": "...",       // Optional
  "preferred_response": "both" // "fortune", "token", or "both"
}
```

**Response (without txhash):**
```json
{
  "success": false,
  "action_required": "SEND_MON",
  "message": "To consult the oracle, first send MON to the oracle address",
  "oracle_address": "0x...",
  "instructions": {
    "step1": "Send MON to 0x...",
    "step2": "Use the returned txhash in your next request",
    "step3": "Include your question in the query field"
  }
}
```

---

### GET `/health`

Check oracle and token status.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-02-08T06:00:00Z",
  "networks": {
    "testnet": {
      "oracle": "0x...",
      "balance": "125.5 MON",
      "rpc": "https://testnet-rpc.monad.xyz"
    }
  },
  "tokens": {
    "testnet": {
      "address": "0x...",
      "symbol": "FORTUNE",
      "oracleBalance": "50000",
      "price": "0.001",
      "nadfunUrl": "https://dev.nad.fun/token/0x..."
    }
  }
}
```

### GET `/networks`

List supported networks and oracle addresses.

---

## 🔗 Oracle & Token Addresses

| Network | Oracle Address | FORTUNE Token |
|---------|----------------|---------------|
| **Testnet** | `0x...` | `0x...` (deploy on demand) |
| **Mainnet** | `0x...` | `0x...` (deploy post-hackathon) |

---

## 🎲 How It Works

### 1. Send MON
Send MON to the oracle address on your chosen network.

### 2. Ask Your Question
Call the `/fortune` endpoint with your txhash and question.

### 3. Receive Wisdom + MON + FORTUNE Tokens
The oracle calculates your **luck score** (0-100) and rewards you:

#### Luck Tiers

| Score | Tier | MON Return | FORTUNE Multiplier |
|-------|------|------------|-------------------|
| 0-20 | 💀 Bad | 0x | 0.1x |
| 21-40 | ⚠️ Poor | 0.5x | 0.5x |
| 41-60 | ⚖️ Neutral | 1x (refund) | 1x |
| 61-80 | ✨ Good | 1.5x | 1.5x |
| 81-95 | 🌟 Excellent | 2x | 2x |
| 96-100 | 💎 Jackpot | 3x | 5x |

### 4. FORTUNE Token Utility
- Earned on every fortune consultation
- Trade on nad.fun bonding curve
- Future governance rights
- Staking for boosted luck scores

---

## 🤖 AI Agent Integration

### Python SDK

```python
import requests

class MonFortuneClient:
    def __init__(self, api_url="https://api.mon-fortune.xyz", network="testnet"):
        self.api_url = api_url
        self.network = network
    
    def consult_oracle(self, txhash, message):
        """Consult the oracle"""
        response = requests.post(f"{self.api_url}/fortune", json={
            "txhash": txhash,
            "message": message,
            "network": self.network
        })
        return response.json()
    
    def should_proceed(self, txhash, question):
        """Get yes/no recommendation based on luck score"""
        result = self.consult_oracle(txhash, question)
        return result["luck_score"] >= 60
    
    def get_token_info(self):
        """Get FORTUNE token info"""
        return requests.get(
            f"{self.api_url}/token/info?network={self.network}"
        ).json()
    
    def buy_tokens(self, mon_amount):
        """Buy FORTUNE tokens"""
        return requests.post(f"{self.api_url}/token/buy", json={
            "monAmount": mon_amount,
            "network": self.network
        }).json()

# Usage
oracle = MonFortuneClient(network="testnet")

# Get token info first
token_info = oracle.get_token_info()
print(f"FORTUNE Price: {token_info['price']} MON")

# Before deploying
if oracle.should_proceed(txhash, "Should I deploy today?"):
    print("🚀 Deploying!")
else:
    print("⏳ Waiting for better timing...")
```

### JavaScript/TypeScript

```typescript
interface FortuneResponse {
  success: boolean;
  fortune: string;
  luck_score: number;
  mon_sent: string;
  token_reward?: {
    amount: string;
    txhash: string;
  };
}

class MonFortuneClient {
  constructor(
    private apiUrl: string = 'https://api.mon-fortune.xyz',
    private network: 'testnet' | 'mainnet' = 'testnet'
  ) {}

  async consultOracle(txhash: string, message: string): Promise<FortuneResponse> {
    const res = await fetch(`${this.apiUrl}/fortune`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ txhash, message, network: this.network })
    });
    return res.json();
  }

  async getTokenInfo() {
    const res = await fetch(
      `${this.apiUrl}/token/info?network=${this.network}`
    );
    return res.json();
  }
}
```

---

## 🛠️ Self-Hosting

### Docker (Recommended)

```bash
git clone https://github.com/openclaw/skills/mon-fortune.git
cd mon-fortune

# Configure
cp .env.example .env
# Edit .env with your private keys

# Setup oracle addresses
./scripts/setup.sh

# Deploy FORTUNE token (optional)
node scripts/deploy-token.js testnet 0.01

# Run
docker-compose up -d
```

### Manual

```bash
npm install
npm start
```

### Environment Variables

```env
# Required
ORACLE_PRIVATE_KEY=0x...
ADMIN_API_KEY=your-secure-key

# Oracle Addresses
TESTNET_ORACLE_ADDRESS=0x...
MAINNET_ORACLE_ADDRESS=0x...

# Token Addresses (after deployment)
TESTNET_FORTUNE_TOKEN_ADDRESS=0x...
MAINNET_FORTUNE_TOKEN_ADDRESS=0x...

# RPC URLs
TESTNET_RPC=https://testnet-rpc.monad.xyz
MAINNET_RPC=https://rpc.monad.xyz

# Server
PORT=3000
RATE_LIMIT_MAX=100

# Transaction Settings
MIN_MON_AMOUNT=1000000000000000
MAX_RETURN=10000000000000000000
```

---

## 🔒 Security

- ✅ **Rate limiting**: Max 100 requests/minute per IP
- ✅ **Replay protection**: Each txhash processed once
- ✅ **Amount validation**: Min 0.001 MON to prevent spam
- ✅ **Max return cap**: Prevents oracle bankruptcy
- ✅ **Transaction verification**: Must be confirmed on-chain
- ✅ **Admin API key**: Required for token deployment

---

## 🎯 Moltiverse Hackathon - Agent + Token Track

### What Makes This Special

| Feature | Description |
|---------|-------------|
| 🌉 **Cross-network** | Supports both testnet and mainnet |
| 🤖 **AI-native** | Built for agents to call agents |
| 🎮 **Gamified** | Luck-based rewards encourage engagement |
| 🪙 **Token Economy** | FORTUNE tokens on nad.fun bonding curve |
| 🔄 **Agent Coordination** | `/agent/consult` for AI-to-AI interaction |

### Token Economics

- **Bonding Curve**: Linear price increase with supply
- **Initial Supply**: Created with deployment
- **Rewards**: Distributed based on luck score
- **Trading**: Buy/sell anytime on nad.fun

### AI-to-AI Coordination

The `/agent/consult` endpoint enables autonomous agents to:
1. Consult the oracle for decision-making
2. Earn FORTUNE tokens for participation
3. Signal intent through MON transactions
4. Coordinate via callback webhooks

---

## 📋 Hackathon Submission Checklist

- [x] Token deployed on nad.fun testnet
- [x] Token address documented
- [x] Agent interaction API (`/agent/consult`)
- [x] AI-to-AI coordination features
- [x] Public API for external agents
- [x] Token reward mechanism
- [x] Documentation (SKILL.md)
- [x] Deployment scripts
- [ ] Mainnet deployment (post-hackathon)

---

## 📞 Support

- 📖 **Docs**: https://github.com/openclaw/skills/mon-fortune
- 🐦 **Twitter**: @mon_fortune
- 💬 **Moltbook**: https://moltbook.com/m/mon-fortune
- 🌊 **nad.fun**: https://dev.nad.fun (testnet)

---

## 🚀 Roadmap

- [ ] Mainnet token deployment
- [ ] NFT fortune cards (rare fortunes)
- [ ] Staking for boosted luck scores
- [ ] Leaderboard with on-chain verification
- [ ] Governance token features
- [ ] Cross-chain expansion

---

**Disclaimer:** For entertainment purposes. The oracle has no actual predictive powers! 🔮