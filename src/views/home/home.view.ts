import Handlebars from "handlebars";
import type { View } from "../base.view";

import { LetterLockerPreviewer, UnrecognizedCommand } from "../../automaton/letterLockerAutomaton";
import templateContent from "./home.view.html?raw";
import { BadCommandModifierError, CommandNotFoundError } from "../../commands/commands";

export class HomeView implements View {
  private template = Handlebars.compile(templateContent)
  private inpEl: HTMLInputElement | undefined;
  private previewModal: HTMLDivElement | undefined;
  private previewContentContainer: HTMLDivElement | undefined;
  private openModalBtn: HTMLButtonElement | undefined;
  private closeModalBtn: HTMLButtonElement | undefined;
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
    this.inpEl = document.getElementById('editor') as HTMLInputElement;
    this.previewModal = document.getElementById('preview-modal') as HTMLDivElement;
    this.previewContentContainer = document.getElementById('preview-content') as HTMLDivElement;
    this.openModalBtn = document.getElementById('open-preview-btn') as HTMLButtonElement;
    this.closeModalBtn = document.getElementById('close-preview-btn') as HTMLButtonElement;

    this.openModalBtn.addEventListener('click', () => {
      this.previewModal!.classList.add('is-active');
    })

    this.closeModalBtn.addEventListener('click', () => {
      this.previewModal!.classList.remove('is-active');
    })

    this.inpEl.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;

      try {
        this.previewContentContainer!.innerHTML = this.previewer.preview(target.value);
      } catch (e) {
        if (e instanceof CommandNotFoundError || e instanceof BadCommandModifierError) {
          this.previewContentContainer!.innerHTML = e.message;
        } else {
          console.error(e);
        }
      }
    });
  }
}