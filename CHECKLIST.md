# ✅ Moltiverse Hackathon Submission Checklist
## MON Fortune Oracle - Agent + Token Track

---

## Pre-Submission Requirements

### Token Integration
- [ ] Deploy FORTUNE token on nad.fun testnet
  ```bash
  node scripts/deploy-token.js testnet 0.01
  ```
- [ ] Copy token address from deployment output
- [ ] Add to .env: `TESTNET_FORTUNE_TOKEN_ADDRESS=0x...`
- [ ] Verify token on nad.fun explorer

### Testing
- [ ] Start the server: `npm start`
- [ ] Test health endpoint: `curl http://localhost:3000/health`
- [ ] Test token info: `curl http://localhost:3000/token/info?network=testnet`
- [ ] Send test MON to oracle address
- [ ] Test fortune endpoint with txhash
- [ ] Verify token rewards in response

### Documentation
- [x] SKILL.md updated with token info
- [x] SUBMISSION.md created
- [x] README.md updated
- [x] API endpoints documented

---

## Submission Files

### Required
- [x] `SKILL.md` - Full project documentation
- [x] `SUBMISSION.md` - Hackathon submission details
- [x] `server.js` - Main API with token integration
- [x] `lib/token-manager.js` - Token management
- [x] `scripts/deploy-token.js` - Token deployment
- [x] `.env.example` - Configuration template

### Supporting
- [x] `README.md` - Quick start guide
- [x] `package.json` - Dependencies and scripts
- [x] `docker-compose.yml` - Deployment config
- [x] `hackathon-setup.sh` - One-command setup

---

## Agent + Token Track Requirements

| Requirement | Status | Notes |
|-------------|--------|-------|
| Deploy token on nad.fun | 🟡 Ready | Run deploy script to get address |
| Include token address | 🟡 Ready | Documented, fill in after deploy |
| Agent interacts with token | ✅ Complete | `/fortune` rewards + `/agent/consult` |

---

## Quick Deployment Guide

### Step 1: Environment Setup
```bash
cd /home/openclaw/.openclaw/workspace/skills/mon-fortune
cp .env.example .env
# Edit .env and set:
# - ORACLE_PRIVATE_KEY
# - ADMIN_API_KEY
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Generate Oracle Address
```bash
./scripts/setup.sh
# Or manually:
cast wallet address --private-key $ORACLE_PRIVATE_KEY
# Add to .env as TESTNET_ORACLE_ADDRESS and MAINNET_ORACLE_ADDRESS
```

### Step 4: Get Testnet MON
```bash
# From faucet
curl -X POST https://agents.devnads.com/v1/faucet \
  -H "Content-Type: application/json" \
  -d '{"address":"YOUR_ORACLE_ADDRESS"}'

# Or visit https://faucet.monad.xyz
```

### Step 5: Deploy FORTUNE Token
```bash
node scripts/deploy-token.js testnet 0.01

# Output will include:
# Token Address: 0x...
# Add to .env: TESTNET_FORTUNE_TOKEN_ADDRESS=0x...
```

### Step 6: Start Server
```bash
npm start

# Or with Docker:
docker-compose up -d
```

### Step 7: Test
```bash
# Health check
curl http://localhost:3000/health

# Token info
curl http://localhost:3000/token/info?network=testnet
```

---

## API Testing Examples

### Get Fortune (Full Flow)
```bash
# 1. Send MON to oracle
cast send $ORACLE_ADDRESS --value 0.01ether \
  --rpc-url https://testnet-rpc.monad.xyz \
  --private-key $YOUR_KEY

# 2. Get txhash from output, then:
curl -X POST http://localhost:3000/fortune \
  -H "Content-Type: application/json" \
  -d "{
    \"txhash\": \"0xYOUR_TX_HASH\",
    \"message\": \"Will my project succeed?\",
    \"network\": \"testnet\"
  }"
```

### Agent Consultation
```bash
curl -X POST http://localhost:3000/agent/consult \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "demo-agent-001",
    "query": "Should I deploy today?",
    "network": "testnet"
  }'
```

---

## Token Address for Submission

**Fill this in after deployment:**

| Network | Token Address | Explorer URL |
|---------|---------------|--------------|
| Testnet | `0x...` | https://testnet.monadexplorer.com/address/0x... |
| Mainnet | `0x...` | https://monadexplorer.com/address/0x... |

---

## Submission Details

**Project Name:** MON Fortune Oracle  
**Track:** Agent + Token  
**Repository:** https://github.com/openclaw/skills/mon-fortune  
**Demo URL:** http://localhost:3000 (local) / https://api.mon-fortune.xyz (deployed)

**Key Features:**
1. 🔮 Fortune oracle with luck-based rewards
2. 🪙 FORTUNE token on nad.fun bonding curve
3. 🤖 AI-to-AI coordination via `/agent/consult`
4. 🌉 Cross-network support (testnet + mainnet)

---

## Post-Submission

### Mainnet Deployment (After Hackathon)
```bash
# 1. Get mainnet MON
# 2. Deploy token
node scripts/deploy-token.js mainnet 0.1

# 3. Update .env
# MAINNET_FORTUNE_TOKEN_ADDRESS=0x...

# 4. Restart server
```

### Future Enhancements
- [ ] Leaderboard with database
- [ ] NFT fortune cards
- [ ] Staking for boosted luck
- [ ] Governance features
- [ ] Cross-chain expansion

---

**Ready for submission! 🚀**