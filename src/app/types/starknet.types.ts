/**
 * Starknet type definitions for improved type safety
 */

/**
 * Starknet felt252 type - a field element that can represent addresses, short strings, etc.
 * In Starknet, felt252 is the base type and is typically represented as a hex string or bigint
 */
export type StarknetFelt = `0x${string}` | bigint;

/**
 * Starknet u256 type - a 256-bit unsigned integer
 * In Cairo, u256 is represented as a struct with low and high u128 components
 */
export interface StarknetU256 {
  low: bigint | string;
  high: bigint | string;
}

/**
 * Wallet provider information returned by wallet detection
 */
export interface WalletProvider {
  id: string;
  name: string;
  icon: string;
  version?: string;
}

/**
 * NFT attribute structure following OpenSea metadata standard
 */
export interface NFTAttribute {
  trait_type: string;
  value: string | number;
  display_type?: 'number' | 'boost_number' | 'boost_percentage' | 'date';
}

/**
 * NFT metadata structure following OpenSea metadata standard
 */
export interface NFTMetadata {
  name: string;
  description?: string;
  image: string;
  external_url?: string;
  animation_url?: string;
  background_color?: string;
  attributes: NFTAttribute[];
}

/**
 * Starknet transaction receipt status
 */
export type TransactionReceiptStatus =
  | 'PENDING'
  | 'ACCEPTED_ON_L2'
  | 'ACCEPTED_ON_L1'
  | 'REJECTED';

/**
 * Starknet transaction receipt
 */
export interface StarknetTransactionReceipt {
  transaction_hash: string;
  status: TransactionReceiptStatus;
  block_hash?: string;
  block_number?: number;
  actual_fee?: StarknetU256;
  events?: StarknetEvent[];
}

/**
 * Starknet event structure
 */
export interface StarknetEvent {
  from_address: string;
  keys: string[];
  data: string[];
}

/**
 * Listing data for NFT pools
 */
export interface ListingData {
  pairAddress: string;
  nftIds: readonly bigint[];
  price: bigint;
  isBuying?: boolean;
}

/**
 * NFT data with price and metadata
 */
export interface NFTData {
  id: bigint;
  price: bigint;
  isBuying?: boolean;
  metadata?: NFTMetadata;
  isLoadingMetadata?: boolean;
  metadataError?: string;
}

/**
 * Pool type enum
 */
export enum PoolType {
  TOKEN = 0,
  NFT = 1,
  TRADE = 2
}

/**
 * Bonding curve type
 */
export enum BondingCurveType {
  LINEAR = 'linear',
  EXPONENTIAL = 'exponential',
  XYK = 'xyk'
}

/**
 * Contract call parameters
 */
export interface ContractCall {
  contractAddress: string;
  entrypoint: string;
  calldata: (string | number | bigint)[];
}

/**
 * Chain configuration
 */
export interface ChainConfig {
  id: string;
  name: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrl: string;
  explorerUrl?: string;
}

/**
 * Wallet connection state
 */
export interface WalletState {
  address: string | null;
  isConnected: boolean;
  chainId: string;
  balance: string;
}

/**
 * Buy NFT quote result
 */
export interface BuyNFTQuote {
  error: number;
  newSpotPrice: bigint;
  newDelta: bigint;
  inputAmount: bigint;
  protocolFee: bigint;
  royaltyAmount: bigint;
}

/**
 * Sell NFT quote result
 */
export interface SellNFTQuote {
  error: number;
  newSpotPrice: bigint;
  newDelta: bigint;
  outputAmount: bigint;
  protocolFee: bigint;
  royaltyAmount: bigint;
}
