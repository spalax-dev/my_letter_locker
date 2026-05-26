export interface Replacement {
  start: number;
  end: number;
  replacement: string;
  type: 'command' | 'newline' | 'tab' | 'url' | 'email';
}

export interface Matcher {
  match(content: string): Replacement[];
}