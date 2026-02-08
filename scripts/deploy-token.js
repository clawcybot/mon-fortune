const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

// Testnet config
const CONFIG = {
  apiUrl: 'https://dev-api.nad.fun',
  rpcUrl: 'https://testnet-rpc.monad.xyz',
  CURVE: '0x1228b0dc9481C11D3071E7A924B794CfB038994e',
  BONDING_CURVE_ROUTER: '0x865054F0F6A288adaAc30261731361EA7E908003',
  LENS: '0xB056d79CA5257589692699a46623F901a3BB76f1'
};

// BondingCurveRouter ABI (minimal)
const BONDING_CURVE_ROUTER_ABI = [
  {
    "inputs": [{"components": [{"internalType": "string", "name": "name", "type": "string"}, {"internalType": "string", "name": "symbol", "type": "string"}, {"internalType": "string", "name": "tokenURI", "type": "string"}, {"internalType": "uint256", "name": "amountOut", "type": "uint256"}, {"internalType": "bytes32", "name": "salt", "type": "bytes32"}, {"internalType": "uint256", "name": "actionId", "type": "uint256"}], "internalType": "struct IBondingCurveRouter.CreateParams", "name": "params", "type": "tuple"}],
    "name": "create",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  }
];

const CURVE_ABI = [
  "function feeConfig() view returns (uint256, uint256, uint256, uint256, uint256)",
  "event CurveCreate(address indexed token, address indexed pool, address indexed creator)"
];

async function main() {
  // Load wallet
  const privateKey = process.env.ORACLE_PRIVATE_KEY;
  const provider = new ethers.JsonRpcProvider(CONFIG.rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);
  
  console.log('Deploying FORTUNE token...');
  console.log('Creator:', wallet.address);
  
  // Step 1: Create a simple SVG image for the token
  const svgImage = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <rect width="100" height="100" fill="#6B46C1"/>
    <text x="50" y="55" font-size="40" text-anchor="middle" fill="white">🔮</text>
  </svg>`;
  const imageBuffer = Buffer.from(svgImage);
  
  // Step 1: Upload image
  console.log('Uploading image...');
  const imageResponse = await fetch(`${CONFIG.apiUrl}/agent/token/image`, {
    method: 'POST',
    headers: { 'Content-Type': 'image/svg+xml' },
    body: imageBuffer
  });
  
  if (!imageResponse.ok) {
    throw new Error(`Image upload failed: ${imageResponse.status}`);
  }
  
  const { image_uri, is_nsfw } = await imageResponse.json();
  console.log('Image URI:', image_uri);
  console.log('NSFW:', is_nsfw);
  
  // Step 2: Upload metadata
  console.log('Uploading metadata...');
  const metadataResponse = await fetch(`${CONFIG.apiUrl}/agent/token/metadata`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image_uri,
      name: 'MON Fortune',
      symbol: 'FORTUNE',
      description: 'Fortune-telling token for the Monad ecosystem. Earn FORTUNE by consulting the oracle.',
      website: 'https://github.com/clawcybot/mon-fortune'
    })
  });
  
  if (!metadataResponse.ok) {
    throw new Error(`Metadata upload failed: ${metadataResponse.status}`);
  }
  
  const { metadata_uri } = await metadataResponse.json();
  console.log('Metadata URI:', metadata_uri);
  
  // Step 3: Mine salt
  console.log('Mining salt...');
  const saltResponse = await fetch(`${CONFIG.apiUrl}/agent/salt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      creator: wallet.address,
      name: 'MON Fortune',
      symbol: 'FORTUNE',
      metadata_uri
    })
  });
  
  if (!saltResponse.ok) {
    throw new Error(`Salt mining failed: ${saltResponse.status}`);
  }
  
  const { salt, address: predictedAddress } = await saltResponse.json();
  console.log('Salt:', salt);
  console.log('Predicted address:', predictedAddress);
  
  // Step 4: Use known deploy fee (10 MON based on docs)
  console.log('Using deploy fee: 10 MON');
  const deployFeeAmount = ethers.parseEther('10');
  
  // Step 4: Create token on-chain
  console.log('Creating token...');
  const router = new ethers.Contract(CONFIG.BONDING_CURVE_ROUTER, BONDING_CURVE_ROUTER_ABI, wallet);
  
  const createParams = {
    name: 'MON Fortune',
    symbol: 'FORTUNE',
    tokenURI: metadata_uri,
    amountOut: 0, // No initial buy
    salt: salt,
    actionId: 1
  };
  
  const tx = await router.create(createParams, {
    value: deployFeeAmount
  });
  
  console.log('Transaction sent:', tx.hash);
  const receipt = await tx.wait();
  console.log('Transaction confirmed!');
  
  // Parse event to get token address
  let tokenAddress = null;
  let poolAddress = null;
  
  for (const log of receipt.logs) {
    try {
      const iface = new ethers.Interface(CURVE_ABI);
      const parsed = iface.parseLog({ topics: log.topics, data: log.data });
      if (parsed && parsed.name === 'CurveCreate') {
        tokenAddress = parsed.args.token;
        poolAddress = parsed.args.pool;
        break;
      }
    } catch (e) {
      // Not the event we're looking for
    }
  }
  
  if (tokenAddress) {
    console.log('\n✅ Token deployed successfully!');
    console.log('Token Address:', tokenAddress);
    console.log('Pool Address:', poolAddress);
    console.log('Explorer:', `https://testnet.monadexplorer.com/address/${tokenAddress}`);
    
    // Save to env file
    const envPath = path.join(__dirname, '..', '.env');
    let envContent = fs.readFileSync(envPath, 'utf8');
    envContent = envContent.replace(
      'FORTUNE_TOKEN_ADDRESS_TESTNET=',
      `FORTUNE_TOKEN_ADDRESS_TESTNET=${tokenAddress}`
    );
    fs.writeFileSync(envPath, envContent);
    console.log('\nToken address saved to .env file');
  } else {
    console.log('Could not parse token address from logs');
    console.log('Receipt logs:', receipt.logs);
  }
}

main().catch(console.error);
