import { expect, it } from 'vitest'
import { SAMPLE_RECIPES } from '../data/sampleRecipes'
import { applyChange, suggestChanges } from './branches'
import { createFilterState, DEFAULT_FILTERS, filterStateId } from './filters'
import type { Recipe } from './types'

const state = createFilterState({ cuisines: ['Korean'], ingredients: ['tofu', 'egg', 'soy sauce', 'garlic'], equipment: ['stove'], maxDifficulty: 1 })
const fixture: Recipe = { id: 100, name: 'Fixture', cuisine: 'Korean', source: 'sample', difficulty: 1, requiredIngredients: [], optionalIngredients: [], stapleIngredients: [], substitutions: {}, requiredEquipment: ['oven'], ingredientLines: [], steps: [] }

it('reveals the braised tofu recipe by adding potato', () => {
  const suggestion = suggestChanges(SAMPLE_RECIPES, state).find((s) => s.label === 'Add potato')
  expect(suggestion?.newlyMakeable.map((r) => r.name)).toContain('Dubu Jorim (Braised Tofu with Egg and Potato)')
})
it('suggests equipment and only one difficulty level', () => {
  expect(suggestChanges([fixture], state)[0].label).toBe('Use oven')
  expect(suggestChanges([{ ...fixture, requiredEquipment: [], difficulty: 2 }], state)[0].label).toBe('Try medium recipes')
  expect(suggestChanges([{ ...fixture, requiredEquipment: [], difficulty: 3 }], state)).toEqual([])
})
it('changes exactly one field and produces unique new states', () => {
  const suggestions = suggestChanges(SAMPLE_RECIPES, DEFAULT_FILTERS)
  expect(suggestions.length).toBeGreaterThan(0)
  expect(new Set(suggestions.map((s) => s.childId)).size).toBe(suggestions.length)
  for (const s of suggestions) {
    expect(s.childId).not.toBe(filterStateId(DEFAULT_FILTERS))
    expect(Object.keys(DEFAULT_FILTERS).filter((key) => JSON.stringify(DEFAULT_FILTERS[key as keyof typeof DEFAULT_FILTERS]) !== JSON.stringify(s.childState[key as keyof typeof DEFAULT_FILTERS]))).toHaveLength(1)
  }
})
it('returns no branches when nothing helps and canonicalizes changes', () => {
  expect(suggestChanges([], state)).toEqual([])
  expect(suggestChanges([fixture], state, 0)).toEqual([])
  expect(applyChange(state, { kind: 'add-ingredient', ingredient: 'Green Onions' }).ingredients).toContain('scallion')
})
it('discards improvements that reveal neither a ready recipe nor a top recipe', () => {
  expect(suggestChanges([{ ...fixture, requiredIngredients: ['potato', 'tomato'] }], state)).toEqual([])
})
