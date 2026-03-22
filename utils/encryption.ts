// utils/encryption.ts (or lib/encryption.ts - choose a suitable utility folder)
import crypto from 'crypto';

// Secret key for encryption (should be securely stored, for example in environment variables)
// IMPORTANT: For production, this should be an environment variable.
// Example: process.env.ENCRYPTION_KEY
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'a-very-strong-and-long-secret-key-for-my-app-0123456789'; // Ensure this is at least 32 bytes for AES-256
const IV_LENGTH = 16; // AES-256-CBC IV length is 16 bytes

// Hash the ENCRYPTION_KEY to 32 bytes (using SHA-256)
const key = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();

/**
 * Encrypts a given text string using AES-256-CBC.
 * The IV and encrypted data are combined and then single base64 URL-safe encoded.
 * @param text The string to encrypt.
 * @returns The URL-safe base64 encoded encrypted string, or null on error.
 */
export function encrypt(text: string): string | null {
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);

    // Encrypt the text, directly getting a Buffer for the encrypted output
    const encryptedBuffer = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);

    // Combine IV and encrypted buffer directly, then base64 URL-safe encode the combined buffer
    const combinedBuffer = Buffer.concat([iv, encryptedBuffer]);
    const base64Url = combinedBuffer.toString('base64')
                                    .replace(/\+/g, '-')
                                    .replace(/\//g, '_')
                                    .replace(/=+$/, ''); // Remove padding

    return base64Url;
  } catch (e) {
    console.error('Encryption failed:', e);
    return null;
  }
}

/**
 * Decrypts a URL-safe base64 encoded encrypted string.
 * @param encryptedText The encrypted string to decrypt.
 * @returns The decrypted string, or null on error.
 */
export function decrypt(encryptedText: string): string | null {
  try {
    // Re-add padding and convert URL-safe to standard Base64
    const base64 = encryptedText.replace(/-/g, '+').replace(/_/g, '/');
    const paddedBase64 = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');

    const combinedBuffer = Buffer.from(paddedBase64, 'base64');

    // Extract IV (first IV_LENGTH bytes) and encrypted data
    const iv = combinedBuffer.subarray(0, IV_LENGTH);
    const encrypted = combinedBuffer.subarray(IV_LENGTH);

    // Create decipher instance
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);

    // Decrypt the data
    let decrypted = decipher.update(encrypted, undefined, 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (e) {
    console.error('Decryption failed:', e);
    return null;
  }
}