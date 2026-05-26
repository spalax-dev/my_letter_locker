import { describe, it, expect } from 'vitest';
import { TabMatcher } from './TabMatcher';

describe('TabMatcher', () => {
  const matcher = new TabMatcher();

  it('replaces single tab with 4 spaces', () => {
    const result = matcher.match('hello\tworld');
    expect(result).toEqual([{ start: 5, end: 6, replacement: '    ', type: 'tab' }]);
  });

  it('replaces multiple tabs', () => {
    const result = matcher.match('a\tb\tc');
    expect(result.length).toBe(2);
    expect(result[0]).toEqual({ start: 1, end: 2, replacement: '    ', type: 'tab' });
    expect(result[1]).toEqual({ start: 3, end: 4, replacement: '    ', type: 'tab' });
  });

  it('returns empty array when no tabs', () => {
    const result = matcher.match('no tabs here');
    expect(result).toEqual([]);
  });
});