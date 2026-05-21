import Handlebars from "handlebars";
import type { View } from "../base.view";

import { LetterLockerPreviewer } from "../../automaton/letterLockerAutomaton";
import templateContent from "./home.view.html?raw";
import { BadCommandModifierError, CommandNotFoundError } from "../../commands/commands";
import { createIcons, Eye, FileText, Terminal, X, Lock, Copy, Check, ExternalLink } from "lucide";
import { encrypt, removePassCommand } from "../../encryption/encryption.service";
import { LETTER_STORAGE_KEY } from "../readcart/readcart.view";

export class HomeView implements View {
  private template = Handlebars.compile(templateContent)
  private inpEl: HTMLTextAreaElement | undefined;
  private previewModal: HTMLDivElement | undefined;
  private previewContentContainer: HTMLDivElement | undefined;
  private openModalBtn: HTMLButtonElement | undefined;
  private closeModalBtn: HTMLButtonElement | undefined;
  private previewer: LetterLockerPreviewer;

  // KeyInputModal elements
  private keyInputModal: HTMLDivElement | undefined;
  private keyInput: HTMLInputElement | undefined;
  private keyInputError: HTMLParagraphElement | undefined;
  private confirmKeyBtn: HTMLButtonElement | undefined;
  private closeKeyModalBtn: HTMLButtonElement | undefined;

  // EncryptionModal elements
  private encryptionModal: HTMLDivElement | undefined;
  private ciphertextOutput: HTMLTextAreaElement | undefined;
  private copyCiphertextBtn: HTMLButtonElement | undefined;
  private copyBtnLabel: HTMLSpanElement | undefined;
  private closeEncryptionBtn: HTMLButtonElement | undefined;
  private closeEncryptionModalBtn: HTMLButtonElement | undefined;
  private readCardLinkBtn: HTMLButtonElement | undefined;

  // Encrypt button
  private encryptBtn: HTMLButtonElement | undefined;

  // Editor error message
  private editorErrorMsg: HTMLParagraphElement | undefined;

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
    this.inpEl = document.getElementById('editor') as HTMLTextAreaElement;
    this.previewModal = document.getElementById('preview-modal') as HTMLDivElement;
    this.previewContentContainer = document.getElementById('preview-content') as HTMLDivElement;
    this.openModalBtn = document.getElementById('open-preview-btn') as HTMLButtonElement;
    this.closeModalBtn = document.getElementById('close-preview-btn') as HTMLButtonElement;
    const wordCountEl = document.getElementById('word-count');

    // KeyInputModal
    this.keyInputModal = document.getElementById('key-input-modal') as HTMLDivElement;
    this.keyInput = document.getElementById('key-input') as HTMLInputElement;
    this.keyInputError = document.getElementById('key-input-error') as HTMLParagraphElement;
    this.confirmKeyBtn = document.getElementById('confirm-key-btn') as HTMLButtonElement;
    this.closeKeyModalBtn = document.getElementById('close-key-modal-btn') as HTMLButtonElement;

    // EncryptionModal
    this.encryptionModal = document.getElementById('encryption-modal') as HTMLDivElement;
    this.ciphertextOutput = document.getElementById('ciphertext-output') as HTMLTextAreaElement;
    this.copyCiphertextBtn = document.getElementById('copy-ciphertext-btn') as HTMLButtonElement;
    this.copyBtnLabel = document.getElementById('copy-btn-label') as HTMLSpanElement;
    this.closeEncryptionBtn = document.getElementById('close-encryption-btn') as HTMLButtonElement;
    this.closeEncryptionModalBtn = document.getElementById('close-encryption-modal-btn') as HTMLButtonElement;
    this.readCardLinkBtn = document.getElementById('read-card-link-btn') as HTMLButtonElement;

    // Encrypt button
    this.encryptBtn = document.getElementById('encrypt-btn') as HTMLButtonElement;

    // Editor error message
    this.editorErrorMsg = document.getElementById('editor-error-msg') as HTMLParagraphElement;

    // ── Preview modal ──────────────────────────────────────────────────────────
    this.openModalBtn.addEventListener('click', () => {
      this.previewModal!.classList.add('is-active');
    });

    this.closeModalBtn.addEventListener('click', () => {
      this.previewModal!.classList.remove('is-active');
    });

    // ── Editor input ───────────────────────────────────────────────────────────
    this.inpEl.addEventListener('input', (e) => {
      const target = e.target as HTMLTextAreaElement;

      // actualizar contador de palabras
      const words = target.value.trim() ? target.value.trim().split(/\s+/).length : 0;
      if (wordCountEl) wordCountEl.textContent = `${words} palabras`;

      // ocultar error inline al escribir
      this.hideEditorError();

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

    // ── Encrypt button ─────────────────────────────────────────────────────────
    this.encryptBtn.addEventListener('click', () => {
      this.handleEncryptClick();
    });

    // ── KeyInputModal: close ───────────────────────────────────────────────────
    this.closeKeyModalBtn.addEventListener('click', () => {
      this.closeKeyModal();
    });

    // ── KeyInputModal: confirm ─────────────────────────────────────────────────
    this.confirmKeyBtn.addEventListener('click', () => {
      this.handleConfirmKey();
    });

    // Allow pressing Enter in the key input to confirm
    this.keyInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.handleConfirmKey();
      }
    });

    // ── EncryptionModal: copy ──────────────────────────────────────────────────
    this.copyCiphertextBtn.addEventListener('click', () => {
      this.handleCopyCiphertext();
    });

    // ── EncryptionModal: open read/card link ───────────────────────────────────
    this.readCardLinkBtn.addEventListener('click', () => {
      this.handleOpenReadCard();
    });

    // ── EncryptionModal: close ─────────────────────────────────────────────────
    this.closeEncryptionBtn.addEventListener('click', () => {
      this.closeEncryptionModal();
    });

    this.closeEncryptionModalBtn.addEventListener('click', () => {
      this.closeEncryptionModal();
    });

    createIcons({ icons: { Eye, FileText, Terminal, X, Lock, Copy, Check, ExternalLink } });
  }

  // ── Private helpers ──────────────────────────────────────────────────────────

  private handleEncryptClick(): void {
    const editorValue = this.inpEl!.value;

    // Requirement 6.2: si el documento está vacío, mostrar error inline
    if (!editorValue.trim()) {
      this.showEditorError('No hay contenido para cifrar.');
      return;
    }

    // Actualizar el previewer para extraer la passphrase del documento
    try {
      this.previewer.preview(editorValue);
    } catch {
      // ignorar errores de comandos desconocidos al extraer passphrase
    }

    // Requirement 2.3: si el documento ya tiene el comando pass, omitir el modal
    if (this.previewer.extractedPassphrase) {
      this.runEncryption(this.previewer.extractedPassphrase);
    } else {
      // Requirement 2.2: abrir KeyInputModal
      this.openKeyModal();
    }
  }

  private openKeyModal(): void {
    this.keyInput!.value = '';
    this.hideKeyInputError();
    this.keyInputModal!.classList.add('is-active');
    // Focus the input after the modal opens
    setTimeout(() => this.keyInput!.focus(), 50);
  }

  private closeKeyModal(): void {
    this.keyInputModal!.classList.remove('is-active');
    this.hideKeyInputError();
  }

  private handleConfirmKey(): void {
    const passphrase = this.keyInput!.value;

    // Requirement 2.4: validar que la clave no esté vacía
    if (!passphrase) {
      this.showKeyInputError();
      return;
    }

    this.closeKeyModal();
    this.runEncryption(passphrase);
  }

  private async runEncryption(passphrase: string): Promise<void> {
    const editorValue = this.inpEl!.value;
    const plaintext = removePassCommand(editorValue);

    try {
      const ciphertext = await encrypt(plaintext, passphrase);
      this.openEncryptionModal(ciphertext);
    } catch (err) {
      // Requirement 4.5: error inesperado al cifrar
      console.error('Error al cifrar:', err);
      this.showEditorError('Error inesperado al cifrar la carta. Inténtalo de nuevo.');
    }
  }

  private openEncryptionModal(ciphertext: string): void {
    // Guardar en localStorage para que /read/card lo recoja
    localStorage.setItem(LETTER_STORAGE_KEY, ciphertext);

    this.ciphertextOutput!.value = ciphertext;
    this.resetCopyButton();
    this.encryptionModal!.classList.add('is-active');
  }

  private closeEncryptionModal(): void {
    this.encryptionModal!.classList.remove('is-active');
  }

  private handleOpenReadCard(): void {
    window.location.href = '/read/card';
  }

  private async handleCopyCiphertext(): Promise<void> {
    const ciphertext = this.ciphertextOutput!.value;
    try {
      await navigator.clipboard.writeText(ciphertext);
      // Requirement 4.3: feedback visual durante 1500 ms
      this.copyBtnLabel!.textContent = '¡Copiado!';
      this.copyCiphertextBtn!.classList.add('btn-copied');
      setTimeout(() => {
        this.resetCopyButton();
      }, 1500);
    } catch (err) {
      console.error('Error al copiar al portapapeles:', err);
    }
  }

  private resetCopyButton(): void {
    this.copyBtnLabel!.textContent = 'Copiar';
    this.copyCiphertextBtn!.classList.remove('btn-copied');
  }

  private showEditorError(message: string): void {
    this.editorErrorMsg!.textContent = message;
    this.editorErrorMsg!.style.display = 'block';
  }

  private hideEditorError(): void {
    this.editorErrorMsg!.style.display = 'none';
    this.editorErrorMsg!.textContent = '';
  }

  private showKeyInputError(): void {
    this.keyInputError!.style.display = 'block';
  }

  private hideKeyInputError(): void {
    this.keyInputError!.style.display = 'none';
  }
}
