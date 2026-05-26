import Handlebars from "handlebars";
import type { View } from "../base.view";

import templateContent from "./writer.view.html?raw";

import { createIcons, Eye, FileText, Terminal, X, Lock, Copy, Check, ExternalLink } from "lucide";
import { encrypt, removePassCommand } from "../../../encryption/encryption.service";
import { compressToUrlSafe } from "../../../utils/compression";
import { CommandMatcher } from "../../../core/matchers/command/CommandMatcher";
import { UrlMatcher } from "../../../core/matchers/url/UrlMatcher";
import { EmailMatcher } from "../../../core/matchers/email/EmailMatcher";
import type { Replacement } from "../../../core/automaton/types";

import { EditorView, keymap, highlightActiveLine, highlightSpecialChars, Decoration } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { StateField, RangeSetBuilder, RangeSet } from '@codemirror/state';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';

export class WriterView implements View {
  private template = Handlebars.compile(templateContent);
  private editorView: EditorView | undefined;
  private commandMatcher = new CommandMatcher();
  private urlMatcher = new UrlMatcher();
  private emailMatcher = new EmailMatcher();

  private keyInputModal!: HTMLDivElement;
  private keyInput!: HTMLInputElement;
  private keyInputError!: HTMLParagraphElement;
  private confirmKeyBtn!: HTMLButtonElement;
  private closeKeyModalBtn!: HTMLButtonElement;

  private encryptionModal!: HTMLDivElement;
  private ciphertextOutput!: HTMLTextAreaElement;
  private copyCiphertextBtn!: HTMLButtonElement;
  private copyBtnLabel!: HTMLSpanElement;
  private closeEncryptionBtn!: HTMLButtonElement;
  private closeEncryptionModalBtn!: HTMLButtonElement;
  private readCardLinkBtn!: HTMLButtonElement;

  private encryptBtn!: HTMLButtonElement;

  private editorErrorMsg!: HTMLParagraphElement;

  private shareableUrl: string = '';

  private lineCommandsCommitted = new Set<number>();

  render(data: Record<string, any> = {}): string {
    return this.template(data);
  }

  afterRender(): void {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    const themeToggle = document.getElementById('theme-toggle');
    themeToggle?.addEventListener('click', () => {
      const isDark = document.documentElement.classList.toggle('dark');
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });

    const editorContainer = document.getElementById('editor') as HTMLDivElement;
    const wordCountEl = document.getElementById('word-count');
    const charCountEl = document.getElementById('char-count');

    this.keyInputModal = document.getElementById('key-input-modal') as HTMLDivElement;
    this.keyInput = document.getElementById('key-input') as HTMLInputElement;
    this.keyInputError = document.getElementById('key-input-error') as HTMLParagraphElement;
    this.confirmKeyBtn = document.getElementById('confirm-key-btn') as HTMLButtonElement;
    this.closeKeyModalBtn = document.getElementById('close-key-modal-btn') as HTMLButtonElement;

    this.encryptionModal = document.getElementById('encryption-modal') as HTMLDivElement;
    this.ciphertextOutput = document.getElementById('ciphertext-output') as HTMLTextAreaElement;
    this.copyCiphertextBtn = document.getElementById('copy-ciphertext-btn') as HTMLButtonElement;
    this.copyBtnLabel = document.getElementById('copy-btn-label') as HTMLSpanElement;
    this.closeEncryptionBtn = document.getElementById('close-encryption-btn') as HTMLButtonElement;
    this.closeEncryptionModalBtn = document.getElementById('close-encryption-modal-btn') as HTMLButtonElement;
    this.readCardLinkBtn = document.getElementById('read-card-link-btn') as HTMLButtonElement;

    this.encryptBtn = document.getElementById('encrypt-btn') as HTMLButtonElement;

    this.editorErrorMsg = document.getElementById('editor-error-msg') as HTMLParagraphElement;

    this.editorView = new EditorView({
      state: EditorState.create({
        doc: '',
        extensions: [
          history(),
          highlightActiveLine(),
          highlightSpecialChars(),
          keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
          this.commandDecorations(),
          EditorView.lineWrapping,
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              const text = update.state.doc.toString();
              const words = text.trim() ? text.trim().split(/\s+/).length : 0;
              const chars = text.length;
              if (wordCountEl) wordCountEl.textContent = `${words} palabras`;
              if (charCountEl) charCountEl.textContent = `${chars} caracteres`;
              this.hideEditorError();
              this.handleLineCommands(update.state);
            }
          }),
        ],
      }),
      parent: editorContainer,
    });

    this.editorView.focus();

    document.addEventListener('click', (e) => {
      if (this.editorView && !this.editorView.dom.contains(e.target as Node)) {
        this.editorView.focus();
      }
    });

    this.encryptBtn.addEventListener('click', () => {
      this.handleEncryptClick();
    });

    this.closeKeyModalBtn.addEventListener('click', () => {
      this.closeKeyModal();
    });

    this.confirmKeyBtn.addEventListener('click', () => {
      this.handleConfirmKey();
    });

    this.keyInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.handleConfirmKey();
      }
    });

    this.copyCiphertextBtn.addEventListener('click', () => {
      this.handleCopyCiphertext();
    });

    this.readCardLinkBtn.addEventListener('click', () => {
      this.handleOpenReadCard();
    });

    this.closeEncryptionBtn.addEventListener('click', () => {
      this.closeEncryptionModal();
    });

    this.closeEncryptionModalBtn.addEventListener('click', () => {
      this.closeEncryptionModal();
    });

    createIcons({ icons: { Eye, FileText, Terminal, X, Lock, Copy, Check, ExternalLink } });
  }

  private commandDecorations() {
    return StateField.define<RangeSet<Decoration>>({
      create: (state) => this.buildDecorations(state.doc.toString()),
      update: (value, tr) => {
        if (tr.docChanged) {
          return this.buildDecorations(tr.state.doc.toString());
        }
        return value.map(tr.changes);
      },
      provide: (field) => EditorView.decorations.from(field),
    });
  }

  private buildDecorations(doc: string): RangeSet<Decoration> {
    const builder = new RangeSetBuilder<Decoration>();

    this.commandMatcher.match(doc);
    const commands = this.commandMatcher.getCommandResults();
    if (commands.length > 0) {
      console.log('[Pattern] Commands found:', commands.map(c => `$${c.command}$${c.value}$`));
    }

    for (const cmd of commands) {
      if (cmd.isLineCommand) {
        const secondDollar = doc.indexOf('$', cmd.start + 1);
        const syntaxEnd = secondDollar + 1;
        const contentStart = syntaxEnd;
        const contentEnd = cmd.end;

        builder.add(cmd.start, syntaxEnd, Decoration.mark({
          class: 'cmd-syntax'
        }));

        const level = cmd.command === 'title' ? 1 : parseInt(cmd.command.split(':')[1] || '1', 10);
        builder.add(contentStart, contentEnd, Decoration.mark({
          class: `cmd-content cmd-line--title`,
          attributes: { 'data-level': level.toString() }
        }));
      } else {
        const openEnd = cmd.start + cmd.command.length + 2;
        builder.add(cmd.start, openEnd, Decoration.mark({ class: 'cmd-syntax' }));
        builder.add(openEnd, cmd.end - 1, Decoration.mark({ class: `cmd-content cmd-content--${cmd.command}` }));
        builder.add(cmd.end - 1, cmd.end, Decoration.mark({ class: 'cmd-syntax' }));
      }
    }

    const urlResults = this.urlMatcher.match(doc) as Replacement[];
    if (urlResults.length > 0) {
      console.log('[Pattern] URLs found:', urlResults.map(r => doc.substring(r.start, r.end)));
    }
    for (const url of urlResults) {
      builder.add(url.start, url.end, Decoration.mark({
        class: 'cmd-url',
        attributes: { 'data-url': doc.substring(url.start, url.end) }
      }));
    }

    const emailResults = this.emailMatcher.match(doc) as Replacement[];
    if (emailResults.length > 0) {
      console.log('[Pattern] Emails found:', emailResults.map(r => doc.substring(r.start, r.end)));
    }
    for (const email of emailResults) {
      builder.add(email.start, email.end, Decoration.mark({
        class: 'cmd-email',
        attributes: { 'data-email': doc.substring(email.start, email.end) }
      }));
    }

    return builder.finish();
  }

  private handleLineCommands(state: EditorState): void {
    const doc = state.doc.toString();
    this.commandMatcher.match(doc);
    const commands = this.commandMatcher.getCommandResults();

    for (const cmd of commands) {
      if (cmd.isLineCommand && cmd.command === 'title' && !this.lineCommandsCommitted.has(cmd.start)) {
        if (doc.slice(cmd.end).startsWith('\n') || cmd.end === doc.length) {
          this.lineCommandsCommitted.add(cmd.start);
        }
      }
    }
  }

  private getEditorText(): string {
    return this.editorView?.state.doc.toString() || '';
  }

  private handleEncryptClick(): void {
    const editorText = this.getEditorText();

    if (!editorText.trim()) {
      this.showEditorError('No hay contenido para cifrar.');
      return;
    }

    removePassCommand(editorText);
    this.openKeyModal();
  }

  private openKeyModal(): void {
    this.keyInput.value = '';
    this.hideKeyInputError();
    this.keyInputModal.classList.add('is-active');
    setTimeout(() => this.keyInput.focus(), 50);
  }

  private closeKeyModal(): void {
    this.keyInputModal.classList.remove('is-active');
    this.hideKeyInputError();
  }

  private handleConfirmKey(): void {
    const passphrase = this.keyInput.value;

    if (!passphrase) {
      this.showKeyInputError();
      return;
    }

    this.closeKeyModal();
    this.runEncryption(passphrase);
  }

  private async runEncryption(passphrase: string): Promise<void> {
    const editorText = this.getEditorText();
    const plaintext = removePassCommand(editorText);

    try {
      const compressed = compressToUrlSafe(plaintext);
      const ciphertext = await encrypt(compressed, passphrase);
      this.openEncryptionModal(ciphertext);
    } catch (err) {
      console.error('Encryption error:', err);
      this.showEditorError('Error inesperado al cifrar. Inténtalo de nuevo.');
    }
  }

  private openEncryptionModal(ciphertext: string): void {
    this.shareableUrl = window.location.origin + '/read/card?c=' + encodeURIComponent(ciphertext);

    this.ciphertextOutput.value = this.shareableUrl;
    this.resetCopyButton();
    this.encryptionModal.classList.add('is-active');
  }

  private closeEncryptionModal(): void {
    this.encryptionModal.classList.remove('is-active');
  }

  private handleOpenReadCard(): void {
    window.open(this.shareableUrl, '_blank');
  }

  private async handleCopyCiphertext(): Promise<void> {
    const url = this.shareableUrl;
    try {
      await navigator.clipboard.writeText(url);
      this.copyBtnLabel.textContent = '¡Copiado!';
      this.copyCiphertextBtn.classList.add('btn-copied');
      setTimeout(() => {
        this.resetCopyButton();
      }, 1500);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  }

  private resetCopyButton(): void {
    this.copyBtnLabel.textContent = 'Copiar enlace';
    this.copyCiphertextBtn.classList.remove('btn-copied');
  }

  private showEditorError(message: string): void {
    this.editorErrorMsg.textContent = message;
    this.editorErrorMsg.style.display = 'block';
  }

  private hideEditorError(): void {
    this.editorErrorMsg.style.display = 'none';
    this.editorErrorMsg.textContent = '';
  }

  private showKeyInputError(): void {
    this.keyInputError.style.display = 'block';
  }

  private hideKeyInputError(): void {
    this.keyInputError.style.display = 'none';
  }
}