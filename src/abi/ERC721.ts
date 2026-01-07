/**
 * Starknet ABI for ERC721 contract (Cairo format)
 * Based on OpenZeppelin's ERC721 implementation for Starknet
 *
 * Note: Starknet uses snake_case for function names
 */
export const ERC721ABI = [
  // View functions
  {
    name: 'name',
    type: 'function',
    inputs: [],
    outputs: [{ name: 'name', type: 'felt252' }],
    state_mutability: 'view'
  },
  {
    name: 'symbol',
    type: 'function',
    inputs: [],
    outputs: [{ name: 'symbol', type: 'felt252' }],
    state_mutability: 'view'
  },
  {
    name: 'token_uri',
    type: 'function',
    inputs: [{ name: 'token_id', type: 'u256' }],
    outputs: [{ name: 'uri', type: 'Array<felt252>' }],
    state_mutability: 'view'
  },
  {
    name: 'balance_of',
    type: 'function',
    inputs: [{ name: 'account', type: 'ContractAddress' }],
    outputs: [{ name: 'balance', type: 'u256' }],
    state_mutability: 'view'
  },
  {
    name: 'owner_of',
    type: 'function',
    inputs: [{ name: 'token_id', type: 'u256' }],
    outputs: [{ name: 'owner', type: 'ContractAddress' }],
    state_mutability: 'view'
  },
  {
    name: 'get_approved',
    type: 'function',
    inputs: [{ name: 'token_id', type: 'u256' }],
    outputs: [{ name: 'approved', type: 'ContractAddress' }],
    state_mutability: 'view'
  },
  {
    name: 'is_approved_for_all',
    type: 'function',
    inputs: [
      { name: 'owner', type: 'ContractAddress' },
      { name: 'operator', type: 'ContractAddress' }
    ],
    outputs: [{ name: 'is_approved', type: 'bool' }],
    state_mutability: 'view'
  },
  {
    name: 'supports_interface',
    type: 'function',
    inputs: [{ name: 'interface_id', type: 'felt252' }],
    outputs: [{ name: 'is_supported', type: 'bool' }],
    state_mutability: 'view'
  },

  // External functions
  {
    name: 'approve',
    type: 'function',
    inputs: [
      { name: 'to', type: 'ContractAddress' },
      { name: 'token_id', type: 'u256' }
    ],
    outputs: [],
    state_mutability: 'external'
  },
  {
    name: 'set_approval_for_all',
    type: 'function',
    inputs: [
      { name: 'operator', type: 'ContractAddress' },
      { name: 'approved', type: 'bool' }
    ],
    outputs: [],
    state_mutability: 'external'
  },
  {
    name: 'transfer_from',
    type: 'function',
    inputs: [
      { name: 'from', type: 'ContractAddress' },
      { name: 'to', type: 'ContractAddress' },
      { name: 'token_id', type: 'u256' }
    ],
    outputs: [],
    state_mutability: 'external'
  },
  {
    name: 'safe_transfer_from',
    type: 'function',
    inputs: [
      { name: 'from', type: 'ContractAddress' },
      { name: 'to', type: 'ContractAddress' },
      { name: 'token_id', type: 'u256' },
      { name: 'data', type: 'Array<felt252>' }
    ],
    outputs: [],
    state_mutability: 'external'
  },

  // Events
  {
    name: 'Transfer',
    type: 'event',
    keys: [
      { name: 'from', type: 'ContractAddress' },
      { name: 'to', type: 'ContractAddress' },
      { name: 'token_id', type: 'u256' }
    ],
    data: []
  },
  {
    name: 'Approval',
    type: 'event',
    keys: [
      { name: 'owner', type: 'ContractAddress' },
      { name: 'approved', type: 'ContractAddress' },
      { name: 'token_id', type: 'u256' }
    ],
    data: []
  },
  {
    name: 'ApprovalForAll',
    type: 'event',
    keys: [
      { name: 'owner', type: 'ContractAddress' },
      { name: 'operator', type: 'ContractAddress' }
    ],
    data: [{ name: 'approved', type: 'bool' }]
  }
];

// Export the old name for backward compatibility
export const ERC721 = ERC721ABI;
