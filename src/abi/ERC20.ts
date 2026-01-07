/**
 * Starknet ABI for ERC20 contract (Cairo format)
 * Based on OpenZeppelin's ERC20 implementation for Starknet
 *
 * Note: Starknet uses snake_case for function names
 * and Uint256 is represented as a struct with low and high fields
 */
export const ERC20ABI = [
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
    name: 'decimals',
    type: 'function',
    inputs: [],
    outputs: [{ name: 'decimals', type: 'u8' }],
    state_mutability: 'view'
  },
  {
    name: 'total_supply',
    type: 'function',
    inputs: [],
    outputs: [{ name: 'total_supply', type: 'u256' }],
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
    name: 'allowance',
    type: 'function',
    inputs: [
      { name: 'owner', type: 'ContractAddress' },
      { name: 'spender', type: 'ContractAddress' }
    ],
    outputs: [{ name: 'remaining', type: 'u256' }],
    state_mutability: 'view'
  },

  // External functions
  {
    name: 'transfer',
    type: 'function',
    inputs: [
      { name: 'recipient', type: 'ContractAddress' },
      { name: 'amount', type: 'u256' }
    ],
    outputs: [{ name: 'success', type: 'bool' }],
    state_mutability: 'external'
  },
  {
    name: 'transfer_from',
    type: 'function',
    inputs: [
      { name: 'sender', type: 'ContractAddress' },
      { name: 'recipient', type: 'ContractAddress' },
      { name: 'amount', type: 'u256' }
    ],
    outputs: [{ name: 'success', type: 'bool' }],
    state_mutability: 'external'
  },
  {
    name: 'approve',
    type: 'function',
    inputs: [
      { name: 'spender', type: 'ContractAddress' },
      { name: 'amount', type: 'u256' }
    ],
    outputs: [{ name: 'success', type: 'bool' }],
    state_mutability: 'external'
  },
  {
    name: 'increase_allowance',
    type: 'function',
    inputs: [
      { name: 'spender', type: 'ContractAddress' },
      { name: 'added_value', type: 'u256' }
    ],
    outputs: [{ name: 'success', type: 'bool' }],
    state_mutability: 'external'
  },
  {
    name: 'decrease_allowance',
    type: 'function',
    inputs: [
      { name: 'spender', type: 'ContractAddress' },
      { name: 'subtracted_value', type: 'u256' }
    ],
    outputs: [{ name: 'success', type: 'bool' }],
    state_mutability: 'external'
  },

  // Events
  {
    name: 'Transfer',
    type: 'event',
    keys: [
      { name: 'from', type: 'ContractAddress' },
      { name: 'to', type: 'ContractAddress' }
    ],
    data: [{ name: 'value', type: 'u256' }]
  },
  {
    name: 'Approval',
    type: 'event',
    keys: [
      { name: 'owner', type: 'ContractAddress' },
      { name: 'spender', type: 'ContractAddress' }
    ],
    data: [{ name: 'value', type: 'u256' }]
  }
];

// Export the old name for backward compatibility
export const ERC20 = ERC20ABI;

// Also export for use in wallet service
// This is a simplified ABI for balance checking
export const ERC20BalanceABI = [
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
