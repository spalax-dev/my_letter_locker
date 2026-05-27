import type { Replacement, Matcher } from '../../automaton/types';

export class PhoneMatcher implements Matcher {
  private readonly COLOMBIAN_PHONE_REGEX = /\b3\d{9}\b/g;

  match(content: string): Replacement[] {
    const replacements: Replacement[] = [];
    let match;

    while ((match = this.COLOMBIAN_PHONE_REGEX.exec(content)) !== null) {
      const number = match[0];
      replacements.push({
        start: match.index,
        end: match.index + number.length,
        replacement: `<a href="tel:${number}" class="phone-link"><i data-lucide="phone" class="match-icon"></i>${number}</a>`,
        type: 'phone'
      });
    }

    return replacements;
  }
}