import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { LetterLockerPreviewer } from '../automaton/letterLockerAutomaton';

// Caracteres seguros para usar como clave: excluye '$' (delimitador del autómata)
const safeStringArb = fc.string({ minLength: 1 }).filter(s => !s.includes('$'));

describe('Property tests — PassCommand y LetterLockerPreviewer', () => {
  let previewer: LetterLockerPreviewer;

  beforeEach(() => {
    previewer = new LetterLockerPreviewer();
  });

  // Feature: letter-encryption, Property 3: Extracción de passphrase del comando pass
  // Validates: Requirements 1.2, 1.5
  it('Property 3: Extracción de passphrase del comando pass', () => {
    fc.assert(
      fc.property(
        safeStringArb,                          // clave no vacía sin '$'
        fc.string().filter(s => !s.includes('$')), // texto adicional sin '$'
        (key, extra) => {
          // Formato del autómata: $nombre$valor$
          const doc = `$pass$${key}$ ${extra}`;
          previewer.preview(doc);
          return previewer.extractedPassphrase === key;
        }
      ),
      { numRuns: 100 }
    );

    // Para documentos sin comando pass, extractedPassphrase debe ser undefined
    fc.assert(
      fc.property(
        fc.string().filter(s => !s.includes('$')),
        (text) => {
          previewer.preview(text);
          return previewer.extractedPassphrase === undefined;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: letter-encryption, Property 4: Omisión del comando pass en los outputs
  // Validates: Requirements 1.3, 6.3
  // La propiedad verifica que el patrón del comando pass no aparece en el HTML,
  // no que la clave no aparezca (la clave puede coincidir con texto plano legítimo).
  it('Property 4: Omisión del comando pass en los outputs', () => {
    fc.assert(
      fc.property(
        safeStringArb,
        fc.string().filter(s => !s.includes('$')),
        (key, extra) => {
          const doc = `$pass$${key}$ ${extra}`;
          const html = previewer.preview(doc);
          // El HTML no debe contener el patrón del comando pass completo
          const passPattern = `$pass$${key}$`;
          return !html.includes(passPattern) && !html.includes('$pass$');
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: letter-encryption, Property 5: Primera ocurrencia de pass prevalece
  // Validates: Requirements 1.4
  it('Property 5: Primera ocurrencia de pass prevalece', () => {
    fc.assert(
      fc.property(
        safeStringArb,
        safeStringArb.filter(s => s.length > 0),
        (key1, key2) => {
          fc.pre(key1 !== key2);
          const doc = `$pass$${key1}$$pass$${key2}$`;
          previewer.preview(doc);
          return previewer.extractedPassphrase === key1;
        }
      ),
      { numRuns: 100 }
    );
  });
});
