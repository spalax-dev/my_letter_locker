export interface Replacement {
  start: number;
  end: number;
  replacement: string;
  type: 'command' | 'newline' | 'tab' | 'url' | 'email' | 'date';
}

export interface Matcher {
  match(content: string): Replacement[];
}