import { expect, test } from 'vitest'
import { createFilterState } from './filters'
import { guideReducer, guidedCandidates, INITIAL_GUIDE } from './guidedFlow'
import type { GuideState } from './guidedFlow'
import type { Recipe } from './types'
import { SAMPLE_RECIPES } from '../data/sampleRecipes'
import { requiredChange } from './discovery'

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

test('answers prioritize similar matches without hiding recipes and ready dishes remain first', () => {
  expect(guidedCandidates(recipes, filters, noChanges)).toHaveLength(recipes.length)
  for (const [key, id] of [['ingredient', 2], ['equipment', 3], ['difficulty', 4]] as const) {
    const result = guidedCandidates(recipes, filters, { ...noChanges, [key]: true })
    expect(result.slice(0, 2).map((e) => e.recipe.id)).toEqual([1, id])
    expect(result).toHaveLength(recipes.length)
  }
})

test('recipes needing multiple changes remain available and sort after closer recipes', () => {
  const result = guidedCandidates(recipes, filters, { ingredient: true, equipment: true, difficulty: true })
  expect(result).toHaveLength(5)
  expect(result.at(-1)?.recipe.id).toBe(5)
  expect(requiredChange(result.at(-1)!)).toBe('Add potato; Use oven.')
  expect(guidedCandidates(recipes, filters, INITIAL_GUIDE.answers)).toEqual([])
})

test('backtracking preserves answers and changing an answer reprioritizes recipes', () => {
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
  expect(guidedCandidates(recipes, filters, state.answers).slice(0, 2).map((e) => e.recipe.id)).toEqual([1, 2])
  state = guideReducer(state, { type: 'next' })
  state = guideReducer(state, { type: 'back' })
  expect(state.answers.ingredient).toBe(true)
  expect(guideReducer(state, { type: 'restart' })).toEqual(INITIAL_GUIDE)
  expect(INITIAL_GUIDE.answers.ingredient).toBeNull()
})

test('missing ingredients never block suggestions, even with all answers set to no', () => {
  const kitchen = createFilterState({ ...filters, ingredients: [] })
  const result = guidedCandidates(recipes, kitchen, noChanges)
  expect(result).toHaveLength(recipes.length)
  expect(result[0].recipe.id).toBe(1)
  expect(result[0].missingIngredients).toEqual(['tofu'])
  expect(guidedCandidates([], kitchen, noChanges)).toEqual([])
  expect(guidedCandidates([{ ...base, cuisine: 'Japanese' }], kitchen, noChanges)).toEqual([])
})

test('the documented Korean walkthrough keeps Dubu Jorim visible regardless of ingredient preference', () => {
  const kitchen = createFilterState({ ...filters, ingredients: ['tofu', 'egg', 'soy sauce', 'garlic'] })
  const allowed = guidedCandidates(SAMPLE_RECIPES, kitchen, { ...noChanges, ingredient: true })
  expect(allowed[0].recipe.name).toContain('Dubu Jorim')
  expect(allowed[0].missingIngredients).toEqual(['potato'])
  const denied = guidedCandidates(SAMPLE_RECIPES, kitchen, noChanges)
  expect(denied.some((e) => e.recipe.id === allowed[0].recipe.id)).toBe(true)
})

test('fewest changes outranks a higher compatibility score or preferred change type', () => {
  const easyToComplete = { ...base, id: 10, requiredIngredients: ['egg'] }
  const highScore = { ...base, id: 11, requiredIngredients: ['tofu'], requiredEquipment: ['oven'] as Recipe['requiredEquipment'], difficulty: 2 as const }
  const result = guidedCandidates([highScore, easyToComplete], filters, { ingredient: false, equipment: true, difficulty: true })
  expect(result.map((e) => e.recipe.id)).toEqual([10, 11])
  expect(result[0].score).toBeLessThan(result[1].score)
})
