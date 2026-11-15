import { expect, test } from 'vitest'
import { canonicalIngredient, canonicalIngredients } from './ingredients'

test.each([
  ['Green Onions', 'scallion'],
  ['spring onion', 'scallion'],
  ['scallions', 'scallion'],
  ['garlic cloves', 'garlic'],
  ['ginger root', 'ginger'],
  ['soya sauce', 'soy sauce'],
  ['corn starch', 'cornstarch'],
  ['block of tofu', 'tofu'],
  ['Eggs', 'egg'],
  ['potatoes', 'potato'],
  ['chicken breasts', 'chicken breast'],
  ['little cornstarch', 'cornstarch'],
  ['ground beef', 'ground beef'],
  ['ground ginger', 'ginger'],
  ['lemongrass', 'lemongrass'],
  ['salt & pepper', 'salt'],
])('%s -> %s', (input, expected) => {
  expect(canonicalIngredient(input)).toBe(expected)
})

test('canonicalIngredients merges different spellings into one entry', () => {
  expect(
    canonicalIngredients(['scallions', 'green onion', ' Tofu ', '']),
  ).toEqual(['scallion', 'tofu'])
})
