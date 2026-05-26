import type { Matcher, Replacement } from '../../automaton/types';
import { CommandAutomaton, type CommandResult, type IncompleteCommand } from './CommandAutomaton';

export class CommandMatcher implements Matcher {
  private automaton: CommandAutomaton;
  private extractedPassphrase: string | undefined;

  constructor() {
    this.automaton = new CommandAutomaton();
  }

  private parseTitleLevel(commandName: string): number {
    const prefix = 'title:';
    if (commandName.length > prefix.length && commandName.startsWith(prefix)) {
      const numStr = commandName.substring(prefix.length);
      let level = 0;
      for (const ch of numStr) {
        if (ch >= '0' && ch <= '9') {
          level = level * 10 + (ch.charCodeAt(0) - '0'.charCodeAt(0));
        } else {
          return 1;
        }
      }
      if (level < 1) return 1;
      if (level > 6) return 6;
      return level;
    }
    return 1;
  }

  match(content: string): Replacement[] {
    this.automaton.reset();
    this.extractedPassphrase = undefined;

    for (let i = 0; i < content.length; i++) {
      this.automaton.process(content[i], i, content.length);
    }

    const commands: CommandResult[] = this.automaton.getCommands();
    const replacements: Replacement[] = [];

    for (const cmd of commands) {
      let html = '';

      if (cmd.command === 'title' || cmd.command.startsWith('title:')) {
        const level = this.parseTitleLevel(cmd.command);
        html = `<h${level}>${cmd.value}</h${level}>`;
      } else {
        switch (cmd.command) {
          case 'bold':
            html = `<b>${cmd.value}</b>`;
            break;
          case 'italic':
            html = `<i>${cmd.value}</i>`;
            break;
          case 'pass':
            if (this.extractedPassphrase === undefined) {
              this.extractedPassphrase = cmd.value;
            }
            html = '';
            break;
          default:
            html = `<span class="unknown-command">$${cmd.command}$${cmd.value}$</span>`;
        }
      }

      if (html !== '' || cmd.command === 'pass') {
        replacements.push({
          start: cmd.start,
          end: cmd.end,
          replacement: html,
          type: 'command'
        });
      }
    }

    return replacements;
  }

  getExtractedPassphrase(): string | undefined {
    return this.extractedPassphrase;
  }

  getCommandResults(): Array<{ command: string; value: string; start: number; end: number; isLineCommand: boolean }> {
    return this.automaton.getCommands();
  }

  getIncompleteCommands(): IncompleteCommand[] {
    return this.automaton.getIncompleteCommands();
  }
}
