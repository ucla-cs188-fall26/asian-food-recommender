import { expect, it } from 'vitest'
import { SAMPLE_RECIPES } from '../data/sampleRecipes'
import { createFilterState, DEFAULT_FILTERS } from './filters'
import { evaluate, rank, topRecipes } from './scoring'
import type { Recipe } from './types'

const state = createFilterState({ ...DEFAULT_FILTERS, cuisines: ['Chinese'], ingredients: ['egg', 'tomato', 'scallion'] })
const recipe: Recipe = { id: 100, name: 'Fixture', cuisine: 'Chinese', source: 'sample', difficulty: 1, requiredIngredients: ['tofu'], optionalIngredients: ['ginger'], stapleIngredients: ['salt'], substitutions: { tofu: ['egg', 'tomato'] }, requiredEquipment: ['stove'], ingredientLines: [], steps: [] }

it('ranks the makeable tomato and egg sample first', () => {
  const first = rank(SAMPLE_RECIPES, state)[0]
  expect(first.recipe.name).toBe('Tomato and Egg Stir-Fry')
  expect(first.makeable).toBe(true)
  expect(first.score).toBe(100)
  expect(topRecipes(SAMPLE_RECIPES, state)).toHaveLength(3)
})
it('uses the first owned substitute for half ingredient credit', () => {
  const result = evaluate(recipe, state)!
  expect(result.score).toBe(65)
  expect(result.substituted).toEqual([{ ingredient: 'tofu', using: 'egg' }])
  expect(result.reasons).toEqual(['Uses 0 of 1 required ingredients you have', 'Swap in egg for tofu', 'You can make this now'])
})
it('excludes unselected cuisines and counts every blocker', () => {
  expect(evaluate({ ...recipe, cuisine: 'Thai' }, state)).toBeUndefined()
  const result = evaluate({ ...recipe, difficulty: 3, requiredEquipment: ['oven'], substitutions: {} }, state)!
  expect(result.changesNeeded).toBe(4)
  expect(result.makeable).toBe(false)
  expect(result.reasons).not.toContain('You can make this now')
})
it('has a deterministic name and id tie break', () => {
  const recipes = [recipe, { ...recipe, id: 102, name: 'Apple' }, { ...recipe, id: 99 }]
  expect(rank(recipes, state).map((e) => e.recipe.id)).toEqual([102, 99, 100])
  expect(rank([...recipes].reverse(), state)).toEqual(rank(recipes, state))
})
it('awards full ingredient credit when none are required', () => {
  expect(evaluate({ ...recipe, requiredIngredients: [], requiredEquipment: [] }, state)?.score).toBe(100)
})
