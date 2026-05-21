import type { LetterLockerPreviewer } from "../../automaton/letterLockerAutomaton";
import type { View } from "../base.view";

import Handlebars from "handlebars";
import templateContent from "./reader.view.html?raw";

export class ReaderView implements View {
  private previewer: LetterLockerPreviewer

  constructor(previewer: LetterLockerPreviewer) {
    this.previewer = previewer;
  }

  render(data: Record<string, any> | undefined): string {
    return Handlebars.compile(templateContent)(data);
  }

  afterRender(): void {

  }
}