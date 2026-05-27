import Handlebars from "handlebars";
import type { View } from "../base.view";

import templateContent from "./writer.view.html?raw";

import { createIcons, X, MessageCircle, Mail, Copy, Share2, Heading, Heading1, Heading2, Heading3, Heading4, Heading5, Heading6 } from "lucide";
import { encrypt, removePassCommand } from "../../../encryption/encryption.service";
import { compressToUrlSafe } from "../../../utils/compression";
import { CommandMatcher } from "../../../core/matchers/command/CommandMatcher";
import { UrlMatcher } from "../../../core/matchers/url/UrlMatcher";
import { EmailMatcher } from "../../../core/matchers/email/EmailMatcher";
import { DateMatcher } from "../../../core/matchers/date/DateMatcher";
import { PhoneMatcher } from "../../../core/matchers/phone/PhoneMatcher";
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
  private dateMatcher = new DateMatcher();
  private phoneMatcher = new PhoneMatcher();

  private shareModal!: HTMLDivElement;
  private encryptionToggle!: HTMLInputElement;
  private shareKeyInput!: HTMLInputElement;
  private shareKeyError!: HTMLParagraphElement;
  private shareCopyLabel!: HTMLSpanElement;
  private shareBtn!: HTMLButtonElement;
  private shareWhatsAppBtn!: HTMLAnchorElement;
  private shareEmailBtn!: HTMLAnchorElement;
  private shareCopyBtn!: HTMLAnchorElement;

  private isEncryptionEnabled: boolean = true;

  private editorErrorMsg!: HTMLParagraphElement;

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

    this.shareModal = document.getElementById('share-modal') as HTMLDivElement;
    this.encryptionToggle = document.getElementById('encryption-toggle') as HTMLInputElement;
    this.shareKeyInput = document.getElementById('share-key-input') as HTMLInputElement;
    this.shareKeyError = document.getElementById('share-key-error') as HTMLParagraphElement;
    this.shareCopyLabel = document.getElementById('share-copy-label') as HTMLSpanElement;
    this.shareBtn = document.getElementById('share-btn') as HTMLButtonElement;
    this.shareWhatsAppBtn = document.getElementById('share-whatsapp-btn') as HTMLAnchorElement;
    this.shareEmailBtn = document.getElementById('share-email-btn') as HTMLAnchorElement;
    this.shareCopyBtn = document.getElementById('share-copy-btn') as HTMLAnchorElement;

    this.editorErrorMsg = document.getElementById('editor-error-msg') as HTMLParagraphElement;

    this.isEncryptionEnabled = !this.encryptionToggle?.checked ? false : true;

    this.updatePasswordInputState();
    this.updateShareButtonsState();

    if (this.encryptionToggle) {
      this.encryptionToggle.addEventListener('change', () => {
        this.isEncryptionEnabled = this.encryptionToggle.checked;
        this.updatePasswordInputState();
        this.updateShareButtonsState();
      });
    }

    this.shareKeyInput.addEventListener('input', () => {
      this.updateShareButtonsState();
    });

    this.shareWhatsAppBtn.addEventListener('click', (e) => {
      e.preventDefault();
      this.handleShareWhatsApp();
    });

    this.shareEmailBtn.addEventListener('click', (e) => {
      e.preventDefault();
      this.handleShareEmail();
    });

    this.shareCopyBtn.addEventListener('click', (e) => {
      e.preventDefault();
      this.handleShareCopy();
    });

    const dockBoldBtn = document.getElementById('dock-bold');
    const dockItalicBtn = document.getElementById('dock-italic');

    dockBoldBtn?.addEventListener('click', () => {
      this.formatBold();
    });

    dockItalicBtn?.addEventListener('click', () => {
      this.formatItalic();
    });

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
              if (wordCountEl) wordCountEl.textContent = `${words}p`;
              if (charCountEl) charCountEl.textContent = `${chars}c`;
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
      const target = e.target as HTMLElement;
      if (target.closest('#share-modal') || target.closest('#share-key-input')) {
        return;
      }
      if (this.editorView && !this.editorView.dom.contains(e.target as Node)) {
        this.editorView.focus();
      }
    });

    this.shareBtn.addEventListener('click', () => {
      this.openShareModal();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.shareModal.classList.contains('is-active')) {
        this.shareModal.classList.remove('is-active');
      }
    });

    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.id === 'share-modal') {
        this.shareModal.classList.remove('is-active');
      }
    });

    const dockTitleBtn = document.getElementById('dock-title');
    const headingSubmenu = document.getElementById('heading-submenu');

    dockTitleBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      headingSubmenu?.classList.toggle('is-open');
    });

    headingSubmenu?.querySelectorAll('.heading-submenu-item').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget as HTMLElement;
        const level = target.dataset.level;
        if (level) {
          this.formatLineCommand(level);
        }
        headingSubmenu.classList.remove('is-open');
      });
    });

    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.dock-heading-dropdown')) {
        headingSubmenu?.classList.remove('is-open');
      }
    });

    createIcons({ icons: { X, MessageCircle, Mail, Copy, Share2, Heading, Heading1, Heading2, Heading3, Heading4, Heading5, Heading6 } });
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

    for (const cmd of [...commands].sort((a, b) => a.start - b.start)) {
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

    const dateResults = this.dateMatcher.match(doc) as Replacement[];
    if (dateResults.length > 0) {
      console.log('[Pattern] Dates found:', dateResults.map(r => doc.substring(r.start, r.end)));
    }
    for (const date of dateResults) {
      builder.add(date.start, date.end, Decoration.mark({
        class: 'cmd-date',
        attributes: { 'data-date': doc.substring(date.start, date.end) }
      }));
    }

    const phoneResults = this.phoneMatcher.match(doc) as Replacement[];
    if (phoneResults.length > 0) {
      console.log('[Pattern] Phones found:', phoneResults.map(r => doc.substring(r.start, r.end)));
    }
    for (const phone of phoneResults) {
      builder.add(phone.start, phone.end, Decoration.mark({
        class: 'cmd-phone',
        attributes: { 'data-phone': doc.substring(phone.start, phone.end) }
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

  private openShareModal(): void {
    this.shareKeyInput.value = '';
    this.shareKeyError.style.display = 'none';
    this.shareCopyLabel.textContent = '';
    this.updatePasswordInputState();
    this.updateShareButtonsState();
    this.shareModal.classList.add('is-active');
    setTimeout(() => {
      if (this.isEncryptionEnabled) {
        this.shareKeyInput.focus();
      }
    }, 50);
  }

  private updatePasswordInputState(): void {
    if (this.isEncryptionEnabled) {
      this.shareKeyInput.removeAttribute('disabled');
    } else {
      this.shareKeyInput.setAttribute('disabled', 'true');
    }
  }

  private updateShareButtonsState(): void {
    const passphrase = this.shareKeyInput?.value || '';
    const isDisabled = this.isEncryptionEnabled && !passphrase.trim();
    
    if (this.shareWhatsAppBtn) {
      this.shareWhatsAppBtn.style.pointerEvents = isDisabled ? 'none' : 'auto';
      this.shareWhatsAppBtn.style.opacity = isDisabled ? '0.5' : '1';
    }
    if (this.shareEmailBtn) {
      this.shareEmailBtn.style.pointerEvents = isDisabled ? 'none' : 'auto';
      this.shareEmailBtn.style.opacity = isDisabled ? '0.5' : '1';
    }
    if (this.shareCopyBtn) {
      this.shareCopyBtn.style.pointerEvents = isDisabled ? 'none' : 'auto';
      this.shareCopyBtn.style.opacity = isDisabled ? '0.5' : '1';
    }
    
    if (this.shareKeyInput) {
      if (this.isEncryptionEnabled) {
        this.shareKeyInput.removeAttribute('disabled');
        this.shareKeyInput.classList.toggle('input-disabled', !passphrase.trim());
      } else {
        this.shareKeyInput.setAttribute('disabled', 'true');
        this.shareKeyInput.classList.remove('input-disabled');
      }
    }
  }

  private async generateShareableUrl(): Promise<string> {
    const editorText = this.getEditorText();

    if (!editorText.trim()) {
      throw new Error('No hay contenido para compartir.');
    }

    const plaintext = removePassCommand(editorText);
    const origin = window.location.origin;

    if (!this.isEncryptionEnabled) {
      const compressed = compressToUrlSafe(plaintext);
      return origin + '/read?d=' + encodeURIComponent(compressed);
    }

    const passphrase = this.shareKeyInput.value;
    if (!passphrase) {
      throw new Error('La palabra secreta no puede estar vacía.');
    }

    const compressed = compressToUrlSafe(plaintext);
    const ciphertext = await encrypt(compressed, passphrase);
    return origin + '/read?c=' + encodeURIComponent(ciphertext);
  }

  private async handleShareWhatsApp(): Promise<void> {
    const passphrase = this.shareKeyInput.value;
    if (this.isEncryptionEnabled && !passphrase) {
      this.shareKeyError.style.display = 'block';
      return;
    }

    try {
      const link = await this.generateShareableUrl();
      const message = `Hola!, Te comparto esta carta: ${link}`;
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    } catch (err) {
      if (err instanceof Error && err.message === 'No hay contenido para compartir.') {
        this.showEditorError(err.message);
        this.shareModal.classList.remove('is-active');
      } else {
        console.error('Share error:', err);
      }
    }
  }

  private async handleShareEmail(): Promise<void> {
    const passphrase = this.shareKeyInput.value;
    if (this.isEncryptionEnabled && !passphrase) {
      this.shareKeyError.style.display = 'block';
      return;
    }

    try {
      const link = await this.generateShareableUrl();
      const subject = 'Carta compartida';
      const body = `Hola!, Te comparto esta carta: ${link}`;
      const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.open(mailtoUrl, '_blank');
    } catch (err) {
      if (err instanceof Error && err.message === 'No hay contenido para compartir.') {
        this.showEditorError(err.message);
        this.shareModal.classList.remove('is-active');
      } else {
        console.error('Share error:', err);
      }
    }
  }

  private async handleShareCopy(): Promise<void> {
    const passphrase = this.shareKeyInput.value;
    if (this.isEncryptionEnabled && !passphrase) {
      this.shareKeyError.style.display = 'block';
      return;
    }

    try {
      const link = await this.generateShareableUrl();
      await navigator.clipboard.writeText(link);
      this.shareCopyLabel.textContent = '¡Copiado!';
      setTimeout(() => {
        this.shareCopyLabel.textContent = '';
      }, 1500);
    } catch (err) {
      if (err instanceof Error && err.message === 'No hay contenido para compartir.') {
        this.showEditorError(err.message);
        this.shareModal.classList.remove('is-active');
      } else {
        console.error('Share error:', err);
      }
    }
  }

  private showEditorError(message: string): void {
    this.editorErrorMsg.textContent = message;
    this.editorErrorMsg.style.display = 'block';
  }

  private hideEditorError(): void {
    this.editorErrorMsg.style.display = 'none';
    this.editorErrorMsg.textContent = '';
  }

  public formatBold(): void {
    if (!this.editorView) return;
    const selection = this.editorView.state.selection.main;
    const selectedText = this.editorView.state.sliceDoc(selection.from, selection.to);

    if (selectedText) {
      this.editorView.dispatch({
        changes: { from: selection.from, to: selection.to, insert: `$bold$${selectedText}$` }
      });
    } else {
      this.editorView.dispatch({
        changes: { from: selection.from, insert: '$bold$$' }
      });
      this.editorView.dispatch({
        selection: { anchor: selection.from + 6 }
      });
    }
  }

  public formatItalic(): void {
    if (!this.editorView) return;
    const selection = this.editorView.state.selection.main;
    const selectedText = this.editorView.state.sliceDoc(selection.from, selection.to);

    if (selectedText) {
      this.editorView.dispatch({
        changes: { from: selection.from, to: selection.to, insert: `$italic$${selectedText}$` }
      });
    } else {
      this.editorView.dispatch({
        changes: { from: selection.from, insert: '$italic$$' }
      });
      this.editorView.dispatch({
        selection: { anchor: selection.from + 8 }
      });
    }
  }

  public formatLineCommand(level: string): void {
    if (!this.editorView) return;
    const selection = this.editorView.state.selection.main;
    const currentLine = this.editorView.state.doc.lineAt(selection.from);
    const lineText = currentLine.text;

    const titleRegex = /^\$title(?::\d+)?\$\n?/;
    const match = lineText.match(titleRegex);

    if (match) {
      this.editorView.dispatch({
        changes: { from: currentLine.from, to: currentLine.from + match[0].length, insert: '' }
      });
    } else {
      const insertedText = level === "1" ? `$title$ ` : `$title:${level}$ `;
      this.editorView.dispatch({
        changes: { from: currentLine.from, insert: insertedText }
      });
      this.editorView.dispatch({
        selection: { anchor: currentLine.from + insertedText.length }
      });
    }
  }
}