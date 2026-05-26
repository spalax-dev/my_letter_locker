export class DebouncedPreviewer {
  private previewer: any;
  private debounceMs: number;
  private timer: number | undefined;

  constructor(previewer: any, debounceMs = 150) {
    this.previewer = previewer;
    this.debounceMs = debounceMs;
  }

  onInput(content: string, callback: (html: string) => void): void {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      const html = this.previewer.preview(content);
      callback(html);
    }, this.debounceMs);
  }
}