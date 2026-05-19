import Handlebars from "handlebars";
import type { View } from "../base.view";

import { LetterLockerPreviewer, UnrecognizedCommand } from "../../automaton/letterLockerAutomaton";
import templateContent from "./home.view.html?raw";

export class HomeView implements View {
  private template = Handlebars.compile(templateContent)
  private inpEl: HTMLInputElement | undefined;
  private previewContainer: HTMLDivElement | undefined;
  private previewer: LetterLockerPreviewer;

  /**
   *
   */
  constructor(previewer: LetterLockerPreviewer) {
    this.previewer = previewer;
  }

  render(data: Record<string, any> = {}): string {
    return this.template(data);
  }
  
  afterRender(): void {
    this.inpEl = document.getElementById('inp') as HTMLInputElement;
    this.previewContainer = document.getElementById('preview') as HTMLDivElement;

    this.inpEl.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;

      try {
        this.previewContainer!.innerHTML = this.previewer.preview(target.value);
      } catch (e) {
        if (e instanceof UnrecognizedCommand) {
          this.previewContainer!.innerHTML = e.message;
        }
      }
    });
  }
}