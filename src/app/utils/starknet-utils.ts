/**
 * Starknet utility functions for common operations
 * Consolidates duplicate implementations across components
 */

/**
 * Convert felt252 to string
 * Starknet uses felt252 for short strings, which are encoded as hex values
 * @param felt The felt value (bigint, string, or hex string)
 * @returns The decoded string
 */
export function feltToString(felt: bigint | string): string {
  if (typeof felt === 'string') {
    // If it's already a hex string, decode it
    if (felt.startsWith('0x')) {
      const hex = felt.slice(2);
      let str = '';
      for (let i = 0; i < hex.length; i += 2) {
        const charCode = parseInt(hex.substring(i, i + 2), 16);
        if (charCode !== 0) {
          str += String.fromCharCode(charCode);
        }
      }
      return str;
    }
    return felt;
  }
  // If it's a BigInt, convert to hex and decode
  if (typeof felt === 'bigint') {
    const hex = felt.toString(16);
    let str = '';
    for (let i = 0; i < hex.length; i += 2) {
      const charCode = parseInt(hex.substring(i, i + 2), 16);
      if (charCode !== 0) {
        str += String.fromCharCode(charCode);
      }
    }
    return str;
  }
  return String(felt);
}

/**
 * Format a bigint price to a human-readable string
 * @param price The price as a bigint (in wei, 18 decimals)
 * @param decimals The number of decimals (default: 18, max: 78 for uint256)
 * @returns Formatted price string
 */
export function formatPrice(price: bigint, decimals: number = 18): string {
  // Validate decimals to prevent RangeError from 10 ** largeNumber
  if (!Number.isFinite(decimals) || !Number.isInteger(decimals) || decimals < 0 || decimals > 78) {
    console.error('formatPrice: decimals must be an integer between 0 and 78, got:', decimals);
    return '0.00';
  }

  try {
    const divisor = BigInt(10) ** BigInt(decimals);
    const integerPart = price / divisor;
    const fractionalPart = price % divisor;

    let fractionalStr = fractionalPart.toString().padStart(decimals, '0');
    fractionalStr = fractionalStr.replace(/0+$/, '');

    const numPrice = parseFloat(`${integerPart}.${fractionalStr || '0'}`);

    // Format the number based on its size
    if (numPrice < 0.000001 && numPrice > 0) {
      return numPrice.toExponential(2);
    } else if (numPrice < 0.001) {
      return numPrice.toFixed(6);
    } else if (numPrice < 1) {
      return numPrice.toFixed(4);
    } else {
      return numPrice.toFixed(2);
    }
  } catch (error) {
    console.error('Error formatting price:', error);
    return '0.00';
  }
}

/**
 * Format a BigInt value with decimals to a human-readable string
 * @param value The value as a bigint
 * @param decimals The number of decimals (max: 78 for uint256)
 * @returns Formatted string
 */
export function formatUnits(value: bigint, decimals: number): string {
  // Validate decimals to prevent RangeError
  if (!Number.isFinite(decimals) || !Number.isInteger(decimals) || decimals < 0 || decimals > 78) {
    console.error('formatUnits: decimals must be an integer between 0 and 78, got:', decimals);
    return '0';
  }

  const divisor = BigInt(10) ** BigInt(decimals);
  const integerPart = value / divisor;
  const fractionalPart = value % divisor;

  let fractionalStr = fractionalPart.toString().padStart(decimals, '0');
  fractionalStr = fractionalStr.replace(/0+$/, '');

  if (fractionalStr.length === 0) {
    return integerPart.toString();
  }

  // Limit to 6 decimal places
  fractionalStr = fractionalStr.slice(0, 6);

  return `${integerPart}.${fractionalStr}`;
}

/**
 * Parse a decimal string value to bigint with specified decimals
 * @param value The string value (e.g., "1.5")
 * @param decimals The number of decimals (max: 78 for uint256)
 * @returns The value as bigint
 * @throws Error if value format is invalid
 */
export function parseUnits(value: string, decimals: number): bigint {
  // Validate decimals
  if (!Number.isFinite(decimals) || !Number.isInteger(decimals) || decimals < 0 || decimals > 78) {
    throw new Error(`parseUnits: decimals must be an integer between 0 and 78, got: ${decimals}`);
  }

  // Handle empty input
  if (!value || value.trim() === '') {
    return 0n;
  }

  const trimmed = value.trim();

  // Validate input format: optional negative sign, digits, optional decimal point with digits
  // Allows: "123", "123.456", ".456", "0.456", "-123.456"
  if (!/^-?\d*\.?\d+$/.test(trimmed)) {
    throw new Error(`parseUnits: invalid number format: "${value}"`);
  }

  // Handle negative numbers
  const isNegative = trimmed.startsWith('-');
  const absoluteValue = isNegative ? trimmed.slice(1) : trimmed;

  // Split into integer and fractional parts
  const parts = absoluteValue.split('.');
  const integerPart = parts[0] || '0';
  let fractionalPart = parts[1] || '';

  // Pad or truncate fractional part to match decimals
  if (fractionalPart.length > decimals) {
    fractionalPart = fractionalPart.slice(0, decimals);
  } else {
    fractionalPart = fractionalPart.padEnd(decimals, '0');
  }

  // Combine and convert to bigint
  const combined = integerPart + fractionalPart;
  const result = BigInt(combined);

  return isNegative ? -result : result;
}
