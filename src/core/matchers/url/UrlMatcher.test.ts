import { describe, it, expect, beforeEach } from 'vitest';
import { UrlMatcher } from './UrlMatcher';

describe('UrlMatcher', () => {
  let matcher: UrlMatcher;

  beforeEach(() => {
    matcher = new UrlMatcher();
  });

  it('detects http:// URLs', () => {
    const replacements = matcher.match('Visit http://example.com for info');
    expect(replacements).toHaveLength(1);
    expect(replacements[0].replacement).toContain('<a href="http://example.com"');
  });

  it('detects https:// URLs', () => {
    const replacements = matcher.match('Visit https://secure.example.com');
    expect(replacements).toHaveLength(1);
    expect(replacements[0].replacement).toContain('<a href="https://secure.example.com"');
  });

  it('detects www. URLs', () => {
    const replacements = matcher.match('Go to www.example.com');
    expect(replacements).toHaveLength(1);
    expect(replacements[0].replacement).toContain('<a href="www.example.com"');
  });

  it('returns empty array for text without URLs', () => {
    const replacements = matcher.match('no urls here');
    expect(replacements).toHaveLength(0);
  });
});