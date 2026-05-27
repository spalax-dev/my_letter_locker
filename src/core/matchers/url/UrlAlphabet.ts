export class UrlAlphabet {
  static readonly VALID_TLDS = new Set([
    'com', 'org', 'net', 'edu', 'gov', 'mil', 'io', 'co', 'me', 'info',
    'biz', 'pro', 'aero', 'cat', 'coop', 'jobs', 'mobi', 'museum', 'name',
    'tel', 'travel', 'xxx', 'asia', 'eu', 'uk', 'us', 'fr', 'de', 'es',
    'it', 'nl', 'be', 'at', 'ch', 'pl', 'cz', 'hu', 'gr', 'pt', 'se',
    'no', 'dk', 'fi', 'ie', 'ru', 'ua', 'cn', 'jp', 'kr', 'in', 'au',
    'nz', 'ca', 'mx', 'br', 'ar', 'cl', 'co', 've', 'pe', 'uy'
  ]);

  static isAlphanumeric(char: string): boolean {
    const code = char.charCodeAt(0);
    return (code >= 48 && code <= 57)
        || (code >= 65 && code <= 90)
        || (code >= 97 && code <= 122);
  }

  static isUrlChar(char: string): boolean {
    return this.isAlphanumeric(char)
        || char === '-' || char === '_' || char === '.'
        || char === ':' || char === '/' || char === '?' || char === '#'
        || char === '[' || char === ']' || char === '@' || char === '!';
  }

  static matchScheme(input: string, pos: number): { scheme: string; length: number } | null {
    if (pos + 8 <= input.length && input.substring(pos, pos + 8) === 'https://') {
      return { scheme: 'https://', length: 8 };
    }
    if (pos + 7 <= input.length && input.substring(pos, pos + 7) === 'http://') {
      return { scheme: 'http://', length: 7 };
    }
    if (pos + 4 <= input.length && input.substring(pos, pos + 4) === 'www.') {
      return { scheme: 'www.', length: 4 };
    }
    return null;
  }

  static isValidTld(suffix: string): boolean {
    return this.VALID_TLDS.has(suffix.toLowerCase());
  }

  static extractTld(domain: string): string | null {
    const lastDot = domain.lastIndexOf('.');
    if (lastDot === -1 || lastDot === domain.length - 1) return null;
    return domain.substring(lastDot + 1);
  }
}
