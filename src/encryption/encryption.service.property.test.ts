import { describe, it } from 'vitest';
import * as fc from 'fast-check';
import { encrypt, decrypt, isCiphertext, WrongPassphraseError } from './encryption.service';

/**
 * Property tests para EncryptionService.
 *
 * Cada propiedad valida un comportamiento universal que debe mantenerse
 * para cualquier combinación de entradas válidas.
 */

describe('Property tests — EncryptionService', () => {

  // Feature: letter-encryption, Property 1: Round-trip de cifrado
  // Validates: Requirements 3.5
  it('Property 1: Round-trip de cifrado', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1 }),
        fc.string({ minLength: 1 }),
        async (plaintext, passphrase) => {
          const ciphertext = await encrypt(plaintext, passphrase);
          const recovered = await decrypt(ciphertext, passphrase);
          return recovered === plaintext;
        }
      ),
      { numRuns: 100 }
    );
  }, 120_000);

  // Feature: letter-encryption, Property 2: Clave incorrecta lanza error
  // Validates: Requirements 3.6
  it('Property 2: Clave incorrecta lanza error', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1 }),
        fc.string({ minLength: 1 }),
        fc.string({ minLength: 1 }),
        async (plaintext, passphrase, wrongPassphrase) => {
          fc.pre(passphrase !== wrongPassphrase);
          const ciphertext = await encrypt(plaintext, passphrase);
          let threw = false;
          try {
            await decrypt(ciphertext, wrongPassphrase);
          } catch (err) {
            threw = err instanceof WrongPassphraseError;
          }
          return threw;
        }
      ),
      { numRuns: 100 }
    );
  }, 120_000);

  // Feature: letter-encryption, Property 6: Formato y detectabilidad del ciphertext
  // Validates: Requirements 3.2, 5.1
  it('Property 6: Formato y detectabilidad del ciphertext', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1 }),
        fc.string({ minLength: 1 }),
        async (plaintext, passphrase) => {
          const ciphertext = await encrypt(plaintext, passphrase);
          // Normalizar Base64url → Base64 estándar para atob
          const standard = ciphertext.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - ciphertext.length % 4) % 4);
          const decoded = atob(standard);
          // Debe tener al menos 44 bytes (16 salt + 12 iv + 16 tag AES-GCM)
          const hasMinLength = decoded.length >= 44;
          // isCiphertext debe retornar true
          const detectable = isCiphertext(ciphertext);
          return hasMinLength && detectable;
        }
      ),
      { numRuns: 100 }
    );
  }, 120_000);

});
