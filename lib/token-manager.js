const { ethers } = require('ethers');

// FORTUNE Token ABI (nad.fun standard ERC20 with bonding curve)
const FORTUNE_TOKEN_ABI = [
  // ERC20 Standard
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address, uint256) returns (bool)",
  "function allowance(address, address) view returns (uint256)",
  "function approve(address, uint256) returns (bool)",
  "function transferFrom(address, address, uint256) returns (bool)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)",
  
  // nad.fun specific
  "function buyTokens(uint256 minTokens) payable",
  "function sellTokens(uint256 tokenAmount, uint256 minEth)",
  "function getBuyPrice(uint256 tokenAmount) view returns (uint256)",
  "function getSellPrice(uint256 tokenAmount) view returns (uint256)",
  "function currentPrice() view returns (uint256)",
  "function marketCap() view returns (uint256)",
  "function poolBalance() view returns (uint256)"
];

// nad.fun Bonding Curve Router ABI
const BONDING_CURVE_ROUTER_ABI = [
  "function createToken(string name, string symbol, string metadataURI, uint256 initialBuyAmount) payable returns (address tokenAddress)",
  "function getTokenPrice(address token, uint256 amount) view returns (uint256)",
  "function buyTokens(address token, uint256 minTokens) payable",
  "function sellTokens(address token, uint256 tokenAmount, uint256 minEth)"
];

// Contract addresses
const CONTRACTS = {
  testnet: {
    bondingCurveRouter: '0x6F6B8F1a20703309951a5127c45B49b1CD981A22', // Using mainnet addr as placeholder
    curve: '0xA7283d07812a02AFB7C09B60f8896bCEA3F90aCE',
    lens: '0x7e78A8DE94f21804F7a17F4E8BF9EC2c872187ea'
  },
  mainnet: {
    bondingCurveRouter: '0x6F6B8F1a20703309951a5127c45B49b1CD981A22',
    curve: '0xA7283d07812a02AFB7C09B60f8896bCEA3F90aCE',
    lens: '0x7e78A8DE94f21804F7a17F4E8BF9EC2c872187ea'
  }
};

class FortuneTokenManager {
  constructor(provider, wallet, network = 'testnet') {
    this.provider = provider;
    this.wallet = wallet;
    this.network = network;
    this.contracts = CONTRACTS[network];
    
    // Load token address from env or state
    this.tokenAddress = process.env[`${network.toUpperCase()}_FORTUNE_TOKEN_ADDRESS`];
    
    if (this.tokenAddress) {
      this.token = new ethers.Contract(this.tokenAddress, FORTUNE_TOKEN_ABI, wallet);
    }
    
    if (this.contracts.bondingCurveRouter) {
      this.router = new ethers.Contract(
        this.contracts.bondingCurveRouter,
        BONDING_CURVE_ROUTER_ABI,
        wallet
      );
    }
  }

  // Deploy FORTUNE token on nad.fun
  async deployToken(initialBuyAmount = '0.01') {
    if (!this.router) {
      throw new Error('Bonding curve router not configured');
    }

    console.log(`🚀 Deploying FORTUNE token on ${this.network}...`);
    
    const name = "MON Fortune";
    const symbol = "FORTUNE";
    const metadataURI = "https://mon-fortune.xyz/metadata.json";
    const initialBuyWei = ethers.parseEther(initialBuyAmount);

    try {
      const tx = await this.router.createToken(
        name,
        symbol,
        metadataURI,
        0, // minTokens (0 for no minimum)
        { value: initialBuyWei }
      );

      console.log(`⏳ Transaction submitted: ${tx.hash}`);
      const receipt = await tx.wait();
      
      // Parse token address from event logs
      const event = receipt.logs.find(log => {
        try {
          const parsed = this.router.interface.parseLog(log);
          return parsed?.name === 'TokenCreated';
        } catch (e) {
          return false;
        }
      });

      if (event) {
        const parsed = this.router.interface.parseLog(event);
        this.tokenAddress = parsed.args.tokenAddress;
        this.token = new ethers.Contract(this.tokenAddress, FORTUNE_TOKEN_ABI, this.wallet);
        
        console.log(`✅ FORTUNE token deployed!`);
        console.log(`   Address: ${this.tokenAddress}`);
        console.log(`   Explorer: ${this.getExplorerUrl(this.tokenAddress)}`);
        
        return {
          success: true,
          tokenAddress: this.tokenAddress,
          txHash: tx.hash,
          initialBuy: initialBuyAmount
        };
      }
      
      throw new Error('Could not parse token address from transaction');
      
    } catch (error) {
      console.error('❌ Token deployment failed:', error);
      throw error;
    }
  }

  // Buy FORTUNE tokens with MON
  async buyTokens(monAmount, minTokens = 0) {
    if (!this.token) {
      throw new Error('Token not deployed or configured');
    }

    const value = ethers.parseEther(monAmount.toString());
    
    try {
      const tx = await this.token.buyTokens(minTokens, { value });
      const receipt = await tx.wait();
      
      return {
        success: receipt.status === 1,
        txHash: tx.hash,
        monSpent: monAmount,
        explorerUrl: this.getExplorerUrl(tx.hash)
      };
    } catch (error) {
      console.error('Buy failed:', error);
      throw error;
    }
  }

  // Sell FORTUNE tokens for MON
  async sellTokens(tokenAmount, minMon = 0) {
    if (!this.token) {
      throw new Error('Token not deployed or configured');
    }

    const amount = ethers.parseUnits(tokenAmount.toString(), 18);
    
    try {
      const tx = await this.token.sellTokens(amount, ethers.parseEther(minMon.toString()));
      const receipt = await tx.wait();
      
      return {
        success: receipt.status === 1,
        txHash: tx.hash,
        explorerUrl: this.getExplorerUrl(tx.hash)
      };
    } catch (error) {
      console.error('Sell failed:', error);
      throw error;
    }
  }

  // Get token info
  async getTokenInfo() {
    if (!this.token) {
      return null;
    }

    try {
      const [name, symbol, decimals, totalSupply, price, marketCap] = await Promise.all([
        this.token.name(),
        this.token.symbol(),
        this.token.decimals(),
        this.token.totalSupply(),
        this.token.currentPrice().catch(() => 0),
        this.token.marketCap().catch(() => 0)
      ]);

      const balance = await this.token.balanceOf(this.wallet.address);

      return {
        address: this.tokenAddress,
        name,
        symbol,
        decimals,
        totalSupply: ethers.formatUnits(totalSupply, decimals),
        price: ethers.formatEther(price),
        marketCap: ethers.formatEther(marketCap),
        oracleBalance: ethers.formatUnits(balance, decimals),
        network: this.network
      };
    } catch (error) {
      console.error('Failed to get token info:', error);
      return null;
    }
  }

  // Get current buy price for a token amount
  async getBuyPrice(tokenAmount) {
    if (!this.token) return null;
    try {
      const price = await this.token.getBuyPrice(ethers.parseUnits(tokenAmount.toString(), 18));
      return ethers.formatEther(price);
    } catch (e) {
      return null;
    }
  }

  // Get current sell price for a token amount
  async getSellPrice(tokenAmount) {
    if (!this.token) return null;
    try {
      const price = await this.token.getSellPrice(ethers.parseUnits(tokenAmount.toString(), 18));
      return ethers.formatEther(price);
    } catch (e) {
      return null;
    }
  }

  // Reward user with FORTUNE tokens based on luck
  async rewardWithTokens(toAddress, luckScore, monAmount) {
    if (!this.token) {
      throw new Error('Token not deployed');
    }

    // Calculate token reward based on luck score
    const baseReward = parseFloat(monAmount) * 100; // 100 tokens per MON
    const multiplier = this.getLuckMultiplier(luckScore);
    const rewardAmount = baseReward * multiplier;

    try {
      const amountWei = ethers.parseUnits(rewardAmount.toFixed(6), 18);
      const tx = await this.token.transfer(toAddress, amountWei);
      const receipt = await tx.wait();

      return {
        success: receipt.status === 1,
        txHash: tx.hash,
        amount: rewardAmount.toFixed(6),
        multiplier,
        explorerUrl: this.getExplorerUrl(tx.hash)
      };
    } catch (error) {
      console.error('Token reward failed:', error);
      throw error;
    }
  }

  // Get luck multiplier for token rewards
  getLuckMultiplier(luckScore) {
    if (luckScore >= 96) return 5.0;   // Jackpot
    if (luckScore >= 81) return 2.0;   // Excellent
    if (luckScore >= 61) return 1.5;   // Good
    if (luckScore >= 41) return 1.0;   // Neutral
    if (luckScore >= 21) return 0.5;   // Poor
    return 0.1;                        // Bad (still get something!)
  }

  // Get explorer URL
  getExplorerUrl(addressOrTx) {
    const base = this.network === 'testnet' 
      ? 'https://testnet.monadexplorer.com'
      : 'https://monadexplorer.com';
    return `${base}/tx/${addressOrTx}`;
  }

  // Get nad.fun URL
  getNadFunUrl() {
    const base = this.network === 'testnet'
      ? 'https://dev.nad.fun'
      : 'https://nad.fun';
    return this.tokenAddress ? `${base}/token/${this.tokenAddress}` : base;
  }
}

module.exports = { FortuneTokenManager, FORTUNE_TOKEN_ABI, BONDING_CURVE_ROUTER_ABI, CONTRACTS };