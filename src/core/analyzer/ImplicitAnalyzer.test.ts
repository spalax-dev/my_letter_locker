import { describe, it, expect } from 'vitest';
import { ImplicitAnalyzer } from './ImplicitAnalyzer';
import { CommandMatcher } from '../matchers/command/CommandMatcher';
import { NewlineMatcher } from '../matchers/newline/NewlineMatcher';
import { TabMatcher } from '../matchers/tab/TabMatcher';
import { UrlMatcher } from '../matchers/url/UrlMatcher';
import { EmailMatcher } from '../matchers/email/EmailMatcher';

describe('ImplicitAnalyzer', () => {
  let analyzer: ImplicitAnalyzer;

  beforeEach(() => {
    analyzer = new ImplicitAnalyzer(
      new CommandMatcher(),
      new NewlineMatcher(),
      new TabMatcher(),
      new UrlMatcher(),
      new EmailMatcher()
    );
  });

  it('should apply command replacements', () => {
    const result = analyzer.analyze('$bold$Hello$');
    expect(result).toBe('<b>Hello</b>');
  });

  it('should apply newline replacements', () => {
    const result = analyzer.analyze('line1\nline2');
    expect(result).toBe('line1<br>line2');
  });

  it('should apply tab replacements', () => {
    const result = analyzer.analyze('a\tb');
    expect(result).toBe('a    b');
  });

  it('should skip commands covered by newline/tab/url/email in uncovered regions', () => {
    const result = analyzer.analyze('$bold$ hello$ $italic$ world$');
    expect(result).toBe('<b> hello</b> <i> world</i>');
  });

  it('should extract passphrase from pass command', () => {
    analyzer.analyze('$pass$secret123$');
    expect(analyzer.getExtractedPassphrase()).toBe('secret123');
  });

  it('should not apply url replacement inside command region', () => {
    const result = analyzer.analyze('$bold$http://example.com$');
    expect(result).toBe('<b>http://example.com</b>');
  });

  it('should apply url replacement in uncovered region', () => {
    const result = analyzer.analyze('Visit http://example.com for info');
    expect(result).toBe('Visit <a href="http://example.com">http://example.com</a> for info');
  });
});