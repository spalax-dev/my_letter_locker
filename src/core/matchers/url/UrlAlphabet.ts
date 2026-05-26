export class UrlAlphabet {
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
}