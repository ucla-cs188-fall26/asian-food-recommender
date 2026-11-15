import { expect, test } from 'vitest'
import { normalizeList, normalizeName } from './normalize'

test('normalizeName ignores case and extra spaces', () => {
  expect(normalizeName('  Soy   Sauce ')).toBe('soy sauce')
})

test('normalizeList drops blanks and duplicates, keeping order', () => {
  expect(normalizeList(['Tofu', ' tofu', '', 'EGG', '  '])).toEqual([
    'tofu',
    'egg',
  ])
})
