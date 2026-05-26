import { describe, it, expect } from 'vitest';
import { NewlineMatcher } from './NewlineMatcher';

describe('NewlineMatcher', () => {
  const matcher = new NewlineMatcher();

  it('replaces single newline with <br>', () => {
    const result = matcher.match('hello\nworld');
    expect(result).toEqual([{ start: 5, end: 6, replacement: '<br>', type: 'newline' }]);
  });

  it('replaces multiple newlines', () => {
    const result = matcher.match('a\nb\nc');
    expect(result.length).toBe(2);
    expect(result[0]).toEqual({ start: 1, end: 2, replacement: '<br>', type: 'newline' });
    expect(result[1]).toEqual({ start: 3, end: 4, replacement: '<br>', type: 'newline' });
  });

  it('returns empty array when no newlines', () => {
    const result = matcher.match('no newlines here');
    expect(result).toEqual([]);
  });
});
