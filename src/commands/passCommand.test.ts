import { describe, it, expect, beforeEach } from 'vitest';
import { PassCommand } from './passCommand';
import { LetterLockerPreviewer } from '../automaton/letterLockerAutomaton';

// El formato del autómata es: $nombre$valor$
// Para el comando pass: $pass$CLAVE$

// ─── Unit tests: PassCommand ──────────────────────────────────────────────────

describe('PassCommand', () => {
  it('render() retorna undefined para cualquier valor', () => {
    expect(PassCommand.render('secret', [])).toBeUndefined();
    expect(PassCommand.render('', [])).toBeUndefined();
    expect(PassCommand.render('any value with spaces', ['mod'])).toBeUndefined();
  });

  it('tiene el nombre estático "pass"', () => {
    expect(PassCommand.name).toBe('pass');
  });
});

// ─── Unit tests: LetterLockerPreviewer — extracción de passphrase ─────────────

describe('LetterLockerPreviewer — extractedPassphrase', () => {
  let previewer: LetterLockerPreviewer;

  beforeEach(() => {
    previewer = new LetterLockerPreviewer();
  });

  it('sin comando pass → extractedPassphrase === undefined', () => {
    previewer.preview('Hola mundo, sin comandos especiales.');
    expect(previewer.extractedPassphrase).toBeUndefined();
  });

  it('con $pass$secret$ → extractedPassphrase === "secret"', () => {
    previewer.preview('$pass$secret$');
    expect(previewer.extractedPassphrase).toBe('secret');
  });

  it('con dos comandos pass → usa el primero', () => {
    previewer.preview('$pass$primera$$pass$segunda$');
    expect(previewer.extractedPassphrase).toBe('primera');
  });

  it('con $pass$$ (valor vacío) → extractedPassphrase === undefined', () => {
    previewer.preview('$pass$$');
    expect(previewer.extractedPassphrase).toBeUndefined();
  });

  it('el comando pass no aparece en el HTML de vista previa', () => {
    const html = previewer.preview('antes $pass$miClave$ después');
    expect(html).not.toContain('pass');
    expect(html).not.toContain('miClave');
    expect(html).toContain('antes ');
    expect(html).toContain(' después');
  });

  it('extractedPassphrase se resetea a undefined en cada llamada a preview()', () => {
    previewer.preview('$pass$primera$');
    expect(previewer.extractedPassphrase).toBe('primera');

    previewer.preview('sin comando pass');
    expect(previewer.extractedPassphrase).toBeUndefined();
  });
});
