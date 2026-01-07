/**
 * Starknet ABI for ListingBook contract (Cairo format)
 * This is a placeholder ABI - replace with actual deployed contract ABI
 *
 * Note: Starknet ABIs use snake_case for function names
 */
export const ListingBookABI = [
  // View functions
  {
    name: 'get_721_listings',
    type: 'function',
    inputs: [
      { name: 'collection', type: 'ContractAddress' },
      { name: 'token', type: 'ContractAddress' },
      { name: 'start', type: 'u256' },
      { name: 'end', type: 'u256' }
    ],
    outputs: [{ name: 'listings', type: 'Array<ContractAddress>' }],
    state_mutability: 'view'
  },
  {
    name: 'get_721_bids',
    type: 'function',
    inputs: [
      { name: 'collection', type: 'ContractAddress' },
      { name: 'token', type: 'ContractAddress' },
      { name: 'start', type: 'u256' },
      { name: 'end', type: 'u256' }
    ],
    outputs: [{ name: 'bids', type: 'Array<ContractAddress>' }],
    state_mutability: 'view'
  },
  {
    name: 'get_1155_listings',
    type: 'function',
    inputs: [
      { name: 'collection', type: 'ContractAddress' },
      { name: 'token', type: 'ContractAddress' },
      { name: 'nft_id', type: 'u256' },
      { name: 'start', type: 'u256' },
      { name: 'end', type: 'u256' }
    ],
    outputs: [{ name: 'listings', type: 'Array<ContractAddress>' }],
    state_mutability: 'view'
  },
  {
    name: 'get_1155_bids',
    type: 'function',
    inputs: [
      { name: 'collection', type: 'ContractAddress' },
      { name: 'token', type: 'ContractAddress' },
      { name: 'nft_id', type: 'u256' },
      { name: 'start', type: 'u256' },
      { name: 'end', type: 'u256' }
    ],
    outputs: [{ name: 'bids', type: 'Array<ContractAddress>' }],
    state_mutability: 'view'
  }
];

// Export the old name for backward compatibility
export const ListingBook = ListingBookABI;
