/**
 * LetterHistory — gestión del historial de cartas leídas en localStorage.
 *
 * Cada entrada almacena el ciphertext (o texto plano si no estaba cifrada)
 * junto con la fecha de lectura y un id único.
 */

export interface LetterEntry {
  id: string;
  ciphertext: string;       // contenido cifrado (Base64url) o texto plano
  receivedAt: string;       // ISO 8601
}

const HISTORY_KEY = 'letterlocker:history';
const MAX_ENTRIES = 50;

/** Lee el historial completo desde localStorage */
export function getHistory(): LetterEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as LetterEntry[]) : [];
  } catch {
    return [];
  }
}

/** Añade una carta al historial (más reciente primero, sin duplicados) */
export function addToHistory(ciphertext: string): LetterEntry {
  const history = getHistory();

  // Evitar duplicados exactos
  const existing = history.find(e => e.ciphertext === ciphertext);
  if (existing) {
    // Mover al frente actualizando la fecha
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

/** Elimina una entrada del historial por id */
export function removeFromHistory(id: string): void {
  const history = getHistory().filter(e => e.id !== id);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

/** Formatea una fecha ISO para mostrar al usuario */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
