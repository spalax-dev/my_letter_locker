import type { Replacement, Matcher } from '../../automaton/types';
import { UrlAutomaton } from './UrlAutomaton';

export class UrlMatcher implements Matcher {
  private automaton: UrlAutomaton;

  constructor() {
    this.automaton = new UrlAutomaton();
  }

  match(content: string): Replacement[] {
    this.automaton.reset();
    this.automaton.setContent(content);

    for (let i = 0; i < content.length; i++) {
      this.automaton.process(i);
    }
    this.automaton.finalize(content.length);

    const urls = this.automaton.getUrls();
    const replacements: Replacement[] = [];

    for (const url of urls) {
      const fullUrl = content.substring(url.start, url.end);
      replacements.push({
        start: url.start,
        end: url.end,
        replacement: `<a href="${fullUrl}" class="url-link"><i data-lucide="link" class="match-icon"></i>${fullUrl}</a>`,
        type: 'url'
      });
    }

    return replacements;
  }
}