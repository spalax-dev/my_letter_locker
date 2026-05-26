/**
 * EncryptionService — letter encryption/decryption using AES-GCM + PBKDF2
 *
 * Uses the native browser Web Crypto API (window.crypto.subtle) exclusively.
 * No external cryptography libraries required.
 *
 * Ciphertext format (Base64 of binary concatenation):
 *   [ salt: 16 bytes ][ iv: 12 bytes ][ encrypted: variable ]
 */

// ─── Errors ──────────────────────────────────────────────────────────────────

/**
 * Thrown when the decryption key is incorrect.
 * AES-GCM authenticates the ciphertext; if the key doesn't match,
 * crypto.subtle.decrypt throws a DOMException("OperationError").
 */
export class WrongPassphraseError extends Error {
  constructor() {
    super('The provided key is incorrect');
    this.name = 'WrongPassphraseError';
  }
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

/** Converts a UTF-8 string to ArrayBuffer */
function encodeText(text: string): ArrayBuffer {
  return new TextEncoder().encode(text).buffer as ArrayBuffer;
}

/** Converts an ArrayBuffer to UTF-8 string */
function decodeText(buffer: ArrayBuffer): string {
  return new TextDecoder().decode(buffer);
}

/** Converts an ArrayBuffer to Base64url string (URL-safe, no padding) */
function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  // Base64url: replace + with -, / with _, strip padding =
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Converts a Base64url (or standard Base64) string to Uint8Array */
function base64ToUint8Array(base64: string): Uint8Array {
  const standard = base64.replace(/-/g, '+').replace(/_/g, '/');
  const padded = standard + '='.repeat((4 - standard.length % 4) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Derives a 256-bit AES-GCM key from a passphrase and salt
 * using PBKDF2 with 100,000 iterations and SHA-256.
 */
async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encodeText(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt.buffer as ArrayBuffer,
      iterations: 100_000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Encrypts plaintext with the given passphrase.
 *
 * @returns Base64 of `[salt(16 bytes) | iv(12 bytes) | ciphertext]`
 */
export async function encrypt(plaintext: string, passphrase: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const key = await deriveKey(passphrase, salt);

  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encodeText(plaintext)
  );

  const encrypted = new Uint8Array(encryptedBuffer);
  const combined = new Uint8Array(salt.length + iv.length + encrypted.length);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(encrypted, salt.length + iv.length);

  return bufferToBase64(combined.buffer);
}

/**
 * Decrypts a ciphertext (Base64) with the given passphrase.
 *
 * @throws {WrongPassphraseError} if the key is incorrect or ciphertext is corrupted
 */
export async function decrypt(ciphertext: string, passphrase: string): Promise<string> {
  const combined = base64ToUint8Array(ciphertext);

  const salt = combined.slice(0, 16);
  const iv = combined.slice(16, 28);
  const encrypted = combined.slice(28);

  const key = await deriveKey(passphrase, salt);

  try {
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encrypted
    );
    return decodeText(decryptedBuffer);
  } catch (err) {
    if (err instanceof DOMException && err.name === 'OperationError') {
      throw new WrongPassphraseError();
    }
    throw err;
  }
}

/**
 * Determines if a string is a valid ciphertext produced by this service.
 *
 * A valid ciphertext is a Base64 string whose decoding yields
 * at least 44 bytes (16 salt + 12 IV + 16 minimum AES-GCM tag).
 * It must also not contain characters outside the Base64 alphabet.
 */
export function isCiphertext(value: string): boolean {
  if (!value || typeof value !== 'string') return false;
  if (!/^[A-Za-z0-9+/\-_]*={0,2}$/.test(value.trim())) return false;
  try {
    const standard = value.trim().replace(/-/g, '+').replace(/_/g, '/');
    const padded = standard + '='.repeat((4 - standard.length % 4) % 4);
    const decoded = atob(padded);
    // Minimum: 16 (salt) + 12 (iv) + 16 (AES-GCM auth tag) = 44 bytes
    return decoded.length >= 44;
  } catch {
    return false;
  }
}

/**
 * Removes all occurrences of the `$pass$...$` command from text.
 *
 * The automaton format is `$name$value$`, so the pass command
 * takes the form `$pass$KEY$`.
 */
export function removePassCommand(text: string): string {
  return text.replace(/\$pass\$[^$]*\$/g, '');
}
