import type { LetterLockerPreviewer } from "../../automaton/letterLockerAutomaton";
import type { View } from "../base.view";

import Handlebars from "handlebars";
import templateContent from "./reader.view.html?raw";
import { createIcons, FileText, Inbox, Lock, Trash2 } from "lucide";
import { getHistory, removeFromHistory, formatDate, type LetterEntry } from "../../history/letter-history";
import { LETTER_STORAGE_KEY } from "../readcart/readcart.view";

export class ReaderView implements View {
  constructor(_previewer: LetterLockerPreviewer) {}

  render(data: Record<string, any> | undefined): string {
    return Handlebars.compile(templateContent)(data);
  }

  afterRender(): void {
    this.renderHistory();
    createIcons({ icons: { FileText, Inbox, Lock, Trash2 } });
  }

  private renderHistory(): void {
    const listEl = document.getElementById('history-list')!;
    const emptyEl = document.getElementById('history-empty')!;
    const history = getHistory();

    if (history.length === 0) {
      listEl.style.display = 'none';
      emptyEl.style.display = 'flex';
      return;
    }

    listEl.style.display = 'grid';
    emptyEl.style.display = 'none';
    listEl.innerHTML = history.map(entry => this.renderEntry(entry)).join('');

    // Eventos: abrir carta
    listEl.querySelectorAll<HTMLButtonElement>('[data-open]').forEach(btn => {
      btn.addEventListener('click', () => {
        const ciphertext = btn.dataset.open!;
        localStorage.setItem(LETTER_STORAGE_KEY, ciphertext);
        window.location.href = '/read/card';
      });
    });

    // Eventos: eliminar carta
    listEl.querySelectorAll<HTMLButtonElement>('[data-delete]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.delete!;
        removeFromHistory(id);
        this.renderHistory();
        createIcons({ icons: { FileText, Inbox, Lock, Trash2 } });
      });
    });
  }

  private renderEntry(entry: LetterEntry): string {
    const date = formatDate(entry.receivedAt);
    // Mostrar los primeros 24 caracteres del ciphertext como identificador visual
    const preview = entry.ciphertext.slice(0, 24) + '…';

    return `
      <div class="history-item">
        <div class="history-item-icon">
          <i data-lucide="lock" class="history-lock-icon"></i>
        </div>
        <div class="history-item-body">
          <span class="history-item-id">${preview}</span>
          <span class="history-item-date">${date}</span>
        </div>
        <div class="history-item-actions">
          <button class="btn-utility" data-open="${entry.ciphertext}" title="Abrir carta">
            <i data-lucide="file-text" class="icon-slate"></i>
            <span>Abrir</span>
          </button>
          <button class="history-delete-btn" data-delete="${entry.id}" title="Eliminar del historial">
            <i data-lucide="trash-2" class="history-delete-icon"></i>
          </button>
        </div>
      </div>
    `;
  }
}
