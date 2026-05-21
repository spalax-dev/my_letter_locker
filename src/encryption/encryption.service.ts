/**
 * EncryptionService — cifrado/descifrado de cartas con AES-GCM + PBKDF2
 *
 * Usa exclusivamente la Web Crypto API nativa del navegador (window.crypto.subtle).
 * No depende de ninguna librería de criptografía externa.
 *
 * Formato del ciphertext (Base64 de la concatenación binaria):
 *   [ salt: 16 bytes ][ iv: 12 bytes ][ encrypted: variable ]
 */

// ─── Errores ──────────────────────────────────────────────────────────────────

/**
 * Error lanzado cuando la clave de descifrado es incorrecta.
 * AES-GCM autentica el ciphertext; si la clave no coincide,
 * crypto.subtle.decrypt lanza un DOMException("OperationError").
 */
export class WrongPassphraseError extends Error {
  constructor() {
    super('La clave proporcionada es incorrecta');
    this.name = 'WrongPassphraseError';
  }
}

// ─── Helpers internos ─────────────────────────────────────────────────────────

/** Convierte un string UTF-8 a ArrayBuffer */
function encodeText(text: string): ArrayBuffer {
  return new TextEncoder().encode(text);
}

/** Convierte un ArrayBuffer a string UTF-8 */
function decodeText(buffer: ArrayBuffer): string {
  return new TextDecoder().decode(buffer);
}

/** Convierte un ArrayBuffer a string Base64url (URL-safe, sin padding) */
function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  // Base64url: reemplaza + por -, / por _, elimina padding =
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Convierte un string Base64url (o Base64 estándar) a Uint8Array */
function base64ToUint8Array(base64: string): Uint8Array {
  // Normalizar Base64url → Base64 estándar
  const standard = base64.replace(/-/g, '+').replace(/_/g, '/');
  // Restaurar padding si falta
  const padded = standard + '='.repeat((4 - standard.length % 4) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Deriva una clave AES-GCM de 256 bits a partir de una passphrase y un salt
 * usando PBKDF2 con 100 000 iteraciones y SHA-256.
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
      salt,
      iterations: 100_000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// ─── API pública ──────────────────────────────────────────────────────────────

/**
 * Cifra un texto plano con la passphrase dada.
 *
 * @returns Base64 de `[salt(16 bytes) | iv(12 bytes) | ciphertext]`
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

  // Concatenar salt + iv + ciphertext en un único ArrayBuffer
  const encrypted = new Uint8Array(encryptedBuffer);
  const combined = new Uint8Array(salt.length + iv.length + encrypted.length);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(encrypted, salt.length + iv.length);

  return bufferToBase64(combined.buffer);
}

/**
 * Descifra un ciphertext (Base64) con la passphrase dada.
 *
 * @throws {WrongPassphraseError} si la clave es incorrecta o el ciphertext está corrupto
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
 * Determina si un string es un ciphertext válido producido por este servicio.
 *
 * Un ciphertext válido es un string Base64 cuya decodificación produce
 * al menos 44 bytes (16 salt + 12 IV + 16 tag mínimo de AES-GCM).
 * Además no debe contener caracteres fuera del alfabeto Base64.
 */
export function isCiphertext(value: string): boolean {
  if (!value || typeof value !== 'string') return false;
  // Acepta Base64url (-, _) y Base64 estándar (+, /), con o sin padding
  if (!/^[A-Za-z0-9+/\-_]*={0,2}$/.test(value.trim())) return false;
  try {
    // Normalizar a Base64 estándar para atob
    const standard = value.trim().replace(/-/g, '+').replace(/_/g, '/');
    const padded = standard + '='.repeat((4 - standard.length % 4) % 4);
    const decoded = atob(padded);
    // Mínimo: 16 (salt) + 12 (iv) + 16 (AES-GCM auth tag) = 44 bytes
    return decoded.length >= 44;
  } catch {
    return false;
  }
}

/**
 * Elimina todas las ocurrencias del comando `$pass$...$` del texto.
 *
 * El formato del autómata es `$nombre$valor$`, por lo que el comando pass
 * tiene la forma `$pass$CLAVE$`.
 */
export function removePassCommand(text: string): string {
  // Elimina $pass$ seguido de cualquier contenido hasta el siguiente $
  return text.replace(/\$pass\$[^$]*\$/g, '');
}
