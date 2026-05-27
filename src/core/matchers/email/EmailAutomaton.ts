import { EmailAlphabet } from './EmailAlphabet';

const Q0 = { id: 'Q0' };
const Q_LOCAL = { id: 'Q_LOCAL' };
const Q_DOMAIN = { id: 'Q_DOMAIN' };
const Q_DONE = { id: 'Q_DONE' };

type State = typeof Q0 | typeof Q_LOCAL | typeof Q_DOMAIN | typeof Q_DONE;

export class EmailAutomaton {
  private state: State = Q0;
  private startPos: number = 0;
  private emails: { start: number; end: number }[] = [];
  private content: string = '';

  reset(): void {
    this.state = Q0;
    this.startPos = 0;
    this.emails = [];
    this.content = '';
  }

  setContent(content: string): void {
    this.content = content;
  }

  process(pos: number): void {
    const char = this.content[pos];

    switch (this.state) {
      case Q0: {
        if (EmailAlphabet.isAlphanumeric(char)) {
          this.state = Q_LOCAL;
          this.startPos = pos;
        }
        break;
      }
      case Q_LOCAL: {
        if (EmailAlphabet.isAtSign(char)) {
          this.state = Q_DOMAIN;
        } else if (!EmailAlphabet.isAlphanumeric(char) && !EmailAlphabet.isDot(char) && char !== '_' && char !== '+') {
          this.state = Q0;
        }
        break;
      }
      case Q_DOMAIN: {
        if (EmailAlphabet.isAtSign(char)) {
          this.emails.push({ start: this.startPos, end: pos });
          this.startPos = pos;
        } else if (EmailAlphabet.isDot(char)) {
          this.state = Q_DONE;
        } else if (!EmailAlphabet.isAlphanumeric(char)) {
          if (this.startPos > 0) {
            console.info(`Email pattern at position ${this.startPos} is invalid for parsing`);
          }
          this.emails.push({ start: this.startPos, end: pos });
          this.state = Q0;
        }
        break;
      }
      case Q_DONE: {
        if (EmailAlphabet.isAlphanumeric(char)) {
          this.state = Q_DOMAIN;
        } else if (!EmailAlphabet.isAlphanumeric(char) && !EmailAlphabet.isDot(char)) {
          if (this.startPos > 0) {
            console.info(`Email pattern at position ${this.startPos} is invalid for parsing`);
          }
          this.emails.push({ start: this.startPos, end: pos });
          this.state = Q0;
        }
        break;
      }
    }
  }

  finalize(pos: number): void {
    if (this.state !== Q0 && this.startPos > 0) {
      console.info(`Email pattern at position ${this.startPos} is invalid for parsing (not completed)`);
    }
    if (this.state === Q_DOMAIN || this.state === Q_DONE) {
      this.emails.push({ start: this.startPos, end: pos });
    }
  }

  getEmails(): { start: number; end: number }[] {
    return [...this.emails];
  }
}