import { describe, it, expect, beforeEach } from 'vitest';
import { EmailMatcher } from './EmailMatcher';

describe('EmailMatcher', () => {
  let matcher: EmailMatcher;

  beforeEach(() => {
    matcher = new EmailMatcher();
  });

  it('detects simple email addresses', () => {
    const replacements = matcher.match('Contact test@example.com for info');
    expect(replacements).toHaveLength(1);
    expect(replacements[0].replacement).toContain('<a href="mailto:test@example.com"');
  });

  it('detects email with subdomain', () => {
    const replacements = matcher.match('Email user@mail.server.com please');
    expect(replacements).toHaveLength(1);
    expect(replacements[0].replacement).toContain('<a href="mailto:user@mail.server.com"');
  });

  it('detects multiple emails', () => {
    const replacements = matcher.match('Email first@domain.com or second@domain.com');
    expect(replacements).toHaveLength(2);
  });

  it('returns empty array for text without emails', () => {
    const replacements = matcher.match('no email here');
    expect(replacements).toHaveLength(0);
  });

  it('detects email at start of text', () => {
    const replacements = matcher.match('test@domain.com is the email');
    expect(replacements).toHaveLength(1);
  });

  it('detects email at end of text', () => {
    const replacements = matcher.match('The email is test@domain.com');
    expect(replacements).toHaveLength(1);
  });

  it('handles email with plus sign', () => {
    const replacements = matcher.match('Send to user+tag@domain.com');
    expect(replacements).toHaveLength(1);
    expect(replacements[0].replacement).toContain('<a href="mailto:user+tag@domain.com"');
  });
});