/**
 * Base62 encoding for generating short, URL-safe codes
 * Character set: 0-9, a-z, A-Z (62 characters)
 * 
 * With 7 characters: 62^7 = 3,521,614,606,208 possible combinations
 */

const CHARSET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const BASE = BigInt(CHARSET.length);

/**
 * Encode a number to Base62 string
 */
export function encode(num: bigint): string {
  if (num === 0n) return CHARSET[0];
  
  let result = '';
  let n = num;
  
  while (n > 0n) {
    result = CHARSET[Number(n % BASE)] + result;
    n = n / BASE;
  }
  
  return result;
}

/**
 * Decode a Base62 string back to number
 */
export function decode(str: string): bigint {
  let result = 0n;
  
  for (const char of str) {
    const index = CHARSET.indexOf(char);
    if (index === -1) {
      throw new Error(`Invalid Base62 character: ${char}`);
    }
    result = result * BASE + BigInt(index);
  }
  
  return result;
}

/**
 * Generate a random Base62 string of specified length
 * Uses crypto-safe random values
 */
export function generateRandomCode(length: number): string {
  let result = '';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  
  for (let i = 0; i < length; i++) {
    result += CHARSET[array[i] % CHARSET.length];
  }
  
  return result;
}

/**
 * Generate a short code from a unique ID
 * Pads to minimum length if needed
 */
export function generateShortCode(id: bigint, minLength: number): string {
  const encoded = encode(id);
  
  if (encoded.length >= minLength) {
    return encoded;
  }
  
  // Pad with leading zeros
  return encoded.padStart(minLength, CHARSET[0]);
}

