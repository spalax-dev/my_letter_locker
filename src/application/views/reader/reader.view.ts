import { createIcons } from 'lucide';
import { Previewer } from "../../../core/previewer/Previewer";
import type { View } from "../base.view";

import Handlebars from "handlebars";
import templateContent from "./reader.view.html?raw";
import { decrypt, isCiphertext, WrongPassphraseError } from "../../../encryption/encryption.service";
import { decompressFromUrlSafe } from "../../../utils/compression";

export const LETTER_STORAGE_KEY = 'letterlocker:card';

function resolveCardContent(): string | null {
  const params = new URLSearchParams(window.location.search);
  const fromUrlCipher = params.get('c');
  if (fromUrlCipher) {
    return fromUrlCipher;
  }

  const fromUrlData = params.get('d');
  if (fromUrlData) {
    return decompressFromUrlSafe(fromUrlData);
  }

  const fromStorage = localStorage.getItem(LETTER_STORAGE_KEY);
  if (fromStorage) {
    return fromStorage;
  }

  const fromHistoryStorage = localStorage.getItem('letter ciphertext');
  if (fromHistoryStorage) {
    localStorage.removeItem('letter ciphertext');
    return fromHistoryStorage;
  }

  return null;
}

export class ReaderView implements View {
  private previewer: Previewer;

  private decryptionModal: HTMLDivElement | undefined;
  private decryptionKeyInput: HTMLInputElement | undefined;
  private decryptionError: HTMLParagraphElement | undefined;
  private decryptBtn: HTMLButtonElement | undefined;
  private closeDecryptionModalBtn: HTMLButtonElement | undefined;

  private titleEl: HTMLElement | null = null;
  private contentEl: HTMLElement | null = null;
  private readerPageEl: HTMLElement | null = null;

  private currentCiphertext: string = '';

  constructor() {
    this.previewer = new Previewer();
  }

  render(data: Record<string, any> | undefined): string {
    return Handlebars.compile(templateContent)(data);
  }

  afterRender(): void {
    this.readerPageEl = document.getElementById('reader-page');
    this.titleEl = document.getElementById("letter-title");
    this.contentEl = document.getElementById("letter-content");

    this.decryptionModal = document.getElementById("decryption-modal") as HTMLDivElement;
    this.decryptionKeyInput = document.getElementById("decryption-key-input") as HTMLInputElement;
    this.decryptionError = document.getElementById("decryption-error") as HTMLParagraphElement;
    this.decryptBtn = document.getElementById("decrypt-btn") as HTMLButtonElement;
    this.closeDecryptionModalBtn = document.getElementById("close-decryption-modal-btn") as HTMLButtonElement;

    this.decryptBtn!.addEventListener("click", () => {
      this.handleDecrypt();
    });

    this.decryptionKeyInput!.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        this.handleDecrypt();
      }
    });

    this.closeDecryptionModalBtn!.addEventListener("click", () => {
      this.closeDecryptionModal();
      this.showProtectedMessage();
    });

    const content = resolveCardContent();

    if (!content) {
      this.showNoContentMessage();
    } else if (isCiphertext(content)) {
      this.currentCiphertext = content;
      this.openDecryptionModal();
    } else {
      this.readerPageEl!.style.display = 'flex';
      this.renderContent(content);
    }
  }

  private renderContent(plaintext: string): void {
    const rendered = this.previewer.preview(plaintext);

    const titleMatch = rendered.match(/<h1>(.*?)<\/h1>/);
    const bodyContent = rendered.replace(/<h1>.*?<\/h1>/, "").trim();

    if (this.titleEl && titleMatch) {
      this.titleEl.innerHTML = titleMatch[1];
    }

    if (this.contentEl) {
      this.contentEl.innerHTML = bodyContent;
      createIcons();
    }
  }

  private openDecryptionModal(): void {
    this.decryptionKeyInput!.value = '';
    this.hideDecryptionError();
    this.decryptionModal!.classList.add('is-active');
    setTimeout(() => this.decryptionKeyInput!.focus(), 50);
  }

  private closeDecryptionModal(): void {
    this.decryptionModal!.classList.remove('is-active');
    this.hideDecryptionError();
  }

  private async handleDecrypt(): Promise<void> {
    const passphrase = this.decryptionKeyInput!.value;

    try {
      const compressed = await decrypt(this.currentCiphertext, passphrase);
      const plaintext = decompressFromUrlSafe(compressed);
      this.closeDecryptionModal();
      this.readerPageEl!.style.display = 'flex';
      this.renderContent(plaintext);
    } catch (err) {
      if (err instanceof WrongPassphraseError) {
        this.showDecryptionError();
      } else {
        console.error('Unexpected error while decrypting:', err);
        this.showDecryptionError();
      }
    }
  }

  private showProtectedMessage(): void {
    if (this.titleEl) {
      this.titleEl.innerHTML = 'Carta protegida';
    }
    if (this.contentEl) {
      this.contentEl.innerHTML = '<p>Esta carta está protegida con contraseña.</p>';
      createIcons();
    }
  }

  private showNoContentMessage(): void {
    if (this.titleEl) {
      this.titleEl.innerHTML = 'Sin contenido';
    }
    if (this.contentEl) {
      this.contentEl.innerHTML = '<p>No se encontró contenido para mostrar.</p>';
      createIcons();
    }
  }

  private showDecryptionError(): void {
    this.decryptionError!.style.display = 'block';
  }

  private hideDecryptionError(): void {
    this.decryptionError!.style.display = 'none';
  }
}