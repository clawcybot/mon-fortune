#!/bin/bash
# Setup script for MON Fortune Oracle
# Generates oracle addresses from private key

set -e

echo "🔮 MON Fortune Oracle Setup"
echo "============================"
echo ""

# Check if foundry is installed
if ! command -v cast &> /dev/null; then
    echo "❌ Foundry (cast) not found. Install with:"
    echo "   curl -L https://foundry.paradigm.xyz | bash"
    exit 1
fi

# Get private key
if [ -f .env ]; then
    source <(grep -v '^#' .env | xargs) 2>/dev/null || true
fi

if [ -z "$ORACLE_PRIVATE_KEY" ]; then
    echo "Enter your oracle private key (0x...):"
    read -s ORACLE_PRIVATE_KEY
    echo ""
fi

if [ -z "$ORACLE_PRIVATE_KEY" ] || [[ ! $ORACLE_PRIVATE_KEY =~ ^0x[0-9a-fA-F]{64}$ ]]; then
    echo "❌ Invalid private key format"
    exit 1
fi

echo "🔑 Generating oracle addresses..."
echo ""

# Generate addresses
TESTNET_ADDRESS=$(cast wallet address --private-key $ORACLE_PRIVATE_KEY)
MAINNET_ADDRESS=$TESTNET_ADDRESS  # Same address on both networks

echo "✅ Oracle Address (both networks): $TESTNET_ADDRESS"
echo ""

# Update .env file
if [ -f .env ]; then
    # Backup
    cp .env .env.backup.$(date +%s)
    
    # Update or add addresses
    if grep -q "TESTNET_ORACLE_ADDRESS=" .env; then
        sed -i "s/TESTNET_ORACLE_ADDRESS=.*/TESTNET_ORACLE_ADDRESS=$TESTNET_ADDRESS/" .env
    else
        echo "TESTNET_ORACLE_ADDRESS=$TESTNET_ADDRESS" >> .env
    fi
    
    if grep -q "MAINNET_ORACLE_ADDRESS=" .env; then
        sed -i "s/MAINNET_ORACLE_ADDRESS=.*/MAINNET_ORACLE_ADDRESS=$MAINNET_ADDRESS/" .env
    else
        echo "MAINNET_ORACLE_ADDRESS=$MAINNET_ADDRESS" >> .env
    fi
else
    # Create new .env
    cat > .env << EOF
ORACLE_PRIVATE_KEY=$ORACLE_PRIVATE_KEY
TESTNET_ORACLE_ADDRESS=$TESTNET_ADDRESS
MAINNET_ORACLE_ADDRESS=$MAINNET_ADDRESS
TESTNET_RPC=https://testnet-rpc.monad.xyz
MAINNET_RPC=https://rpc.monad.xyz
MIN_MON_AMOUNT=1000000000000000
MAX_RETURN=10000000000000000000
PORT=3000
RATE_LIMIT_MAX=100
EOF
fi

echo "✅ Configuration saved to .env"
echo ""
echo "📋 Next steps:"
echo "   1. Fund your oracle address:"
echo "      - Testnet: Get MON from https://faucet.monad.xyz"
echo "      - Mainnet: Send MON to $TESTNET_ADDRESS"
echo ""
echo "   2. Start the oracle:"
echo "      docker-compose up -d"
echo ""
echo "   3. Test it:"
echo "      curl http://localhost:3000/health"
echo ""
