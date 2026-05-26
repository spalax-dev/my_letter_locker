/**
 * LetterHistory — manages the history of read letters in localStorage.
 *
 * Each entry stores the ciphertext (or plaintext if not encrypted)
 * along with the read date and a unique id.
 */

export interface LetterEntry {
  id: string;
  ciphertext: string;       // encrypted content (Base64url) or plaintext
  receivedAt: string;       // ISO 8601
}

const HISTORY_KEY = 'letterlocker:history';
const MAX_ENTRIES = 50;

export function getHistory(): LetterEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as LetterEntry[]) : [];
  } catch {
    return [];
  }
}

/** Adds a letter to history (most recent first, no duplicates) */
export function addToHistory(ciphertext: string): LetterEntry {
  const history = getHistory();

  const existing = history.find(e => e.ciphertext === ciphertext);
  if (existing) {
    const updated = { ...existing, receivedAt: new Date().toISOString() };
    const filtered = history.filter(e => e.ciphertext !== ciphertext);
    const next = [updated, ...filtered].slice(0, MAX_ENTRIES);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
    return updated;
  }

  const entry: LetterEntry = {
    id: crypto.randomUUID(),
    ciphertext,
    receivedAt: new Date().toISOString(),
  };

  const next = [entry, ...history].slice(0, MAX_ENTRIES);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  return entry;
}

export function removeFromHistory(id: string): void {
  const history = getHistory().filter(e => e.id !== id);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
