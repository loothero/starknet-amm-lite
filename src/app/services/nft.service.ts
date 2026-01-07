import { Injectable } from '@angular/core';
import { Subject, BehaviorSubject } from 'rxjs';
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
  // Transaction status subjects
  private transactionStatus = new BehaviorSubject<TransactionStatus>(TransactionStatus.IDLE);
  private transactionStarted = new Subject<NFTTransactionParams>();
  private transactionPending = new Subject<StarknetHash>();
  private transactionSuccess = new Subject<StarknetHash>();
  private transactionError = new Subject<Error>();
  private transactionComplete = new Subject<TransactionResult>();

  // Current transaction data
  private currentTransaction: NFTTransactionParams | null = null;

  constructor(private walletService: WalletService) {}

  // Observable streams
  public transactionStatus$ = this.transactionStatus.asObservable();
  public transactionStarted$ = this.transactionStarted.asObservable();
  public transactionPending$ = this.transactionPending.asObservable();
  public transactionSuccess$ = this.transactionSuccess.asObservable();
  public transactionError$ = this.transactionError.asObservable();
  public transactionComplete$ = this.transactionComplete.asObservable();

  /**
   * Buy an NFT from a listing
   * @param params The NFT transaction parameters
   * @returns A promise that resolves when the transaction is complete
   */
  async buyNFT(params: NFTTransactionParams): Promise<TransactionResult> {
    try {
      // Reset transaction status
      this.transactionStatus.next(TransactionStatus.PENDING);
      this.currentTransaction = params;

      // Emit transaction started event
      this.transactionStarted.next(params);

      // Check if there are any NFTs available
      if (!params.nftIds.length) {
        const error = new Error('No NFTs available in this listing');
        this.handleTransactionError(error);
        return { status: TransactionStatus.ERROR, error, pairAddress: params.pairAddress };
      }

      // Get the account
      const account = this.walletService.getAccount();
      if (!account) {
        const error = new Error('No wallet account available');
        this.handleTransactionError(error);
        return { status: TransactionStatus.ERROR, error, pairAddress: params.pairAddress };
      }

      // Get the wallet address
      const walletAddress = this.walletService.walletAddress();
      if (!walletAddress) {
        const error = new Error('No wallet address available');
        this.handleTransactionError(error);
        return { status: TransactionStatus.ERROR, error, pairAddress: params.pairAddress };
      }

      // Execute the swap transaction on Starknet
      const hash = await this.executeTransaction(
        params.pairAddress,
        params.nftIds[0],
        params.price,
        walletAddress
      );

      // Emit transaction pending event
      this.transactionPending.next(hash);

      // Wait for the transaction to be confirmed
      await this.walletService.waitForTransaction(hash);

      // Update wallet balance
      await this.walletService.fetchBalance();

      // Emit transaction success event
      this.transactionSuccess.next(hash);

      // Emit transaction complete event
      const result = {
        status: TransactionStatus.SUCCESS,
        hash,
        pairAddress: params.pairAddress
      };
      this.transactionComplete.next(result);
      this.transactionStatus.next(TransactionStatus.SUCCESS);

      return result;
    } catch (error) {
      this.handleTransactionError(error as Error);
      return {
        status: TransactionStatus.ERROR,
        error: error as Error,
        pairAddress: params.pairAddress
      };
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
   */
  private handleTransactionError(error: Error): void {
    console.error('Error in NFT transaction:', error);
    this.transactionError.next(error);
    this.transactionComplete.next({
      status: TransactionStatus.ERROR,
      error,
      pairAddress: this.currentTransaction?.pairAddress
    });
    this.transactionStatus.next(TransactionStatus.ERROR);
  }

  /**
   * Reset the transaction status
   */
  public resetTransactionStatus(): void {
    this.transactionStatus.next(TransactionStatus.IDLE);
    this.currentTransaction = null;
  }
}
