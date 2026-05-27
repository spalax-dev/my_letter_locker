import type { Replacement, Matcher } from '../../automaton/types';
import { EmailAutomaton } from './EmailAutomaton';

export class EmailMatcher implements Matcher {
  private automaton: EmailAutomaton;

  constructor() {
    this.automaton = new EmailAutomaton();
  }

  match(content: string): Replacement[] {
    this.automaton.reset();
    this.automaton.setContent(content);

    for (let i = 0; i < content.length; i++) {
      this.automaton.process(i);
    }
    this.automaton.finalize(content.length);

    const emails = this.automaton.getEmails();
    const replacements: Replacement[] = [];

    for (const email of emails) {
      const emailText = content.substring(email.start, email.end);
      replacements.push({
        start: email.start,
        end: email.end,
        replacement: `<a href="mailto:${emailText}" class="email-link"><i data-lucide="mail" class="match-icon"></i>${emailText}</a>`,
        type: 'email'
      });
    }

    return replacements;
  }
}