import { UrlAlphabet } from './UrlAlphabet';

const Q0 = { id: 'Q0' };
const Q_DOMAIN = { id: 'Q_DOMAIN' };
const Q_PATH = { id: 'Q_PATH' };

type State = typeof Q0 | typeof Q_DOMAIN | typeof Q_PATH;

export class UrlAutomaton {
  private state: State = Q0;
  private startPos: number = 0;
  private urls: { start: number; end: number }[] = [];
  private content: string = '';

  reset(): void {
    this.state = Q0;
    this.startPos = 0;
    this.urls = [];
    this.content = '';
  }

  setContent(content: string): void {
    this.content = content;
  }

  process(pos: number): void {
    const char = this.content[pos];

    switch (this.state) {
      case Q0: {
        const scheme = UrlAlphabet.matchScheme(this.content, pos);
        if (scheme) {
          this.state = Q_DOMAIN;
          this.startPos = pos;
        }
        break;
      }
      case Q_DOMAIN: {
        if (char === '/') {
          this.state = Q_PATH;
        } else if (!UrlAlphabet.isUrlChar(char)) {
          if (this.state !== Q0 && this.startPos > 0) {
            console.info(`URL pattern at position ${this.startPos} is invalid for parsing`);
          }
          this.urls.push({ start: this.startPos, end: pos });
          this.state = Q0;
        }
        break;
      }
      case Q_PATH: {
        if (!UrlAlphabet.isUrlChar(char)) {
          if (this.state !== Q0 && this.startPos > 0) {
            console.info(`URL pattern at position ${this.startPos} is invalid for parsing`);
          }
          this.urls.push({ start: this.startPos, end: pos });
          this.state = Q0;
        }
        break;
      }
    }
  }

  finalize(pos: number): void {
    if (this.state === Q_DOMAIN || this.state === Q_PATH) {
      this.urls.push({ start: this.startPos, end: pos });
    }
  }

  getUrls(): { start: number; end: number }[] {
    return [...this.urls];
  }
}