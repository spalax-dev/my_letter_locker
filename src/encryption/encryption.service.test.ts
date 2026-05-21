import { describe, it, expect } from 'vitest';
import {
  encrypt,
  decrypt,
  isCiphertext,
  removePassCommand,
  WrongPassphraseError,
} from './encryption.service';

// ─── Unit tests: isCiphertext ─────────────────────────────────────────────────

describe('isCiphertext', () => {
  it('retorna true para un string Base64 válido con ≥ 44 bytes decodificados', () => {
    // 44 bytes en Base64url (mínimo real: 16 salt + 12 iv + 16 tag AES-GCM)
    const bytes = new Uint8Array(44);
    crypto.getRandomValues(bytes);
    // Generar Base64url manualmente para el test
    const b64 = btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    expect(isCiphertext(b64)).toBe(true);
  });

  it('retorna true para un ciphertext real producido por encrypt()', async () => {
    const ct = await encrypt('hola mundo', 'clave123');
    expect(isCiphertext(ct)).toBe(true);
  });

  it('retorna false para un string Base64 válido pero con < 44 bytes', () => {
    // 43 bytes → Base64url válido pero insuficiente
    const bytes = new Uint8Array(43);
    const b64 = btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    expect(isCiphertext(b64)).toBe(false);
  });

  it('retorna false para un string corto arbitrario', () => {
    expect(isCiphertext('hola')).toBe(false);
    expect(isCiphertext('')).toBe(false);
    expect(isCiphertext('abc')).toBe(false);
  });

  it('retorna false para un string que no es Base64 válido', () => {
    expect(isCiphertext('esto no es base64!!!')).toBe(false);
    expect(isCiphertext('$pass$clave$')).toBe(false);
  });
});

// ─── Unit tests: removePassCommand ───────────────────────────────────────────

describe('removePassCommand', () => {
  it('retorna el texto sin cambios si no contiene el comando pass', () => {
    const text = 'Hola mundo, sin comandos especiales.';
    expect(removePassCommand(text)).toBe(text);
  });

  it('elimina el comando $pass$CLAVE$ del texto', () => {
    const text = 'Antes $pass$miClave$ después';
    expect(removePassCommand(text)).toBe('Antes  después');
  });

  it('elimina múltiples ocurrencias del comando pass', () => {
    const text = '$pass$clave1$ texto $pass$clave2$ fin';
    expect(removePassCommand(text)).toBe(' texto  fin');
  });

  it('elimina el comando pass al inicio del texto', () => {
    const text = '$pass$secreto$ contenido de la carta';
    expect(removePassCommand(text)).toBe(' contenido de la carta');
  });

  it('elimina el comando pass al final del texto', () => {
    const text = 'contenido de la carta $pass$secreto$';
    expect(removePassCommand(text)).toBe('contenido de la carta ');
  });

  it('no elimina comandos con formato diferente', () => {
    const text = '$bold$texto en negrita$';
    expect(removePassCommand(text)).toBe(text);
  });

  it('maneja texto vacío', () => {
    expect(removePassCommand('')).toBe('');
  });
});

// ─── Unit tests: decrypt con clave incorrecta ─────────────────────────────────

describe('decrypt', () => {
  it('lanza WrongPassphraseError cuando la clave es incorrecta', async () => {
    const ciphertext = await encrypt('texto secreto', 'clave-correcta');
    await expect(decrypt(ciphertext, 'clave-incorrecta')).rejects.toThrow(WrongPassphraseError);
  });

  it('lanza WrongPassphraseError (no otro tipo de error) con clave incorrecta', async () => {
    const ciphertext = await encrypt('texto secreto', 'clave-correcta');
    try {
      await decrypt(ciphertext, 'clave-incorrecta');
      expect.fail('Debería haber lanzado un error');
    } catch (err) {
      expect(err).toBeInstanceOf(WrongPassphraseError);
    }
  });

  it('descifra correctamente con la clave correcta', async () => {
    const plaintext = 'Hola, este es mi mensaje secreto.';
    const passphrase = 'mi-clave-secreta';
    const ciphertext = await encrypt(plaintext, passphrase);
    const recovered = await decrypt(ciphertext, passphrase);
    expect(recovered).toBe(plaintext);
  });
});

// ─── Unit tests: encrypt ─────────────────────────────────────────────────────

describe('encrypt', () => {
  it('produce un string Base64url válido (sin +, /, ni padding =)', async () => {
    const ct = await encrypt('hola', 'clave');
    expect(ct).not.toMatch(/[+/=]/);
    expect(ct).toMatch(/^[A-Za-z0-9\-_]+$/);
  });

  it('el ciphertext decodificado tiene al menos 44 bytes (16 salt + 12 iv + 16 tag)', async () => {
    const ct = await encrypt('hola', 'clave');
    // Normalizar Base64url → Base64 estándar antes de atob
    const standard = ct.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - ct.length % 4) % 4);
    const decoded = atob(standard);
    expect(decoded.length).toBeGreaterThanOrEqual(44);
  });

  it('dos cifrados del mismo texto producen ciphertexts distintos (salt/iv aleatorios)', async () => {
    const ct1 = await encrypt('mismo texto', 'misma clave');
    const ct2 = await encrypt('mismo texto', 'misma clave');
    expect(ct1).not.toBe(ct2);
  });
});

// ─── Unit tests: WrongPassphraseError ────────────────────────────────────────

describe('WrongPassphraseError', () => {
  it('es una instancia de Error', () => {
    const err = new WrongPassphraseError();
    expect(err).toBeInstanceOf(Error);
  });

  it('tiene el mensaje correcto', () => {
    const err = new WrongPassphraseError();
    expect(err.message).toBe('La clave proporcionada es incorrecta');
  });

  it('tiene el nombre correcto', () => {
    const err = new WrongPassphraseError();
    expect(err.name).toBe('WrongPassphraseError');
  });
});
