import type { Matcher, Replacement } from '../automaton/types';
import { PhoneMatcher } from '../matchers/phone/PhoneMatcher';

export class ImplicitAnalyzer {
  private commandMatcher: Matcher;
  private newlineMatcher: Matcher;
  private tabMatcher: Matcher;
  private urlMatcher: Matcher;
  private emailMatcher: Matcher;
  private dateMatcher: Matcher;
  private phoneMatcher: Matcher;

  constructor(
    commandMatcher: Matcher,
    newlineMatcher: Matcher,
    tabMatcher: Matcher,
    urlMatcher: Matcher,
    emailMatcher: Matcher,
    dateMatcher: Matcher,
    phoneMatcher?: Matcher
  ) {
    this.commandMatcher = commandMatcher;
    this.newlineMatcher = newlineMatcher;
    this.tabMatcher = tabMatcher;
    this.urlMatcher = urlMatcher;
    this.emailMatcher = emailMatcher;
    this.dateMatcher = dateMatcher;
    this.phoneMatcher = phoneMatcher || new PhoneMatcher();
  }

  analyze(content: string): string {
    const commandReplacements = this.commandMatcher.match(content);
    const coveredRegions = this.getCoveredRegions(commandReplacements);

    const newlineReplacements = this.filterUncovered(this.newlineMatcher.match(content), coveredRegions);
    const tabReplacements = this.filterUncovered(this.tabMatcher.match(content), coveredRegions);
    const urlReplacements = this.filterUncovered(this.urlMatcher.match(content), coveredRegions);
    const emailReplacements = this.filterUncovered(this.emailMatcher.match(content), coveredRegions);
    const dateReplacements = this.filterUncovered(this.dateMatcher.match(content), coveredRegions);
    const phoneReplacements = this.filterUncovered(this.phoneMatcher.match(content), coveredRegions);

    const allReplacements = [
      ...commandReplacements,
      ...newlineReplacements,
      ...tabReplacements,
      ...urlReplacements,
      ...emailReplacements,
      ...dateReplacements,
      ...phoneReplacements
    ].sort((a, b) => b.start - a.start);

    return this.applyReplacements(content, allReplacements);
  }

  analyzeWithHover(content: string, committedLines?: Array<{ line: number; command: string; value: string }> | null): string {
    const commands = this.getCommandResults(content);
    const committedMap = new Map(committedLines?.map(c => [c.line, c]) || []);

    if (commands.length === 0) {
      return this.escapeHtml(content);
    }

    const parts: { text: string; isCommand: boolean; raw: string; command: string; value: string; isLineCommand: boolean; start: number; end: number }[] = [];
    let lastEnd = 0;

    for (const cmd of commands) {
      if (cmd.start > lastEnd) {
        parts.push({
          text: content.substring(lastEnd, cmd.start),
          isCommand: false,
          raw: '',
          command: '',
          value: '',
          isLineCommand: false,
          start: lastEnd,
          end: cmd.start
        });
      }
      parts.push({
        text: content.substring(cmd.start, cmd.end),
        isCommand: true,
        raw: content.substring(cmd.start, cmd.end),
        command: cmd.command,
        value: cmd.value,
        isLineCommand: cmd.isLineCommand,
        start: cmd.start,
        end: cmd.end
      });
      lastEnd = cmd.end;
    }

    if (lastEnd < content.length) {
      parts.push({
        text: content.substring(lastEnd),
        isCommand: false,
        raw: '',
        command: '',
        value: '',
        isLineCommand: false,
        start: lastEnd,
        end: content.length
      });
    }

    let result = '';
    for (const part of parts) {
      if (part.isCommand) {
        const committed = committedMap.get(this.getLineNumberForPosition(content, part.start));
        const isCommitted = committed &&
          part.isLineCommand &&
          part.command === committed.command &&
          part.value === committed.value;

        if (isCommitted) {
          const interpreted = this.interpretCommand(part.command, part.value);
          result += `<span class="cmd cmd-line committed" data-raw="${this.escapeHtmlAttr(part.raw)}"><span class="interpreted">${interpreted}</span></span>`;
        } else if (part.isLineCommand) {
          result += `<span class="cmd cmd-line" data-raw="${this.escapeHtmlAttr(part.raw)}"><span class="raw">${this.escapeHtml(part.raw)}</span></span>`;
        } else {
          const interpreted = this.interpretCommand(part.command, part.value);
          result += `<span class="cmd cmd-inline" data-raw="${this.escapeHtmlAttr(part.raw)}"><span class="interpreted">${interpreted}</span><span class="raw">${this.escapeHtml(part.raw)}</span></span>`;
        }
      } else {
        result += this.escapeHtml(part.text);
      }
    }

    return result;
  }

  private getCommandResults(content: string): Array<{ command: string; value: string; start: number; end: number; isLineCommand: boolean }> {
    this.commandMatcher.match(content);
    return (this.commandMatcher as any).getCommandResults();
  }

  private interpretCommand(command: string, value: string): string {
    if (command === 'pass') {
      return '';
    }
    if (command === 'title' || command.startsWith('title:')) {
      const level = this.parseTitleLevel(command);
      return `<h${level}>${this.escapeHtml(value)}</h${level}>`;
    }
    switch (command) {
      case 'bold':
        return `<b>${this.escapeHtml(value)}</b>`;
      case 'italic':
        return `<i>${this.escapeHtml(value)}</i>`;
      default:
        return `<span class="unknown-command">$${this.escapeHtml(command)}$${this.escapeHtml(value)}$</span>`;
    }
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

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  private escapeHtmlAttr(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  private getLineNumberForPosition(content: string, position: number): number {
    let lineNum = 1;
    for (let i = 0; i < position; i++) {
      if (content[i] === '\n') {
        lineNum++;
      }
    }
    return lineNum;
  }

  private getCoveredRegions(replacements: Replacement[]): Array<{ start: number; end: number }> {
    return replacements.map(r => ({ start: r.start, end: r.end }));
  }

  private filterUncovered(replacements: Replacement[], coveredRegions: Array<{ start: number; end: number }>): Replacement[] {
    return replacements.filter(r => !this.isCovered(r.start, r.end, coveredRegions));
  }

  private isCovered(start: number, end: number, regions: Array<{ start: number; end: number }>): boolean {
    return regions.some(r => start >= r.start && end <= r.end);
  }

  private applyReplacements(content: string, replacements: Replacement[]): string {
    let result = content;
    for (const r of replacements) {
      result = result.substring(0, r.start) + r.replacement + result.substring(r.end);
    }
    return result;
  }

  getExtractedPassphrase(): string | undefined {
    if (this.commandMatcher && typeof (this.commandMatcher as any).getExtractedPassphrase === 'function') {
      return (this.commandMatcher as any).getExtractedPassphrase();
    }
    return undefined;
  }
}