export class CommandAlphabet {
  static COMMAND_START = '$';
  static COMMAND_END = '$';

  static isCommandStart(char: string): boolean {
    return char === this.COMMAND_START;
  }

  static isCommandEnd(char: string): boolean {
    return char === this.COMMAND_END;
  }

  static isDigit(char: string): boolean {
    const code = char.charCodeAt(0);
    return code >= 48 && code <= 57;
  }

  static isAlphabetic(char: string): boolean {
    const code = char.charCodeAt(0);
    return (code >= 65 && code <= 90) || (code >= 97 && code <= 122);
  }

  static isTitleLevelChar(char: string): boolean {
    return this.isDigit(char) || char === ':';
  }

  static isLineCommand(name: string): boolean {
    return name === 'title' || name.startsWith('title:') || name === 'pass';
  }

  static isInlineCommand(name: string): boolean {
    return name === 'bold' || name === 'italic' || name === 'pass';
  }
}
