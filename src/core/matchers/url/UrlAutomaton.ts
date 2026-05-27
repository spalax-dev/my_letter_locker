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
  private domainBeforePath: string = '';
  private schemeLength: number = 0;

  reset(): void {
    this.state = Q0;
    this.startPos = 0;
    this.urls = [];
    this.content = '';
    this.domainBeforePath = '';
    this.schemeLength = 0;
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
          this.schemeLength = scheme.length;
          this.domainBeforePath = '';
        }
        break;
      }
      case Q_DOMAIN: {
        if (pos < this.startPos + this.schemeLength) {
          break;
        }
        if (char === '/') {
          this.state = Q_PATH;
        } else if (!UrlAlphabet.isUrlChar(char)) {
          const tld = UrlAlphabet.extractTld(this.domainBeforePath);
          if (tld && UrlAlphabet.isValidTld(tld)) {
            this.urls.push({ start: this.startPos, end: pos });
            console.log('URL pattern detected: ' + this.content.substring(this.startPos, pos) + ' (position ' + this.startPos + ')');
          } else {
            console.info('URL at position ' + this.startPos + ' has invalid TLD: ' + tld);
          }
          this.state = Q0;
        } else {
          this.domainBeforePath += char;
        }
        break;
      }
      case Q_PATH: {
        if (!UrlAlphabet.isUrlChar(char)) {
          const tld = UrlAlphabet.extractTld(this.domainBeforePath);
          if (tld && UrlAlphabet.isValidTld(tld)) {
            this.urls.push({ start: this.startPos, end: pos });
            console.log('URL pattern detected: ' + this.content.substring(this.startPos, pos) + ' (position ' + this.startPos + ')');
          } else {
            console.info('URL at position ' + this.startPos + ' has invalid TLD: ' + tld);
          }
          this.state = Q0;
        }
        break;
      }
    }
  }

  finalize(pos: number): void {
    if (this.state === Q_DOMAIN) {
      const tld = UrlAlphabet.extractTld(this.domainBeforePath);
      if (tld && UrlAlphabet.isValidTld(tld)) {
        this.urls.push({ start: this.startPos, end: pos });
        console.log('URL pattern detected: ' + this.content.substring(this.startPos, pos) + ' (position ' + this.startPos + ')');
      } else {
        console.info('URL at position ' + this.startPos + ' has invalid TLD: ' + tld);
      }
    } else if (this.state === Q_PATH) {
      const tld = UrlAlphabet.extractTld(this.domainBeforePath);
      if (tld && UrlAlphabet.isValidTld(tld)) {
        this.urls.push({ start: this.startPos, end: pos });
        console.log('URL pattern detected: ' + this.content.substring(this.startPos, pos) + ' (position ' + this.startPos + ')');
      } else {
        console.info('URL at position ' + this.startPos + ' has invalid TLD: ' + tld);
      }
    }
  }

  getUrls(): { start: number; end: number }[] {
    return [...this.urls];
  }
}
