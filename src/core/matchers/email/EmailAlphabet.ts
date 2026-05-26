export class EmailAlphabet {
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
}