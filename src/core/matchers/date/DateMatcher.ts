import type { Replacement, Matcher } from '../../automaton/types';
import { DateAutomaton } from './DateAutomaton';

export class DateMatcher implements Matcher {
  private automaton: DateAutomaton;

  constructor() {
    this.automaton = new DateAutomaton();
  }

  match(content: string): Replacement[] {
    this.automaton.reset();
    this.automaton.setContent(content);

    for (let i = 0; i < content.length; i++) {
      this.automaton.process(i);
    }
    this.automaton.finalize(content.length);

    const dates = this.automaton.getDates();
    const replacements: Replacement[] = [];

    for (const date of dates) {
      const dateText = content.substring(date.start, date.end);
      const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(dateText)}&dates=${date.year}${String(date.month).padStart(2, '0')}${String(date.day).padStart(2, '0')}/${date.year}${String(date.month).padStart(2, '0')}${String(date.day).padStart(2, '0')}`;
      replacements.push({
        start: date.start,
        end: date.end,
        replacement: `<a href="${googleUrl}" class="date-link" target="_blank" rel="noopener">${dateText}</a>`,
        type: 'date'
      });
    }

    return replacements;
  }
}