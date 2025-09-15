'use client';

/**
 * Normalize an ingredient name for matching.
 * - Trim whitespace
 * - Lowercase
 * - Collapse multiple spaces
 * - Strip simple plural 's' where appropriate (e.g., eggs -> egg),
 *   but avoid removing 's' from words ending with 'ss' (e.g., 'glass').
 * - Strip punctuation like commas/periods
 */
export function normalizeIngredientName(raw: string): string {
  const trimmed = (raw || '').trim().toLowerCase();
  if (!trimmed) return '';
  let s = trimmed
    .replace(/[.,]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  // Simple plural handling: if ends with 's' but not 'ss', drop trailing 's'
  if (s.endsWith('s') && !s.endsWith('ss')) {
    s = s.slice(0, -1);
  }
  return s;
}

/**
 * Build a Set of normalized names for fast membership tests.
 */
export function buildNormalizedNameSet(names: string[]): Set<string> {
  const set = new Set<string>();
  for (const name of names) {
    const n = normalizeIngredientName(name);
    if (n) set.add(n);
  }
  return set;
}

/**
 * Return names from required[] that are not present in available[] after normalization.
 */
export function diffMissingNormalized(required: string[], available: string[]): string[] {
  const avail = buildNormalizedNameSet(available);
  const missing: string[] = [];
  for (const r of required) {
    const n = normalizeIngredientName(r);
    if (!n) continue;
    if (!avail.has(n)) missing.push(r);
  }
  return missing;
}


