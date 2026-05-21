import type { LetterLockerPreviewer } from "../../automaton/letterLockerAutomaton";
import type { View } from "../base.view";

import Handlebars from "handlebars";
import templateContent from "./readcard.view.html?raw";
import { createIcons, FileText, MailOpen, ShieldCheck } from "lucide";

// Texto de prueba con el formato LetterLocker
const SAMPLE_LETTER = "$title:1$Mi carta secreta$Hola $bold$juan$, quiero que pruebes este software de $italic$cartas secretas$";

export class ReadCardView implements View {
  private previewer: LetterLockerPreviewer;

  constructor(previewer: LetterLockerPreviewer) {
    this.previewer = previewer;
  }

  render(data: Record<string, any> | undefined): string {
    return Handlebars.compile(templateContent)(data);
  }

  afterRender(): void {
    // Renderizar el contenido de prueba
    const rendered = this.previewer.preview(SAMPLE_LETTER);

    // Separar el título del cuerpo: el título es el primer <h1>, el resto es el cuerpo
    const titleMatch = rendered.match(/<h1>(.*?)<\/h1>/);
    const bodyContent = rendered.replace(/<h1>.*?<\/h1>/, "").trim();

    const titleEl = document.getElementById("letter-title");
    const contentEl = document.getElementById("letter-content");

    if (titleEl && titleMatch) {
      titleEl.innerHTML = titleMatch[1];
    }

    if (contentEl) {
      contentEl.innerHTML = bodyContent;
    }

    createIcons({ icons: { FileText, MailOpen, ShieldCheck } });
  }
}
