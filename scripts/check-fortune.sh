#!/bin/bash
# Check fortune for a transaction
# Usage: ./check-fortune.sh <txhash> "Your message" [network]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

# Load env if exists
if [ -f .env ]; then
  export $(cat .env | grep -v '#' | xargs) 2>/dev/null || true
fi

API_URL=${API_URL:-"http://localhost:3000"}

TXHASH=$1
MESSAGE=$2
NETWORK=$3

if [ -z "$TXHASH" ] || [ -z "$MESSAGE" ]; then
  echo "Usage: $0 <txhash> \"Your question/message\" [testnet|mainnet]"
  echo ""
  echo "Examples:"
  echo "  $0 0xabc123... \"Will my project succeed?\" testnet"
  echo "  $0 0xdef456... \"Should I deploy today?\" mainnet"
  echo ""
  echo "If network is omitted, auto-detection will be used."
  exit 1
fi

# Default to auto-detect if not specified
if [ -z "$NETWORK" ]; then
  NETWORK_PAYLOAD=""
  echo "🔮 Consulting the MON Fortune Oracle (auto-detecting network)..."
else
  NETWORK_PAYLOAD=",\"network\":\"$NETWORK\""
  echo "🔮 Consulting the MON Fortune Oracle on $NETWORK..."
fi

echo ""

# Make request
RESPONSE=$(curl -s -X POST "${API_URL}/fortune" \
  -H "Content-Type: application/json" \
  -d "{\"txhash\":\"${TXHASH}\",\"message\":\"${MESSAGE}\"$NETWORK_PAYLOAD}")

# Check if successful
if echo "$RESPONSE" | jq -e '.success' >/dev/null 2>&1; then
  echo "✅ Fortune Received!"
  echo ""
  echo "$RESPONSE" | jq -r '
    "🎲 Luck Score: \(.luck_score)/100 (\(.luck_tier))",
    "🔮 Fortune: \(.fortune)",
    "💰 MON Received: \(.mon_received)",
    "💸 MON Returned: \(.mon_sent)",
    "📈 Multiplier: \(.multiplier)x",
    "🔗 Network: \(.network)",
    "⏱️  Status: \(.return_status)",
    "",
    "Transaction: \(.explorer_url)"
  '
else
  echo "❌ Error:"
  echo "$RESPONSE" | jq -r '.error // "Unknown error"'
  exit 1
fi
