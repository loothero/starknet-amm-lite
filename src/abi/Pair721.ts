/**
 * Starknet ABI for Pair721 contract (Cairo format)
 * This is a placeholder ABI - replace with actual deployed contract ABI
 *
 * Note: Starknet ABIs use snake_case for function names
 * and different type representations than EVM ABIs
 */
export const Pair721ABI = [
  // View functions
  {
    name: 'get_all_ids',
    type: 'function',
    inputs: [],
    outputs: [{ name: 'ids', type: 'Array<u256>' }],
    state_mutability: 'view'
  },
  {
    name: 'get_buy_nft_quote',
    type: 'function',
    inputs: [
      { name: 'asset_id', type: 'u256' },
      { name: 'num_nfts', type: 'u256' }
    ],
    outputs: [
      { name: 'error', type: 'u8' },
      { name: 'new_spot_price', type: 'u256' },
      { name: 'new_delta', type: 'u256' },
      { name: 'input_amount', type: 'u256' },
      { name: 'protocol_fee', type: 'u256' },
      { name: 'royalty_amount', type: 'u256' }
    ],
    state_mutability: 'view'
  },
  {
    name: 'get_sell_nft_quote',
    type: 'function',
    inputs: [
      { name: 'asset_id', type: 'u256' },
      { name: 'num_nfts', type: 'u256' }
    ],
    outputs: [
      { name: 'error', type: 'u8' },
      { name: 'new_spot_price', type: 'u256' },
      { name: 'new_delta', type: 'u256' },
      { name: 'output_amount', type: 'u256' },
      { name: 'protocol_fee', type: 'u256' },
      { name: 'royalty_amount', type: 'u256' }
    ],
    state_mutability: 'view'
  },
  {
    name: 'nft',
    type: 'function',
    inputs: [],
    outputs: [{ name: 'nft_address', type: 'ContractAddress' }],
    state_mutability: 'view'
  },
  {
    name: 'owner',
    type: 'function',
    inputs: [],
    outputs: [{ name: 'owner', type: 'ContractAddress' }],
    state_mutability: 'view'
  },
  {
    name: 'spot_price',
    type: 'function',
    inputs: [],
    outputs: [{ name: 'price', type: 'u128' }],
    state_mutability: 'view'
  },
  {
    name: 'delta',
    type: 'function',
    inputs: [],
    outputs: [{ name: 'delta', type: 'u128' }],
    state_mutability: 'view'
  },
  {
    name: 'fee',
    type: 'function',
    inputs: [],
    outputs: [{ name: 'fee', type: 'u128' }],
    state_mutability: 'view'
  },
  {
    name: 'bonding_curve',
    type: 'function',
    inputs: [],
    outputs: [{ name: 'curve', type: 'ContractAddress' }],
    state_mutability: 'view'
  },
  {
    name: 'factory',
    type: 'function',
    inputs: [],
    outputs: [{ name: 'factory', type: 'ContractAddress' }],
    state_mutability: 'view'
  },
  {
    name: 'pool_type',
    type: 'function',
    inputs: [],
    outputs: [{ name: 'pool_type', type: 'u8' }],
    state_mutability: 'view'
  },
  {
    name: 'num_ids_held',
    type: 'function',
    inputs: [],
    outputs: [{ name: 'count', type: 'u256' }],
    state_mutability: 'view'
  },
  {
    name: 'has_id',
    type: 'function',
    inputs: [{ name: 'id', type: 'u256' }],
    outputs: [{ name: 'has', type: 'bool' }],
    state_mutability: 'view'
  },

  // External functions (state-changing)
  {
    name: 'swap_token_for_specific_nfts',
    type: 'function',
    inputs: [
      { name: 'nft_ids', type: 'Array<u256>' },
      { name: 'max_expected_token_input', type: 'u256' },
      { name: 'nft_recipient', type: 'ContractAddress' },
      { name: 'is_router', type: 'bool' },
      { name: 'router_caller', type: 'ContractAddress' }
    ],
    outputs: [{ name: 'input_amount', type: 'u256' }],
    state_mutability: 'external'
  },
  {
    name: 'swap_nfts_for_token',
    type: 'function',
    inputs: [
      { name: 'nft_ids', type: 'Array<u256>' },
      { name: 'min_expected_token_output', type: 'u256' },
      { name: 'token_recipient', type: 'ContractAddress' },
      { name: 'is_router', type: 'bool' },
      { name: 'router_caller', type: 'ContractAddress' }
    ],
    outputs: [{ name: 'output_amount', type: 'u256' }],
    state_mutability: 'external'
  },
  {
    name: 'withdraw_erc721',
    type: 'function',
    inputs: [
      { name: 'nft_address', type: 'ContractAddress' },
      { name: 'nft_ids', type: 'Array<u256>' }
    ],
    outputs: [],
    state_mutability: 'external'
  },
  {
    name: 'change_spot_price',
    type: 'function',
    inputs: [{ name: 'new_spot_price', type: 'u128' }],
    outputs: [],
    state_mutability: 'external'
  },
  {
    name: 'change_delta',
    type: 'function',
    inputs: [{ name: 'new_delta', type: 'u128' }],
    outputs: [],
    state_mutability: 'external'
  },
  {
    name: 'change_fee',
    type: 'function',
    inputs: [{ name: 'new_fee', type: 'u128' }],
    outputs: [],
    state_mutability: 'external'
  },
  {
    name: 'transfer_ownership',
    type: 'function',
    inputs: [{ name: 'new_owner', type: 'ContractAddress' }],
    outputs: [],
    state_mutability: 'external'
  },

  // Events
  {
    name: 'SwapNFTOutPair',
    type: 'event',
    keys: [],
    data: [
      { name: 'amount_in', type: 'u256' },
      { name: 'ids', type: 'Array<u256>' },
      { name: 'royalty_amount', type: 'u256' }
    ]
  },
  {
    name: 'SwapNFTInPair',
    type: 'event',
    keys: [],
    data: [
      { name: 'amount_out', type: 'u256' },
      { name: 'ids', type: 'Array<u256>' },
      { name: 'royalty_amount', type: 'u256' }
    ]
  },
  {
    name: 'SpotPriceUpdate',
    type: 'event',
    keys: [],
    data: [{ name: 'new_spot_price', type: 'u128' }]
  },
  {
    name: 'DeltaUpdate',
    type: 'event',
    keys: [],
    data: [{ name: 'new_delta', type: 'u128' }]
  },
  {
    name: 'FeeUpdate',
    type: 'event',
    keys: [],
    data: [{ name: 'new_fee', type: 'u128' }]
  },
  {
    name: 'OwnershipTransferred',
    type: 'event',
    keys: [{ name: 'new_owner', type: 'ContractAddress' }],
    data: []
  }
];

// Export the old name for backward compatibility
export const Pair721 = Pair721ABI;
