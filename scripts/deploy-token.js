#!/usr/bin/env node
/**
 * FORTUNE Token Deployment Script
 * Deploys FORTUNE token on nad.fun bonding curve
 * 
 * Usage:
 *   node scripts/deploy-token.js [testnet|mainnet] [initial-buy-amount]
 * 
 * Example:
 *   node scripts/deploy-token.js testnet 0.01
 */

require('dotenv').config();
const { ethers } = require('ethers');
const { FortuneTokenManager } = require('../lib/token-manager');

async function deploy() {
  const network = process.argv[2] || 'testnet';
  const initialBuy = process.argv[3] || '0.01';

  if (!['testnet', 'mainnet'].includes(network)) {
    console.error('❌ Invalid network. Use: testnet or mainnet');
    process.exit(1);
  }

  console.log(`🔮 MON Fortune Token Deployment`);
  console.log(`================================`);
  console.log(`Network: ${network}`);
  console.log(`Initial Buy: ${initialBuy} MON`);
  console.log('');

  // Check environment
  if (!process.env.ORACLE_PRIVATE_KEY) {
    console.error('❌ ORACLE_PRIVATE_KEY not set in .env');
    process.exit(1);
  }

  const rpcUrl = network === 'testnet' 
    ? (process.env.TESTNET_RPC || 'https://testnet-rpc.monad.xyz')
    : (process.env.MAINNET_RPC || 'https://rpc.monad.xyz');

  try {
    // Setup provider and wallet
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(process.env.ORACLE_PRIVATE_KEY, provider);
    
    const balance = await provider.getBalance(wallet.address);
    console.log(`Deployer: ${wallet.address}`);
    console.log(`Balance: ${ethers.formatEther(balance)} MON`);
    console.log('');

    if (balance < ethers.parseEther(initialBuy)) {
      console.error(`❌ Insufficient balance. Need ${initialBuy} MON`);
      
      if (network === 'testnet') {
        console.log('');
        console.log('💧 Get testnet MON from:');
        console.log('   - https://faucet.monad.xyz');
        console.log('   - Or use Agent Faucet: POST https://agents.devnads.com/v1/faucet');
      }
      
      process.exit(1);
    }

    // Check if already deployed
    const existingToken = process.env[`${network.toUpperCase()}_FORTUNE_TOKEN_ADDRESS`];
    if (existingToken && existingToken !== '0x...') {
      console.log(`⚠️  Token already deployed: ${existingToken}`);
      console.log('   Set to 0x... in .env to redeploy');
      console.log('');
    }

    // Confirm deployment
    console.log('⚠️  This will deploy a new FORTUNE token on nad.fun');
    console.log(`   Spending ${initialBuy} MON for initial liquidity`);
    console.log('');
    
    // Deploy
    const manager = new FortuneTokenManager(provider, wallet, network);
    const result = await manager.deployToken(initialBuy);

    console.log('');
    console.log('✅ Deployment Successful!');
    console.log('========================');
    console.log(`Token Address: ${result.tokenAddress}`);
    console.log(`Transaction: ${result.txHash}`);
    console.log(`Explorer: ${manager.getExplorerUrl(result.txHash)}`);
    console.log(`nad.fun: ${manager.getNadFunUrl()}`);
    console.log('');
    console.log('⚠️  IMPORTANT: Add this to your .env file:');
    console.log(`${network.toUpperCase()}_FORTUNE_TOKEN_ADDRESS=${result.tokenAddress}`);
    console.log('');
    console.log('📝 For Hackathon Submission:');
    console.log(`   Token Address (${network}): ${result.tokenAddress}`);
    console.log(`   Deployer: ${wallet.address}`);
    console.log(`   Initial Buy: ${initialBuy} MON`);

  } catch (error) {
    console.error('');
    console.error('❌ Deployment Failed:');
    console.error(error.message);
    
    if (error.message.includes('insufficient funds')) {
      console.log('');
      console.log('💡 Need testnet MON? Visit https://faucet.monad.xyz');
    }
    
    process.exit(1);
  }
}

deploy();