import { Injectable } from '@angular/core';

/**
 * Validation service for Starknet-related inputs
 * Provides security-focused validation for addresses, NFT IDs, and prices
 */
@Injectable({
  providedIn: 'root'
})
export class ValidationService {
  /**
   * Validate a Starknet address
   * Starknet addresses are hex strings up to 64 characters (felt252)
   * @param address The address to validate
   * @returns true if the address is valid
   */
  isValidStarknetAddress(address: string): boolean {
    if (!address || typeof address !== 'string') {
      return false;
    }

    // Must start with 0x
    if (!address.startsWith('0x')) {
      return false;
    }

    const hexPart = address.slice(2);

    // Must have at least 1 character and at most 64 characters
    if (hexPart.length === 0 || hexPart.length > 64) {
      return false;
    }

    // Must be valid hex characters only
    return /^[0-9a-fA-F]+$/.test(hexPart);
  }

  /**
   * Sanitize and parse NFT IDs from a comma-separated string
   * @param input The comma-separated string of NFT IDs
   * @returns Array of validated bigint NFT IDs
   * @throws Error if any ID is invalid
   */
  sanitizeNftIds(input: string): bigint[] {
    if (!input || typeof input !== 'string') {
      return [];
    }

    // Split by comma and filter out empty strings
    const parts = input.split(',').map(s => s.trim()).filter(s => s.length > 0);

    const result: bigint[] = [];

    for (const part of parts) {
      // Validate the format - only digits allowed
      if (!/^\d+$/.test(part)) {
        throw new Error(`Invalid NFT ID format: ${part}. Only numeric IDs are allowed.`);
      }

      // Check for reasonable length to prevent DoS
      if (part.length > 78) { // Max uint256 is 78 digits
        throw new Error(`NFT ID too large: ${part}`);
      }

      try {
        const id = BigInt(part);
        result.push(id);
      } catch (e) {
        throw new Error(`Failed to parse NFT ID: ${part}`);
      }
    }

    return result;
  }

  /**
   * Validate a price string
   * @param price The price string to validate
   * @returns true if the price is valid
   */
  isValidPrice(price: string): boolean {
    if (!price || typeof price !== 'string') {
      return false;
    }

    // Trim whitespace
    const trimmed = price.trim();

    if (trimmed.length === 0) {
      return false;
    }

    // Check for valid decimal number format
    // Allows: "123", "123.456", ".456", "0.456"
    if (!/^(\d+\.?\d*|\.\d+)$/.test(trimmed)) {
      return false;
    }

    // Parse to check if it's a valid positive number (zero not allowed)
    const num = parseFloat(trimmed);
    if (isNaN(num) || num <= 0) {
      return false;
    }

    // Check for reasonable precision (prevent DoS with extremely long strings)
    if (trimmed.length > 50) {
      return false;
    }

    return true;
  }

  /**
   * Normalize a Starknet address to lowercase with 0x prefix and proper padding
   * @param address The address to normalize
   * @returns Normalized address
   */
  normalizeAddress(address: string): string {
    if (!this.isValidStarknetAddress(address)) {
      throw new Error('Invalid Starknet address');
    }

    const hexPart = address.slice(2).toLowerCase();
    return '0x' + hexPart.padStart(64, '0');
  }

  /**
   * Validate a hex string (for transaction hashes, etc.)
   * @param hex The hex string to validate
   * @returns true if valid hex string
   */
  isValidHex(hex: string): boolean {
    if (!hex || typeof hex !== 'string') {
      return false;
    }

    if (!hex.startsWith('0x')) {
      return false;
    }

    const hexPart = hex.slice(2);
    return hexPart.length > 0 && /^[0-9a-fA-F]+$/.test(hexPart);
  }
}
