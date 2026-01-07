/**
 * Starknet doesn't have a traditional Multicall contract like EVM chains.
 * Instead, Starknet natively supports multicall through account abstraction.
 *
 * The Account.execute() method can execute multiple calls atomically.
 *
 * This file provides a placeholder for compatibility purposes.
 * The actual multicall functionality is implemented in the WalletService
 * using the account's execute method.
 */

// Starknet native multicall is done through account.execute()
// This type represents the call structure for Starknet multicall
export interface StarknetCall {
  contractAddress: string;
  entrypoint: string;
  calldata: string[];
}

// Placeholder ABI for any future multicall-like contract
export const MulticallABI = [
  {
    name: 'aggregate',
    type: 'function',
    inputs: [
      {
        name: 'calls',
        type: 'Array<(ContractAddress, felt252, Array<felt252>)>'
      }
    ],
    outputs: [
      { name: 'block_number', type: 'u64' },
      { name: 'return_data', type: 'Array<Array<felt252>>' }
    ],
    state_mutability: 'view'
  },
  {
    name: 'get_block_number',
    type: 'function',
    inputs: [],
    outputs: [{ name: 'block_number', type: 'u64' }],
    state_mutability: 'view'
  },
  {
    name: 'get_block_timestamp',
    type: 'function',
    inputs: [],
    outputs: [{ name: 'timestamp', type: 'u64' }],
    state_mutability: 'view'
  }
];

// Export the old name for backward compatibility
export const Multicall = MulticallABI;
