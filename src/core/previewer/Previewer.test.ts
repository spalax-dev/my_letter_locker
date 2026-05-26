import { describe, it, expect } from 'vitest';
import { Previewer } from './Previewer';

describe('Previewer', () => {
  let previewer: Previewer;

  beforeEach(() => {
    previewer = new Previewer();
  });

  it('should preview bold command', () => {
    const result = previewer.preview('$bold$ Hello World$');
    expect(result).toContain('<b> Hello World</b>');
  });

  it('should preview italic command', () => {
    const result = previewer.preview('$italic$text$');
    expect(result).toContain('<i>text</i>');
  });

  it('should preview newlines', () => {
    const result = previewer.preview('line1\nline2');
    expect(result).toContain('<br>');
  });

  it('should preview tabs', () => {
    const result = previewer.preview('a\tb');
    expect(result).toContain('    ');
  });

  it('should preview urls', () => {
    const result = previewer.preview('Visit http://example.com');
    expect(result).toContain('<a href="http://example.com">');
  });

  it('should preview emails', () => {
    const result = previewer.preview('Contact test@example.com');
    expect(result).toContain('<a href="mailto:test@example.com">');
  });

  it('should extract passphrase', () => {
    previewer.preview('$pass$mysecret$');
    expect(previewer.getExtractedPassphrase()).toBe('mysecret');
  });

  it('should handle multiple commands', () => {
    const result = previewer.preview('$bold$A$ $italic$B$ http://test.com');
    expect(result).toContain('<b>A</b>');
    expect(result).toContain('<i>B</i>');
    expect(result).toContain('<a href="http://test.com">');
  });
});