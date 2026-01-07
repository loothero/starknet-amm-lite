// Starknet chain configuration
// Starknet uses different chain identifiers than EVM chains

// Define the chain ID type for Starknet
export const CHAIN_ID = {
  MAINNET: 'MAINNET',
  SEPOLIA: 'SEPOLIA'
} as const;

// Create a type from the values of CHAIN_ID
export type ChainIdType = typeof CHAIN_ID[keyof typeof CHAIN_ID];

// Starknet chain hex identifiers
export const STARKNET_CHAIN_ID = {
  MAINNET: '0x534e5f4d41494e', // "SN_MAIN" in hex
  SEPOLIA: '0x534e5f5345504f4c4941' // "SN_SEPOLIA" in hex
} as const;

// Define the contract addresses interface
// Note: Starknet addresses are felt252 (up to 64 hex characters)
interface ContractAddressesType {
  PAIR_FACTORY: string;
  LINEAR_CURVE: string;
  EXPONENTIAL_CURVE: string;
  XYK_CURVE: string;
  ROUTER: string;
  LISTING_BOOK: string;
  ETH_TOKEN: string;
  // Placeholder for future contracts
  KAMI?: string;
}

// Define the contract addresses record type
export type ContractAddressesRecord = Record<ChainIdType, ContractAddressesType>;

// Export the contract addresses with proper typing
// Note: These are placeholder addresses - actual deployed contract addresses should be filled in
export const CONTRACT_ADDRESSES: ContractAddressesRecord = {
  [CHAIN_ID.MAINNET]: {
    // Placeholder addresses for mainnet - replace with actual deployed addresses
    PAIR_FACTORY: '0x0000000000000000000000000000000000000000000000000000000000000000',
    LINEAR_CURVE: '0x0000000000000000000000000000000000000000000000000000000000000000',
    EXPONENTIAL_CURVE: '0x0000000000000000000000000000000000000000000000000000000000000000',
    XYK_CURVE: '0x0000000000000000000000000000000000000000000000000000000000000000',
    ROUTER: '0x0000000000000000000000000000000000000000000000000000000000000000',
    LISTING_BOOK: '0x0000000000000000000000000000000000000000000000000000000000000000',
    // ETH token on Starknet mainnet
    ETH_TOKEN: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7'
  },
  [CHAIN_ID.SEPOLIA]: {
    // Placeholder addresses for Sepolia testnet - replace with actual deployed addresses
    PAIR_FACTORY: '0x0000000000000000000000000000000000000000000000000000000000000000',
    LINEAR_CURVE: '0x0000000000000000000000000000000000000000000000000000000000000000',
    EXPONENTIAL_CURVE: '0x0000000000000000000000000000000000000000000000000000000000000000',
    XYK_CURVE: '0x0000000000000000000000000000000000000000000000000000000000000000',
    ROUTER: '0x0000000000000000000000000000000000000000000000000000000000000000',
    LISTING_BOOK: '0x0000000000000000000000000000000000000000000000000000000000000000',
    // ETH token on Starknet Sepolia
    ETH_TOKEN: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7'
  }
};

// RPC URLs for Starknet
export const RPC_URLS: Record<ChainIdType, string> = {
  [CHAIN_ID.MAINNET]: 'https://starknet-mainnet.public.blastapi.io',
  [CHAIN_ID.SEPOLIA]: 'https://starknet-sepolia.public.blastapi.io'
};

// Starknet address utilities
export function isValidStarknetAddress(address: string): boolean {
  // Starknet addresses are hex strings up to 64 characters (felt252)
  if (!address.startsWith('0x')) return false;
  const hexPart = address.slice(2);
  if (hexPart.length === 0 || hexPart.length > 64) return false;
  return /^[0-9a-fA-F]+$/.test(hexPart);
}

export function normalizeStarknetAddress(address: string): string {
  // Remove 0x prefix, pad to 64 characters, and add 0x prefix back
  if (!address.startsWith('0x')) {
    address = '0x' + address;
  }
  const hexPart = address.slice(2).toLowerCase();
  return '0x' + hexPart.padStart(64, '0');
}

export function shortenStarknetAddress(address: string, chars: number = 6): string {
  if (!address) return '';
  const normalized = normalizeStarknetAddress(address);
  return `${normalized.slice(0, chars + 2)}...${normalized.slice(-chars)}`;
}
