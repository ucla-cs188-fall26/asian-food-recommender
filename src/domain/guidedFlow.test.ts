import { expect, test } from 'vitest'
import { createFilterState } from './filters'
import { guideReducer, guidedCandidates, INITIAL_GUIDE } from './guidedFlow'
import type { GuideState } from './guidedFlow'
import type { Recipe } from './types'
import { SAMPLE_RECIPES } from '../data/sampleRecipes'

const filters = createFilterState({ cuisines: ['Korean'], ingredients: ['tofu'], equipment: ['stove'], maxDifficulty: 1 })
const base: Recipe = {
  id: 1, name: 'Ready tofu', cuisine: 'Korean', source: 'sample', difficulty: 1,
  requiredIngredients: ['tofu'], optionalIngredients: [], substitutions: {}, stapleIngredients: [],
  ingredientLines: [], requiredEquipment: ['stove'], steps: [],
}
const recipes: Recipe[] = [base,
  { ...base, id: 2, requiredIngredients: ['tofu', 'potato'] },
  { ...base, id: 3, requiredEquipment: ['oven'] },
  { ...base, id: 4, difficulty: 2 },
  { ...base, id: 5, requiredEquipment: ['oven'], requiredIngredients: ['tofu', 'potato'] },
]
const noChanges = { ingredient: false, equipment: false, difficulty: false }

test('each permission admits only its own change and ready dishes remain first', () => {
  expect(guidedCandidates(recipes, filters, noChanges).map((e) => e.recipe.id)).toEqual([1])
  for (const [key, id] of [['ingredient', 2], ['equipment', 3], ['difficulty', 4]] as const) {
    expect(guidedCandidates(recipes, filters, { ...noChanges, [key]: true }).map((e) => e.recipe.id)).toEqual([1, id])
  }
})

test('allowing every kind of change still excludes recipes needing two changes', () => {
  const result = guidedCandidates(recipes, filters, { ingredient: true, equipment: true, difficulty: true })
  expect(result).toHaveLength(4)
  expect(result.every((e) => e.changesNeeded <= 1)).toBe(true)
  expect(guidedCandidates(recipes, filters, INITIAL_GUIDE.answers)).toEqual([])
})

test('backtracking preserves answers and changing an answer changes eligible recipes', () => {
  let state: GuideState = INITIAL_GUIDE
  expect(guideReducer(state, { type: 'next' }).step).toBe(0)
  for (let step = 0; step < 3; step++) {
    state = guideReducer(state, { type: 'answer', value: false })
    state = guideReducer(state, { type: 'next' })
  }
  expect(state.step).toBe(3)
  state = guideReducer(state, { type: 'alternatives' })
  expect(state.showAlternatives).toBe(true)
  state = guideReducer(state, { type: 'edit' })
  expect(state.answers).toEqual(noChanges)
  expect(state.showAlternatives).toBe(false)
  state = guideReducer(state, { type: 'answer', value: true })
  expect(guidedCandidates(recipes, filters, state.answers).map((e) => e.recipe.id)).toEqual([1, 2])
  state = guideReducer(state, { type: 'next' })
  state = guideReducer(state, { type: 'back' })
  expect(state.answers.ingredient).toBe(true)
  expect(guideReducer(state, { type: 'restart' })).toEqual(INITIAL_GUIDE)
  expect(INITIAL_GUIDE.answers.ingredient).toBeNull()
})

test('no matching recipe returns an empty result instead of relaxing answers', () => {
  expect(guidedCandidates(recipes.slice(1), filters, noChanges)).toEqual([])
})

test('the documented Korean walkthrough recommends Dubu Jorim only when adding an ingredient is allowed', () => {
  const kitchen = createFilterState({ ...filters, ingredients: ['tofu', 'egg', 'soy sauce', 'garlic'] })
  const allowed = guidedCandidates(SAMPLE_RECIPES, kitchen, { ...noChanges, ingredient: true })
  expect(allowed[0].recipe.name).toContain('Dubu Jorim')
  expect(allowed[0].missingIngredients).toEqual(['potato'])
  const denied = guidedCandidates(SAMPLE_RECIPES, kitchen, noChanges)
  expect(denied.some((e) => e.recipe.id === allowed[0].recipe.id)).toBe(false)
})
