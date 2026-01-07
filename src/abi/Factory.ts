/**
 * Starknet ABI for Pair Factory contract (Cairo format)
 * This is a placeholder ABI - replace with actual deployed contract ABI
 *
 * Note: Starknet ABIs use snake_case for function names
 */
export const FactoryABI = [
  // View functions
  {
    name: 'owner',
    type: 'function',
    inputs: [],
    outputs: [{ name: 'owner', type: 'ContractAddress' }],
    state_mutability: 'view'
  },
  {
    name: 'protocol_fee_multiplier',
    type: 'function',
    inputs: [],
    outputs: [{ name: 'multiplier', type: 'u256' }],
    state_mutability: 'view'
  },
  {
    name: 'protocol_fee_recipient',
    type: 'function',
    inputs: [],
    outputs: [{ name: 'recipient', type: 'ContractAddress' }],
    state_mutability: 'view'
  },
  {
    name: 'is_valid_pair',
    type: 'function',
    inputs: [{ name: 'pair_address', type: 'ContractAddress' }],
    outputs: [{ name: 'is_valid', type: 'bool' }],
    state_mutability: 'view'
  },
  {
    name: 'bonding_curve_allowed',
    type: 'function',
    inputs: [{ name: 'curve', type: 'ContractAddress' }],
    outputs: [{ name: 'allowed', type: 'bool' }],
    state_mutability: 'view'
  },
  {
    name: 'get_pair_nft_type',
    type: 'function',
    inputs: [{ name: 'pair_address', type: 'ContractAddress' }],
    outputs: [{ name: 'nft_type', type: 'u8' }],
    state_mutability: 'view'
  },
  {
    name: 'get_pair_token_type',
    type: 'function',
    inputs: [{ name: 'pair_address', type: 'ContractAddress' }],
    outputs: [{ name: 'token_type', type: 'u8' }],
    state_mutability: 'view'
  },

  // External functions - Create Pairs
  {
    name: 'create_pair_erc721_eth',
    type: 'function',
    inputs: [
      { name: 'nft', type: 'ContractAddress' },
      { name: 'bonding_curve', type: 'ContractAddress' },
      { name: 'asset_recipient', type: 'ContractAddress' },
      { name: 'pool_type', type: 'u8' },
      { name: 'delta', type: 'u128' },
      { name: 'fee', type: 'u128' },
      { name: 'spot_price', type: 'u128' },
      { name: 'initial_nft_ids', type: 'Array<u256>' }
    ],
    outputs: [{ name: 'pair', type: 'ContractAddress' }],
    state_mutability: 'external'
  },
  {
    name: 'create_pair_erc721_erc20',
    type: 'function',
    inputs: [
      { name: 'token', type: 'ContractAddress' },
      { name: 'nft', type: 'ContractAddress' },
      { name: 'bonding_curve', type: 'ContractAddress' },
      { name: 'asset_recipient', type: 'ContractAddress' },
      { name: 'pool_type', type: 'u8' },
      { name: 'delta', type: 'u128' },
      { name: 'fee', type: 'u128' },
      { name: 'spot_price', type: 'u128' },
      { name: 'initial_nft_ids', type: 'Array<u256>' },
      { name: 'initial_token_balance', type: 'u256' }
    ],
    outputs: [{ name: 'pair', type: 'ContractAddress' }],
    state_mutability: 'external'
  },

  // External functions - Deposits
  {
    name: 'deposit_nfts',
    type: 'function',
    inputs: [
      { name: 'nft', type: 'ContractAddress' },
      { name: 'ids', type: 'Array<u256>' },
      { name: 'recipient', type: 'ContractAddress' }
    ],
    outputs: [],
    state_mutability: 'external'
  },
  {
    name: 'deposit_erc20',
    type: 'function',
    inputs: [
      { name: 'token', type: 'ContractAddress' },
      { name: 'recipient', type: 'ContractAddress' },
      { name: 'amount', type: 'u256' }
    ],
    outputs: [],
    state_mutability: 'external'
  },

  // Admin functions
  {
    name: 'set_bonding_curve_allowed',
    type: 'function',
    inputs: [
      { name: 'bonding_curve', type: 'ContractAddress' },
      { name: 'is_allowed', type: 'bool' }
    ],
    outputs: [],
    state_mutability: 'external'
  },
  {
    name: 'change_protocol_fee_multiplier',
    type: 'function',
    inputs: [{ name: 'new_multiplier', type: 'u256' }],
    outputs: [],
    state_mutability: 'external'
  },
  {
    name: 'change_protocol_fee_recipient',
    type: 'function',
    inputs: [{ name: 'new_recipient', type: 'ContractAddress' }],
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
    name: 'NewERC721Pair',
    type: 'event',
    keys: [{ name: 'pool_address', type: 'ContractAddress' }],
    data: [{ name: 'initial_ids', type: 'Array<u256>' }]
  },
  {
    name: 'NFTDeposit',
    type: 'event',
    keys: [{ name: 'pool_address', type: 'ContractAddress' }],
    data: [{ name: 'ids', type: 'Array<u256>' }]
  },
  {
    name: 'ERC20Deposit',
    type: 'event',
    keys: [{ name: 'pool_address', type: 'ContractAddress' }],
    data: [{ name: 'amount', type: 'u256' }]
  },
  {
    name: 'BondingCurveStatusUpdate',
    type: 'event',
    keys: [{ name: 'bonding_curve', type: 'ContractAddress' }],
    data: [{ name: 'is_allowed', type: 'bool' }]
  },
  {
    name: 'ProtocolFeeMultiplierUpdate',
    type: 'event',
    keys: [],
    data: [{ name: 'new_multiplier', type: 'u256' }]
  },
  {
    name: 'OwnershipTransferred',
    type: 'event',
    keys: [
      { name: 'previous_owner', type: 'ContractAddress' },
      { name: 'new_owner', type: 'ContractAddress' }
    ],
    data: []
  }
];
