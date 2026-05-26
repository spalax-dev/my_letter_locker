// Character matchers without regex - use explicit character comparisons

export interface CharMatcher {
  matches(char: string): boolean;
}

export class LiteralChar implements CharMatcher {
  private char: string;
  constructor(char: string) {
    this.char = char;
  }
  matches(c: string): boolean {
    return c === this.char;
  }
}

export class NotChar implements CharMatcher {
  private exclude: string;
  constructor(exclude: string) {
    this.exclude = exclude;
  }
  matches(c: string): boolean {
    return c !== this.exclude;
  }
}

export class AnyOfChars implements CharMatcher {
  private chars: string;
  constructor(chars: string) {
    this.chars = chars;
  }
  matches(c: string): boolean {
    for (let i = 0; i < this.chars.length; i++) {
      if (c === this.chars[i]) return true;
    }
    return false;
  }
}

export class AnyChar implements CharMatcher {
  matches(_: string): boolean {
    return true;
  }
}

// Factory for easy creation
export class PatternMatcher {
  static literal(char: string): CharMatcher {
    return new LiteralChar(char);
  }

  static notChar(exclude: string): CharMatcher {
    return new NotChar(exclude);
  }

  static anyOf(chars: string): CharMatcher {
    return new AnyOfChars(chars);
  }

  static anyChar(): CharMatcher {
    return new AnyChar();
  }
}