#!/bin/bash
#
# Quick Setup for Hackathon Demo
# Usage: ./hackathon-setup.sh
#

set -e

echo "🔮 MON Fortune Oracle - Hackathon Setup"
echo "========================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check dependencies
check_deps() {
    echo "📦 Checking dependencies..."
    
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js not found${NC}"
        echo "   Install from: https://nodejs.org"
        exit 1
    fi
    
    if ! command -v docker &> /dev/null; then
        echo -e "${YELLOW}⚠️  Docker not found (optional for local dev)${NC}"
    fi
    
    if ! command -v cast &> /dev/null; then
        echo -e "${YELLOW}⚠️  Foundry (cast) not found${NC}"
        echo "   Install with: curl -L https://foundry.paradigm.xyz | bash"
    fi
    
    echo -e "${GREEN}✅ Dependencies OK${NC}"
    echo ""
}

# Setup environment
setup_env() {
    echo "⚙️  Setting up environment..."
    
    if [ ! -f .env ]; then
        cp .env.example .env
        echo -e "${YELLOW}⚠️  Created .env file${NC}"
        echo "   Please edit .env and set:"
        echo "   - ORACLE_PRIVATE_KEY (generate with: cast wallet new)"
        echo "   - ADMIN_API_KEY (any random string)"
        echo ""
        echo -e "${RED}❌ Setup paused - please configure .env${NC}"
        exit 1
    fi
    
    source .env 2>/dev/null || true
    
    if [ -z "$ORACLE_PRIVATE_KEY" ] || [ "$ORACLE_PRIVATE_KEY" = "0x..." ]; then
        echo -e "${RED}❌ ORACLE_PRIVATE_KEY not set in .env${NC}"
        echo "   Generate with: cast wallet new"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Environment configured${NC}"
    echo ""
}

# Install dependencies
install_deps() {
    echo "📥 Installing dependencies..."
    npm install
    echo -e "${GREEN}✅ Dependencies installed${NC}"
    echo ""
}

# Generate oracle addresses
generate_addresses() {
    echo "🔑 Generating oracle addresses..."
    
    if command -v cast &> /dev/null; then
        ADDRESS=$(cast wallet address --private-key $ORACLE_PRIVATE_KEY)
        
        # Update .env
        sed -i "s/TESTNET_ORACLE_ADDRESS=.*/TESTNET_ORACLE_ADDRESS=$ADDRESS/" .env
        sed -i "s/MAINNET_ORACLE_ADDRESS=.*/MAINNET_ORACLE_ADDRESS=$ADDRESS/" .env
        
        echo "   Oracle Address: $ADDRESS"
        echo -e "${GREEN}✅ Addresses updated in .env${NC}"
    else
        echo -e "${YELLOW}⚠️  Foundry not available${NC}"
        echo "   Please manually set TESTNET_ORACLE_ADDRESS and MAINNET_ORACLE_ADDRESS"
    fi
    echo ""
}

# Check balance
check_balance() {
    echo "💰 Checking testnet balance..."
    
    if command -v cast &> /dev/null; then
        ADDRESS=$(cast wallet address --private-key $ORACLE_PRIVATE_KEY)
        BALANCE=$(cast balance $ADDRESS --rpc-url https://testnet-rpc.monad.xyz 2>/dev/null || echo "0")
        BALANCE_ETH=$(cast --from-wei $BALANCE 2>/dev/null || echo "0")
        
        echo "   Address: $ADDRESS"
        echo "   Balance: $BALANCE_ETH MON"
        
        if [ "${BALANCE_ETH%.*}" -lt 1 ] 2>/dev/null || [ "$BALANCE_ETH" = "0" ]; then
            echo ""
            echo -e "${YELLOW}⚠️  Low balance - get testnet MON from:${NC}"
            echo "   https://faucet.monad.xyz"
            echo "   Or use: curl -X POST https://agents.devnads.com/v1/faucet"
        else
            echo -e "${GREEN}✅ Balance sufficient${NC}"
        fi
    fi
    echo ""
}

# Deploy token
deploy_token() {
    echo "🚀 Deploying FORTUNE token..."
    echo ""
    
    read -p "Deploy FORTUNE token on testnet? (requires 0.01 MON) [y/N] " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        node scripts/deploy-token.js testnet 0.01
        
        # Reload .env to get new token address
        source .env 2>/dev/null || true
        
        echo ""
        echo -e "${GREEN}✅ Token deployed!${NC}"
    else
        echo -e "${YELLOW}⚠️  Skipping token deployment${NC}"
        echo "   Deploy later with: node scripts/deploy-token.js testnet 0.01"
    fi
    echo ""
}

# Start services
start_services() {
    echo "🐳 Starting services..."
    
    if command -v docker &> /dev/null; then
        docker-compose up -d
        echo -e "${GREEN}✅ Services started${NC}"
        echo ""
        echo "   API: http://localhost:3000"
        echo "   Health: http://localhost:3000/health"
        
        # Wait for health check
        echo ""
        echo "⏳ Waiting for service to be ready..."
        sleep 3
        
        if curl -s http://localhost:3000/health > /dev/null; then
            echo -e "${GREEN}✅ Service is healthy!${NC}"
        else
            echo -e "${YELLOW}⚠️  Service starting... check with: curl http://localhost:3000/health${NC}"
        fi
    else
        echo "   Starting without Docker..."
        npm start &
        echo -e "${GREEN}✅ Service started in background${NC}"
    fi
    echo ""
}

# Print summary
print_summary() {
    source .env 2>/dev/null || true
    
    echo ""
    echo "========================================"
    echo "🔮 MON Fortune Oracle - Setup Complete!"
    echo "========================================"
    echo ""
    
    if command -v cast &> /dev/null; then
        ADDRESS=$(cast wallet address --private-key $ORACLE_PRIVATE_KEY)
        echo "Oracle Address: $ADDRESS"
    fi
    
    if [ -n "$TESTNET_FORTUNE_TOKEN_ADDRESS" ] && [ "$TESTNET_FORTUNE_TOKEN_ADDRESS" != "0x..." ]; then
        echo "Token Address:  $TESTNET_FORTUNE_TOKEN_ADDRESS"
    fi
    
    echo ""
    echo "🧪 Test Commands:"
    echo "================="
    echo ""
    echo "# Check health:"
    echo "curl http://localhost:3000/health"
    echo ""
    echo "# Get token info:"
    echo "curl http://localhost:3000/token/info?network=testnet"
    echo ""
    echo "# Get fortune (after sending MON):"
    echo "curl -X POST http://localhost:3000/fortune \\"
    echo "  -H 'Content-Type: application/json' \\"
    echo "  -d '{\"txhash\":\"0x...\",\"message\":\"Will I win?\",\"network\":\"testnet\"}'"
    echo ""
    echo "📚 Documentation:"
    echo "================"
    echo "   SKILL.md       - Full API documentation"
    echo "   SUBMISSION.md  - Hackathon submission details"
    echo ""
}

# Main
main() {
    check_deps
    setup_env
    install_deps
    generate_addresses
    check_balance
    deploy_token
    start_services
    print_summary
}

main