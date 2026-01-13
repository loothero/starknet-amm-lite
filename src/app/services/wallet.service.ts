import { Injectable, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Account, RpcProvider, Contract, uint256, CallData, constants } from 'starknet';
import { CHAIN_ID, ChainIdType, RPC_URLS, CONTRACT_ADDRESSES, STARKNET_CHAIN_ID } from './address';

// Starknet chain configuration
export interface StarknetChain {
  id: string;
  name: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrl: string;
}

// ERC20 ABI for balance checking (Starknet Cairo format)
const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    inputs: [{ name: 'account', type: 'felt' }],
    outputs: [{ name: 'balance', type: 'Uint256' }],
    stateMutability: 'view'
  },
  {
    name: 'decimals',
    type: 'function',
    inputs: [],
    outputs: [{ name: 'decimals', type: 'felt' }],
    stateMutability: 'view'
  }
];

// Wallet interface for Starknet wallets
interface StarknetWallet {
  id: string;
  name: string;
  icon: string;
  account?: Account;
  provider?: any;
  selectedAddress?: string;
  isConnected?: boolean;
  enable: () => Promise<string[]>;
  on: (event: string, callback: (...args: any[]) => void) => void;
  off: (event: string, callback: (...args: any[]) => void) => void;
}

/**
 * Runtime type guard to verify an object conforms to the StarknetWallet interface.
 * This prevents unsafe type assertions on arbitrary window properties.
 */
function isStarknetWallet(obj: unknown): obj is StarknetWallet {
  if (obj === null || typeof obj !== 'object') {
    return false;
  }
  const wallet = obj as Record<string, unknown>;
  // Required method: enable must be a function
  if (typeof wallet['enable'] !== 'function') {
    return false;
  }
  // Required methods: on and off must be functions for event handling
  if (typeof wallet['on'] !== 'function' || typeof wallet['off'] !== 'function') {
    return false;
  }
  return true;
}

@Injectable({
  providedIn: 'root'
})
export class WalletService {
  // Connected wallet object
  private wallet: StarknetWallet | null = null;
  private accountInstance: Account | null = null;

  // Current chain ID
  private currentChainId: ChainIdType = CHAIN_ID.MAINNET;

  // Reactive signals for wallet state
  public walletAddress = signal<string | null>(null);
  public isConnected = signal<boolean>(false);
  public balance = signal<string>('0');
  public chainId = signal<ChainIdType>(CHAIN_ID.MAINNET);

  constructor() {
    // Check for previously connected wallet on initialization
    this.checkExistingConnection();
  }

  /**
   * Check if there's an existing wallet connection
   */
  private async checkExistingConnection(): Promise<void> {
    try {
      // Check for injected Starknet wallets
      const starknetWallets = await this.getAvailableWallets();
      if (starknetWallets.length > 0) {
        // Try to auto-connect to the first available wallet if it was previously connected
        for (const wallet of starknetWallets) {
          try {
            if ((wallet as any).isConnected && (wallet as any).selectedAddress) {
              this.wallet = wallet as StarknetWallet;
              this.walletAddress.set((wallet as any).selectedAddress);
              this.isConnected.set(true);
              await this.detectChain();
              await this.fetchBalance();
              break;
            }
          } catch (e) {
            // Continue to next wallet
          }
        }
      }
    } catch (error) {
      console.log('No existing wallet connection found');
    }
  }

  /**
   * Get available Starknet wallets from the window object
   * @returns Array of detected wallet objects
   */
  private async getAvailableWallets(): Promise<StarknetWallet[]> {
    const wallets: StarknetWallet[] = [];

    // Check for common Starknet wallets
    if (typeof window !== 'undefined') {
      // Access window properties safely and validate with type guard
      const win = window as unknown as Record<string, unknown>;

      // ArgentX - validate before adding
      const argentX = win['starknet_argentX'];
      if (isStarknetWallet(argentX)) {
        wallets.push(argentX);
      }

      // Braavos - validate before adding
      const braavos = win['starknet_braavos'];
      if (isStarknetWallet(braavos)) {
        wallets.push(braavos);
      }

      // Generic starknet object (legacy) - validate before adding
      const genericWallet = win['starknet'];
      if (isStarknetWallet(genericWallet) && !wallets.includes(genericWallet)) {
        wallets.push(genericWallet);
      }
    }

    return wallets;
  }

  /**
   * Connect to a Starknet wallet (Argent X, Braavos, etc.)
   * @returns Promise<boolean> - true if connection successful
   */
  async connectWallet(): Promise<boolean> {
    try {
      const wallets = await this.getAvailableWallets();

      if (wallets.length === 0) {
        console.error('No Starknet wallets detected. Please install Argent X or Braavos.');
        return false;
      }

      // Use the first available wallet
      const selectedWallet = wallets[0];

      // Enable the wallet (request account access)
      const accounts = await selectedWallet.enable();

      if (accounts && accounts.length > 0) {
        this.wallet = selectedWallet;
        this.walletAddress.set(accounts[0]);
        this.isConnected.set(true);

        // Set up the account instance
        if (selectedWallet.account) {
          this.accountInstance = selectedWallet.account as Account;
        }

        // Detect the current chain
        await this.detectChain();

        // Fetch the balance after connecting
        await this.fetchBalance();

        // Listen for account changes
        this.setupEventListeners();

        return true;
      }

      return false;
    } catch (error) {
      console.error('Error connecting wallet:', error);
      return false;
    }
  }

  /**
   * Disconnect the current wallet
   */
  async disconnectWallet(): Promise<void> {
    try {
      this.wallet = null;
      this.accountInstance = null;
      this.walletAddress.set(null);
      this.isConnected.set(false);
      this.balance.set('0');
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
    }
  }

  /**
   * Setup event listeners for account/network changes
   */
  private setupEventListeners(): void {
    if (!this.wallet) return;

    // Listen for account changes
    this.wallet.on('accountsChanged', (accounts?: string[]) => {
      if (accounts && accounts.length > 0) {
        this.walletAddress.set(accounts[0]);
        this.fetchBalance();
      } else {
        this.walletAddress.set(null);
        this.isConnected.set(false);
      }
    });

    // Listen for network changes
    this.wallet.on('networkChanged', (network?: string) => {
      console.log('Network changed:', network);
      this.detectChain();
      this.fetchBalance();
    });
  }

  /**
   * Detect the current chain from the wallet
   */
  private async detectChain(): Promise<void> {
    if (!this.wallet) return;

    try {
      const provider = (this.wallet as any).provider;
      if (provider && typeof provider.getChainId === 'function') {
        const chainId = await provider.getChainId();
        if (chainId === STARKNET_CHAIN_ID.MAINNET || chainId === constants.StarknetChainId.SN_MAIN) {
          this.currentChainId = CHAIN_ID.MAINNET;
        } else {
          this.currentChainId = CHAIN_ID.SEPOLIA;
        }
      } else {
        // Default to mainnet
        this.currentChainId = CHAIN_ID.MAINNET;
      }
      this.chainId.set(this.currentChainId);
    } catch (error) {
      console.error('Error detecting chain:', error);
      // Default to mainnet
      this.currentChainId = CHAIN_ID.MAINNET;
      this.chainId.set(this.currentChainId);
    }
  }

  /**
   * Get the connected wallet address as an Observable
   * @returns Observable<string | null>
   */
  getConnectedWallet(): Observable<string | null> {
    return of(this.walletAddress());
  }

  /**
   * Get the current chain configuration
   * @returns StarknetChain object with chain details
   */
  getCurrentChain(): StarknetChain | null {
    return {
      id: this.currentChainId,
      name: this.currentChainId === CHAIN_ID.MAINNET ? 'Starknet Mainnet' : 'Starknet Sepolia',
      nativeCurrency: {
        name: 'Ethereum',
        symbol: 'ETH',
        decimals: 18
      },
      rpcUrl: RPC_URLS[this.currentChainId]
    };
  }

  /**
   * Get an RPC provider for the current chain
   * @returns RpcProvider instance
   */
  getProvider(): RpcProvider {
    return new RpcProvider({
      nodeUrl: RPC_URLS[this.currentChainId]
    });
  }

  /**
   * Get the Account object for signing transactions
   * @returns Account object or null
   */
  getAccount(): Account | null {
    if (!this.wallet || !this.walletAddress()) return null;

    // Return the cached account instance or create from wallet
    if (this.accountInstance) {
      return this.accountInstance;
    }

    // The wallet provides the account interface
    if ((this.wallet as any).account) {
      return (this.wallet as any).account as Account;
    }

    return null;
  }

  /**
   * Get the current chain ID
   * @returns ChainIdType
   */
  getCurrentChainId(): ChainIdType {
    return this.currentChainId;
  }

  /**
   * Fetch the ETH balance for the connected wallet
   */
  async fetchBalance(): Promise<void> {
    if (!this.walletAddress()) {
      this.balance.set('0');
      return;
    }

    try {
      const provider = this.getProvider();
      const ethAddress = CONTRACT_ADDRESSES[this.currentChainId].ETH_TOKEN;

      // Create contract instance for ETH token
      const ethContract = new Contract(ERC20_ABI, ethAddress, provider);

      // Call balanceOf
      const result = await ethContract['balanceOf'](this.walletAddress());

      // Convert Uint256 to BigInt and format
      const balanceBigInt = uint256.uint256ToBN(result.balance);
      const formattedBalance = this.formatEther(balanceBigInt);

      this.balance.set(formattedBalance);
    } catch (error) {
      console.error('Error fetching balance:', error);
      this.balance.set('0');
    }
  }

  /**
   * Format wei to ether (18 decimals)
   * @param wei BigInt value in wei
   * @returns Formatted string
   */
  private formatEther(wei: bigint): string {
    const divisor = BigInt(10 ** 18);
    const integerPart = wei / divisor;
    const fractionalPart = wei % divisor;

    // Convert fractional part to string and pad with zeros
    let fractionalStr = fractionalPart.toString().padStart(18, '0');

    // Trim trailing zeros but keep at least 4 decimal places
    fractionalStr = fractionalStr.replace(/0+$/, '');
    if (fractionalStr.length < 4) {
      fractionalStr = fractionalStr.padEnd(4, '0');
    }

    // Limit to 6 decimal places for display
    fractionalStr = fractionalStr.slice(0, 6);

    return `${integerPart}.${fractionalStr}`;
  }

  /**
   * Execute a contract call (read-only)
   * @param contractAddress The contract address
   * @param abi The contract ABI
   * @param functionName The function to call
   * @param args The function arguments
   * @returns Promise with the result
   */
  async callContract<T>(
    contractAddress: string,
    abi: any[],
    functionName: string,
    args: any[] = []
  ): Promise<T> {
    const provider = this.getProvider();
    const contract = new Contract(abi, contractAddress, provider);
    return await contract[functionName](...args);
  }

  /**
   * Execute a contract transaction (write)
   * @param contractAddress The contract address
   * @param abi The contract ABI
   * @param functionName The function to call
   * @param args The function arguments
   * @returns Promise with the transaction hash
   */
  async executeTransaction(
    contractAddress: string,
    abi: any[],
    functionName: string,
    args: any[] = []
  ): Promise<string> {
    const account = this.getAccount();
    if (!account) {
      throw new Error('No account available');
    }

    const provider = this.getProvider();
    const contract = new Contract(abi, contractAddress, provider);
    contract.connect(account);

    const result = await contract[functionName](...args);
    return result.transaction_hash;
  }

  /**
   * Wait for a transaction to be confirmed
   * @param txHash The transaction hash
   */
  async waitForTransaction(txHash: string): Promise<void> {
    const provider = this.getProvider();
    await provider.waitForTransaction(txHash);
  }

  /**
   * Execute multiple calls in a single transaction
   * @param calls Array of call objects
   * @returns Promise with the transaction hash
   */
  async executeMulticall(calls: { contractAddress: string; entrypoint: string; calldata: any[] }[]): Promise<string> {
    const account = this.getAccount();
    if (!account) {
      throw new Error('No account available');
    }

    const result = await account.execute(calls.map(call => ({
      contractAddress: call.contractAddress,
      entrypoint: call.entrypoint,
      calldata: CallData.compile(call.calldata)
    })));

    return result.transaction_hash;
  }
}
