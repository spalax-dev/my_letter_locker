import type { Matcher, Replacement } from '../../automaton/types';

export class NewlineMatcher implements Matcher {
  match(content: string): Replacement[] {
    const replacements: Replacement[] = [];

    for (let i = 0; i < content.length; i++) {
      if (content[i] === '\n') {
        replacements.push({ start: i, end: i + 1, replacement: '<br>', type: 'newline' });
      }
    }

    return replacements;
  }
}
