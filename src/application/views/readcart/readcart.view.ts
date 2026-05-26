import { Previewer } from "../../../core/previewer/Previewer";
import type { View } from "../base.view";

import Handlebars from "handlebars";
import templateContent from "./readcard.view.html?raw";
import { createIcons, ArrowLeft, FileText, Lock, MailOpen, ShieldCheck, ShieldOff, X } from "lucide";
import { decrypt, isCiphertext, WrongPassphraseError } from "../../../encryption/encryption.service";
import { decompressFromUrlSafe } from "../../../utils/compression";
import { addToHistory } from "../../../history/letter-history";

export const LETTER_STORAGE_KEY = 'letterlocker:card';

function resolveCardContent(): string | null {
  const params = new URLSearchParams(window.location.search);
  const fromUrl = params.get('c');
  if (fromUrl) {
    return fromUrl;
  }

  const fromStorage = localStorage.getItem(LETTER_STORAGE_KEY);
  if (fromStorage) {
    return fromStorage;
  }

  return null;
}

export class ReadCardView implements View {
  private previewer: Previewer;

  private decryptionModal: HTMLDivElement | undefined;
  private decryptionKeyInput: HTMLInputElement | undefined;
  private decryptionError: HTMLParagraphElement | undefined;
  private decryptBtn: HTMLButtonElement | undefined;
  private closeDecryptionModalBtn: HTMLButtonElement | undefined;

  private titleEl: HTMLElement | null = null;
  private contentEl: HTMLElement | null = null;

  private currentCiphertext: string = '';

  constructor() {
    this.previewer = new Previewer();
  }

  render(data: Record<string, any> | undefined): string {
    return Handlebars.compile(templateContent)(data);
  }

  afterRender(): void {
    this.titleEl = document.getElementById("letter-title");
    this.contentEl = document.getElementById("letter-content");

    this.decryptionModal = document.getElementById("decryption-modal") as HTMLDivElement;
    this.decryptionKeyInput = document.getElementById("decryption-key-input") as HTMLInputElement;
    this.decryptionError = document.getElementById("decryption-error") as HTMLParagraphElement;
    this.decryptBtn = document.getElementById("decrypt-btn") as HTMLButtonElement;
    this.closeDecryptionModalBtn = document.getElementById("close-decryption-modal-btn") as HTMLButtonElement;

    this.decryptBtn.addEventListener("click", () => {
      this.handleDecrypt();
    });

    this.decryptionKeyInput.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        this.handleDecrypt();
      }
    });

    this.closeDecryptionModalBtn.addEventListener("click", () => {
      this.closeDecryptionModal();
      this.showProtectedMessage();
    });

    const content = resolveCardContent();

    if (!content) {
      this.showProtectedMessage();
    } else if (isCiphertext(content)) {
      this.currentCiphertext = content;
      this.openDecryptionModal();
    } else {
      this.renderContent(content);
    }

    createIcons({ icons: { ArrowLeft, FileText, MailOpen, ShieldCheck, Lock, X, ShieldOff } });
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
      addToHistory(this.currentCiphertext);
      this.closeDecryptionModal();
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
    this.titleEl!.innerHTML = 'Protected letter';
    if (this.contentEl) {
      this.contentEl.innerHTML = '<p class="text-slate-500">This letter is password protected. Enter the passphrase to read it.</p>';
    }
  }

  private showDecryptionError(): void {
    this.decryptionError!.style.display = 'block';
  }

  private hideDecryptionError(): void {
    this.decryptionError!.style.display = 'none';
  }
}