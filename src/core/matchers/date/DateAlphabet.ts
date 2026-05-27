export class DateAlphabet {
  static isDigit(char: string): boolean {
    return char >= '0' && char <= '9';
  }

  static isSlash(char: string): boolean {
    return char === '/';
  }

  static isDash(char: string): boolean {
    return char === '-';
  }
}