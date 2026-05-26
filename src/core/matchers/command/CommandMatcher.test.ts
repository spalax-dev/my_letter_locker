import { describe, it, expect, beforeEach } from 'vitest';
import { CommandMatcher } from './CommandMatcher';

describe('CommandMatcher', () => {
  let matcher: CommandMatcher;

  beforeEach(() => {
    matcher = new CommandMatcher();
  });

  describe('bold command', () => {
    it('renders bold tags', () => {
      const replacements = matcher.match('$bold$Hello World$');
      expect(replacements).toHaveLength(1);
      expect(replacements[0].replacement).toBe('<b>Hello World</b>');
    });
  });

  describe('italic command', () => {
    it('renders italic tags', () => {
      const replacements = matcher.match('$italic$Text$');
      expect(replacements).toHaveLength(1);
      expect(replacements[0].replacement).toBe('<i>Text</i>');
    });
  });

  describe('title command', () => {
    it('renders h1 tags', () => {
      const replacements = matcher.match('$title$My Title$');
      expect(replacements).toHaveLength(1);
      expect(replacements[0].replacement).toBe('<h1>My Title</h1>');
    });
  });

  describe('pass command', () => {
    it('extracts passphrase on first occurrence', () => {
      matcher.match('$pass$secret123$');
      expect(matcher.getExtractedPassphrase()).toBe('secret123');
    });

    it('returns empty string for pass command replacement', () => {
      const replacements = matcher.match('$pass$secret$');
      expect(replacements).toHaveLength(1);
      expect(replacements[0].replacement).toBe('');
    });

    it('uses first passphrase when multiple pass commands', () => {
      matcher.match('$pass$first$$pass$second$');
      expect(matcher.getExtractedPassphrase()).toBe('first');
    });

    it('returns undefined when no pass command', () => {
      matcher.match('plain text without commands');
      expect(matcher.getExtractedPassphrase()).toBeUndefined();
    });
  });

  describe('unknown command', () => {
    it('renders unknown command with span', () => {
      const replacements = matcher.match('$unknown$value$');
      expect(replacements).toHaveLength(1);
      expect(replacements[0].replacement).toBe('<span class="unknown-command">$unknown$value$</span>');
    });
  });

  describe('plain text passthrough', () => {
    it('returns empty array for text without commands', () => {
      const replacements = matcher.match('Hello world');
      expect(replacements).toHaveLength(0);
    });
  });

  describe('multiple commands', () => {
    it('handles multiple commands in content', () => {
      const replacements = matcher.match('$bold$Hi$ and $italic$there$');
      expect(replacements).toHaveLength(2);
    });
  });
});
