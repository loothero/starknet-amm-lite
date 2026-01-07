import { Injectable, signal, computed } from '@angular/core';
import { WalletService } from './wallet.service';
import { Pair721ABI } from '../../abi/Pair721';
import { uint256 } from 'starknet';

// Transaction status enum
export enum TransactionStatus {
  IDLE = 'idle',
  PENDING = 'pending',
  SUCCESS = 'success',
  ERROR = 'error'
}

// Starknet transaction hash type
export type StarknetHash = string;

// NFT transaction parameters interface
export interface NFTTransactionParams {
  pairAddress: string;
  nftIds: readonly bigint[];
  price: bigint;
}

// Transaction result interface
export interface TransactionResult {
  status: TransactionStatus;
  hash?: StarknetHash;
  error?: Error;
  pairAddress?: string;
}

@Injectable({
  providedIn: 'root'
})
export class NFTService {
  // Transaction status signals
  private readonly _transactionStatus = signal<TransactionStatus>(TransactionStatus.IDLE);
  private readonly _currentTransaction = signal<NFTTransactionParams | null>(null);
  private readonly _lastTransactionHash = signal<StarknetHash | null>(null);
  private readonly _lastError = signal<Error | null>(null);
  private readonly _lastResult = signal<TransactionResult | null>(null);

  // Public readonly signals
  public readonly transactionStatus = this._transactionStatus.asReadonly();
  public readonly currentTransaction = this._currentTransaction.asReadonly();
  public readonly lastTransactionHash = this._lastTransactionHash.asReadonly();
  public readonly lastError = this._lastError.asReadonly();
  public readonly lastResult = this._lastResult.asReadonly();

  // Computed signals for convenience
  public readonly isPending = computed(() => this._transactionStatus() === TransactionStatus.PENDING);
  public readonly isSuccess = computed(() => this._transactionStatus() === TransactionStatus.SUCCESS);
  public readonly isError = computed(() => this._transactionStatus() === TransactionStatus.ERROR);
  public readonly isIdle = computed(() => this._transactionStatus() === TransactionStatus.IDLE);

  // Legacy observable for backward compatibility (deprecated, use signals instead)
  public get transactionStatus$() {
    console.warn('transactionStatus$ is deprecated. Use transactionStatus signal instead.');
    return {
      subscribe: (callback: (status: TransactionStatus) => void) => {
        // Return a mock subscription that immediately calls with current value
        callback(this._transactionStatus());
        return { unsubscribe: () => {} };
      }
    };
  }

  constructor(private walletService: WalletService) {}

  /**
   * Buy an NFT from a listing
   * @param params The NFT transaction parameters
   * @returns A promise that resolves when the transaction is complete
   */
  async buyNFT(params: NFTTransactionParams): Promise<TransactionResult> {
    try {
      // Reset and set pending state
      this._transactionStatus.set(TransactionStatus.PENDING);
      this._currentTransaction.set(params);
      this._lastError.set(null);
      this._lastTransactionHash.set(null);

      // Check if there are any NFTs available
      if (!params.nftIds.length) {
        const error = new Error('No NFTs available in this listing');
        return this.handleTransactionError(error, params.pairAddress);
      }

      // Get the account
      const account = this.walletService.getAccount();
      if (!account) {
        const error = new Error('No wallet account available');
        return this.handleTransactionError(error, params.pairAddress);
      }

      // Get the wallet address
      const walletAddress = this.walletService.walletAddress();
      if (!walletAddress) {
        const error = new Error('No wallet address available');
        return this.handleTransactionError(error, params.pairAddress);
      }

      // Execute the swap transaction on Starknet
      const hash = await this.executeTransaction(
        params.pairAddress,
        params.nftIds[0],
        params.price,
        walletAddress
      );

      // Update hash signal
      this._lastTransactionHash.set(hash);

      // Wait for the transaction to be confirmed
      await this.walletService.waitForTransaction(hash);

      // Update wallet balance
      await this.walletService.fetchBalance();

      // Create success result
      const result: TransactionResult = {
        status: TransactionStatus.SUCCESS,
        hash,
        pairAddress: params.pairAddress
      };

      // Update signals
      this._transactionStatus.set(TransactionStatus.SUCCESS);
      this._lastResult.set(result);

      return result;
    } catch (error) {
      return this.handleTransactionError(error as Error, params.pairAddress);
    }
  }

  /**
   * Execute the NFT purchase transaction on Starknet
   * @param pairAddress The pair contract address
   * @param nftId The NFT ID to purchase
   * @param price The price to pay (in u256)
   * @param walletAddress The buyer's wallet address
   * @returns The transaction hash
   */
  private async executeTransaction(
    pairAddress: string,
    nftId: bigint,
    price: bigint,
    walletAddress: string
  ): Promise<StarknetHash> {
    // Convert values to Starknet format
    // NFT IDs array - in Cairo this would be a Span<u256>
    const nftIdU256 = uint256.bnToUint256(nftId);

    // Price as u256
    const priceU256 = uint256.bnToUint256(price);

    // Execute the transaction using the wallet service
    return await this.walletService.executeTransaction(
      pairAddress,
      Pair721ABI,
      'swap_token_for_specific_nfts',
      [
        [nftIdU256],           // nft_ids: Span<u256>
        priceU256,             // max_expected_token_input: u256
        walletAddress,         // nft_recipient: ContractAddress
        false,                 // is_router: bool
        '0x0'                  // router_caller: ContractAddress (zero address)
      ]
    );
  }

  /**
   * Handle transaction errors
   * @param error The error object
   * @param pairAddress Optional pair address for the result
   * @returns TransactionResult with error status
   */
  private handleTransactionError(error: Error, pairAddress?: string): TransactionResult {
    console.error('Error in NFT transaction:', error);

    const result: TransactionResult = {
      status: TransactionStatus.ERROR,
      error,
      pairAddress
    };

    // Update signals
    this._lastError.set(error);
    this._transactionStatus.set(TransactionStatus.ERROR);
    this._lastResult.set(result);

    return result;
  }

  /**
   * Reset the transaction status
   */
  public resetTransactionStatus(): void {
    this._transactionStatus.set(TransactionStatus.IDLE);
    this._currentTransaction.set(null);
    this._lastTransactionHash.set(null);
    this._lastError.set(null);
    this._lastResult.set(null);
  }
}
