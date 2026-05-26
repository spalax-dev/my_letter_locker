import type { Matcher, Replacement } from '../../automaton/types';

export class TabMatcher implements Matcher {
  private static readonly TAB_REPLACEMENT = '    ';

  match(content: string): Replacement[] {
    const replacements: Replacement[] = [];

    for (let i = 0; i < content.length; i++) {
      if (content[i] === '\t') {
        replacements.push({
          start: i,
          end: i + 1,
          replacement: TabMatcher.TAB_REPLACEMENT,
          type: 'tab'
        });
      }
    }

    return replacements;
  }
}