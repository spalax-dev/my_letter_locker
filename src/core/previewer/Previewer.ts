import { ImplicitAnalyzer } from '../analyzer/ImplicitAnalyzer';
import { CommandMatcher } from '../matchers/command/CommandMatcher';
import { NewlineMatcher } from '../matchers/newline/NewlineMatcher';
import { TabMatcher } from '../matchers/tab/TabMatcher';
import { UrlMatcher } from '../matchers/url/UrlMatcher';
import { EmailMatcher } from '../matchers/email/EmailMatcher';
import { DateMatcher } from '../matchers/date/DateMatcher';

export class Previewer {
  private analyzer: ImplicitAnalyzer;

  constructor() {
    this.analyzer = new ImplicitAnalyzer(
      new CommandMatcher(),
      new NewlineMatcher(),
      new TabMatcher(),
      new UrlMatcher(),
      new EmailMatcher(),
      new DateMatcher()
    );
  }

  preview(content: string): string {
    return this.analyzer.analyze(content);
  }

  previewWithHover(content: string, committedLines?: Array<{ line: number; command: string; value: string }> | null): string {
    return this.analyzer.analyzeWithHover(content, committedLines);
  }

  getExtractedPassphrase(): string | undefined {
    return this.analyzer.getExtractedPassphrase();
  }
}