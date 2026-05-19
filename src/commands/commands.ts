export type LetterLockerCommand = (value: string) => string | undefined;

/**
 * Generic bold command
 */
export class BoldLetterCommand {
  static name: string = 'bold'; // recommended command name

  static render(value: string): string | undefined {
    return `<b>${value}</b>`;
  }
}

/**
 * Generic italic command
 */
export class ItalicCommand {
  static name: string = 'italic'; // recommended command name

  static render(value: string): string | undefined {
    return `<i>${value}</i>`;
  }
}