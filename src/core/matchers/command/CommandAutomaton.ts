import { CommandAlphabet } from './CommandAlphabet';

export interface CommandResult {
  command: string;
  value: string;
  start: number;
  end: number;
  isLineCommand: boolean;
}

export interface IncompleteCommand {
  start: number;
  end: number;
  raw: string;
}

type State = 'Q0' | 'Q1' | 'Q2' | 'Q3';

export class CommandAutomaton {
  private state: State = 'Q0';
  private commandName: string = '';
  private commandValue: string = '';
  private startPos: number = 0;
  private commands: CommandResult[] = [];
  private incompleteCommands: IncompleteCommand[] = [];

  reset(): void {
    this.state = 'Q0';
    this.commandName = '';
    this.commandValue = '';
    this.startPos = 0;
    this.commands = [];
    this.incompleteCommands = [];
  }

  process(char: string, pos: number, textLength: number): void {
    const isEndOfText = pos === textLength - 1;

    switch (this.state) {
      case 'Q0':
        if (CommandAlphabet.isCommandStart(char)) {
          this.state = 'Q1';
          this.startPos = pos;
          this.commandName = '';
        }
        break;
      case 'Q1':
        if (char === '$') {
          if (CommandAlphabet.isInlineCommand(this.commandName)) {
            this.state = 'Q2';
            this.commandValue = '';
          } else if (CommandAlphabet.isLineCommand(this.commandName)) {
            this.state = 'Q3';
            this.commandValue = '';
          } else {
            this.state = 'Q2';
            this.commandValue = '';
          }
        } else if (char === '\n' || isEndOfText) {
          if (this.commandName.length > 0 && CommandAlphabet.isLineCommand(this.commandName)) {
            this.commands.push({
              command: this.commandName,
              value: this.commandValue,
              start: this.startPos,
              end: pos + 1,
              isLineCommand: true
            });
          }
          this.commandName = '';
          this.commandValue = '';
          this.state = 'Q0';
        } else {
          this.commandName += char;
        }
        break;
      case 'Q2':
        if (char === '$') {
          this.commands.push({
            command: this.commandName,
            value: this.commandValue,
            start: this.startPos,
            end: pos + 1,
            isLineCommand: false
          });
          this.commandName = '';
          this.commandValue = '';
          this.state = 'Q0';
        } else {
          this.commandValue += char;
        }
        break;
      case 'Q3':
        if (char === '$') {
          this.commands.push({
            command: this.commandName,
            value: this.commandValue,
            start: this.startPos,
            end: pos + 1,
            isLineCommand: true
          });
          this.commandName = '';
          this.commandValue = '';
          this.state = 'Q0';
        } else if (char === '\n' || isEndOfText) {
          this.commands.push({
            command: this.commandName,
            value: this.commandValue,
            start: this.startPos,
            end: pos + 1,
            isLineCommand: true
          });
          this.commandName = '';
          this.commandValue = '';
          this.state = 'Q0';
        } else {
          this.commandValue += char;
        }
        break;
    }

    if (this.state !== 'Q0' && this.startPos > 0) {
      this.incompleteCommands = [{
        start: this.startPos,
        end: pos + 1,
        raw: '$' + this.commandName + '$' + this.commandValue
      }];
    }
  }

  getCommands(): CommandResult[] {
    return [...this.commands];
  }

  getIncompleteCommands(): IncompleteCommand[] {
    return [...this.incompleteCommands];
  }
}