import type { LetterLockerPreviewer } from "../../automaton/letterLockerAutomaton";
import type { View } from "../base.view";

import Handlebars from "handlebars";
import templateContent from "./readcard.view.html?raw";
import { createIcons, ArrowLeft, FileText, Lock, MailOpen, ShieldCheck, ShieldOff, X } from "lucide";
import { decrypt, isCiphertext, WrongPassphraseError } from "../../encryption/encryption.service";
import { addToHistory } from "../../history/letter-history";

// Clave de localStorage para el contenido de la carta
export const LETTER_STORAGE_KEY = 'letterlocker:card';

// Texto de prueba con el formato LetterLocker (fallback cuando no hay contenido)
const SAMPLE_LETTER = "$title:1$Mi carta secreta$Hola $bold$juan$, quiero que pruebes este software de $italic$cartas secretas$";

/**
 * Resuelve el contenido de la carta con la siguiente prioridad:
 * 1. Query param `?c=` en la URL
 * 2. localStorage bajo la clave LETTER_STORAGE_KEY
 * 3. SAMPLE_LETTER como fallback
 */
function resolveCardContent(): string {
  // 1. Query param ?c=
  const params = new URLSearchParams(window.location.search);
  const fromUrl = params.get('c');
  if (fromUrl) {
    return fromUrl; // URLSearchParams.get() ya decodifica %xx automáticamente
  }

  // 2. localStorage
  const fromStorage = localStorage.getItem(LETTER_STORAGE_KEY);
  if (fromStorage) {
    return fromStorage;
  }

  // 3. Fallback
  return SAMPLE_LETTER;
}

export class ReadCardView implements View {
  private previewer: LetterLockerPreviewer;

  // DecryptionModal elements
  private decryptionModal: HTMLDivElement | undefined;
  private decryptionKeyInput: HTMLInputElement | undefined;
  private decryptionError: HTMLParagraphElement | undefined;
  private decryptBtn: HTMLButtonElement | undefined;
  private closeDecryptionModalBtn: HTMLButtonElement | undefined;

  // Content elements
  private titleEl: HTMLElement | null = null;
  private contentEl: HTMLElement | null = null;

  // Current ciphertext being decrypted
  private currentCiphertext: string = '';

  constructor(previewer: LetterLockerPreviewer) {
    this.previewer = previewer;
  }

  render(data: Record<string, any> | undefined): string {
    return Handlebars.compile(templateContent)(data);
  }

  afterRender(): void {
    // Grab DOM elements
    this.titleEl = document.getElementById("letter-title");
    this.contentEl = document.getElementById("letter-content");

    // DecryptionModal elements
    this.decryptionModal = document.getElementById("decryption-modal") as HTMLDivElement;
    this.decryptionKeyInput = document.getElementById("decryption-key-input") as HTMLInputElement;
    this.decryptionError = document.getElementById("decryption-error") as HTMLParagraphElement;
    this.decryptBtn = document.getElementById("decrypt-btn") as HTMLButtonElement;
    this.closeDecryptionModalBtn = document.getElementById("close-decryption-modal-btn") as HTMLButtonElement;

    // Wire up modal events
    this.decryptBtn.addEventListener("click", () => {
      this.handleDecrypt();
    });

    this.decryptionKeyInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        this.handleDecrypt();
      }
    });

    this.closeDecryptionModalBtn.addEventListener("click", () => {
      this.closeDecryptionModal();
      this.showProtectedMessage();
    });

    // Determine content and render or show modal
    const content = resolveCardContent();

    if (isCiphertext(content)) {
      // Requirement 5.1: carta cifrada → mostrar DecryptionModal
      this.currentCiphertext = content;
      this.openDecryptionModal();
    } else {
      // Texto plano → renderizar directamente
      this.renderContent(content);
    }

    createIcons({ icons: { ArrowLeft, FileText, MailOpen, ShieldCheck, Lock, X, ShieldOff } });
  }

  // ── Private helpers ──────────────────────────────────────────────────────────

  private renderContent(plaintext: string): void {
    const rendered = this.previewer.preview(plaintext);

    // Separar el título del cuerpo: el título es el primer <h1>, el resto es el cuerpo
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
    // Focus the input after the modal opens
    setTimeout(() => this.decryptionKeyInput!.focus(), 50);
  }

  private closeDecryptionModal(): void {
    this.decryptionModal!.classList.remove('is-active');
    this.hideDecryptionError();
  }

  private async handleDecrypt(): Promise<void> {
    const passphrase = this.decryptionKeyInput!.value;

    try {
      // Requirement 5.3: descifrar con la clave proporcionada
      const plaintext = await decrypt(this.currentCiphertext, passphrase);
      // Guardar en historial tras descifrado exitoso
      addToHistory(this.currentCiphertext);
      this.closeDecryptionModal();
      this.renderContent(plaintext);
    } catch (err) {
      if (err instanceof WrongPassphraseError) {
        // Requirement 5.4: clave incorrecta → mostrar error sin cerrar el modal
        this.showDecryptionError();
      } else {
        console.error('Error inesperado al descifrar:', err);
        this.showDecryptionError();
      }
    }
  }

  // Requirement 5.5: el usuario cierra el modal sin descifrar
  private showProtectedMessage(): void {
    if (this.titleEl) {
      this.titleEl.innerHTML = 'Carta protegida';
    }
    if (this.contentEl) {
      this.contentEl.innerHTML =
        '<p class="text-slate-400 flex items-center gap-2"><i data-lucide="shield-off" class="w-4 h-4"></i> Esta carta está protegida con una clave. No es posible mostrar su contenido sin la clave correcta.</p>';
      // Re-render the shield-off icon after injecting HTML
      createIcons({ icons: { ShieldOff } });
    }
  }

  private showDecryptionError(): void {
    this.decryptionError!.style.display = 'block';
  }

  private hideDecryptionError(): void {
    this.decryptionError!.style.display = 'none';
  }
}
