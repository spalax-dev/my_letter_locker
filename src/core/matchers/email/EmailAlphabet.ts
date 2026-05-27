import { UrlAlphabet } from '../url/UrlAlphabet';

export class EmailAlphabet {
  static readonly VALID_TLDS = UrlAlphabet.VALID_TLDS;

  static isAlphanumeric(char: string): boolean {
    const code = char.charCodeAt(0);
    return (code >= 48 && code <= 57)
        || (code >= 65 && code <= 90)
        || (code >= 97 && code <= 122);
  }

  static isAtSign(char: string): boolean {
    return char === '@';
  }

  static isDot(char: string): boolean {
    return char === '.';
  }

  static isValidTld(suffix: string): boolean {
    return suffix.length >= 2 && this.VALID_TLDS.has(suffix.toLowerCase());
  }
}
