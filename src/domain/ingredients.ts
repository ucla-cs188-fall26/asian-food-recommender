import { normalizeName } from './normalize'

/**
 * Recipe sources name the same ingredient many ways ("green onions",
 * "scallion", "spring onion"). canonicalIngredient() maps those to one name so
 * a user who has scallions matches every spelling. It is purely name-based, so
 * the same input always gives the same result.
 */

/** Words that describe form or quantity, not what the ingredient is. */
const DESCRIPTORS = new Set([
  'fresh',
  'freshly',
  'chopped',
  'minced',
  'sliced',
  'diced',
  'grated',
  'ground',
  'large',
  'small',
  'medium',
  'block',
  'of',
  'clove',
  'root',
  'little',
  'sprinkle',
  'additional',
  'each:',
])

/** Ground meats and spices are different products, so keep "ground" there. */
const KEEP_GROUND = /^ground (beef|pork|chicken|turkey|lamb|pepper)/

const ALIASES: Record<string, string> = {
  'green onion': 'scallion',
  'spring onion': 'scallion',
  'soya sauce': 'soy sauce',
  'japanese soy sauce': 'soy sauce',
  'light soy sauce': 'soy sauce',
  'corn starch': 'cornstarch',
  cornflour: 'cornstarch',
  'rice wine vinegar': 'rice vinegar',
  'asian sesame oil': 'sesame oil',
  'toasted sesame oil': 'sesame oil',
  'won ton wrapper': 'wonton wrapper',
  'kochujang chili paste': 'gochujang',
  'salt and pepper': 'salt',
  'salt & pepper': 'salt',
  'salt/pepper': 'salt',
  'panko bread crumb': 'panko',
  'panko breadcrumb': 'panko',
  'cilantro leaf': 'cilantro',
  'stock chicken': 'chicken broth',
  'chicken stock': 'chicken broth',
  'vegetable stock': 'vegetable broth',
}

function singular(word: string): string {
  if (word.length <= 3 || /(ss|us|is)$/.test(word)) return word
  if (word.endsWith('ies')) return `${word.slice(0, -3)}y`
  if (word === 'leaves') return 'leaf'
  if (word.endsWith('oes')) return word.slice(0, -2)
  return word.endsWith('s') ? word.slice(0, -1) : word
}

export function canonicalIngredient(name: string): string {
  const normalized = normalizeName(name)
  const words = normalized.split(' ').map(singular)
  const keepGround = KEEP_GROUND.test(words.join(' '))
  const kept = words.filter(
    (w) => !DESCRIPTORS.has(w) || (w === 'ground' && keepGround),
  )
  const base = (kept.length > 0 ? kept : words).join(' ')
  return ALIASES[base] ?? base
}

/** Canonicalize every name, dropping blanks and duplicates, keeping order. */
export function canonicalIngredients(names: Iterable<string>): string[] {
  const seen = new Set<string>()
  for (const name of names) {
    const canonical = canonicalIngredient(name)
    if (canonical) seen.add(canonical)
  }
  return [...seen]
}
