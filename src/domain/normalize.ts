/** Lowercase, trim and collapse whitespace so "  Soy  Sauce" matches "soy sauce". */
export function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ')
}

/** Normalize every name, dropping blanks and duplicates while keeping first-seen order. */
export function normalizeList(names: Iterable<string>): string[] {
  const seen = new Set<string>()
  for (const name of names) {
    const normalized = normalizeName(name)
    if (normalized) seen.add(normalized)
  }
  return [...seen]
}
