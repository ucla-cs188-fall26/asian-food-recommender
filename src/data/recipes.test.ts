import { beforeEach, expect, test, vi } from 'vitest'
import { canonicalIngredient } from '../domain/ingredients'
import { isStaple } from '../domain/kitchen'
import { CUISINES, EQUIPMENT } from '../domain/types'
import { getRecipes, sampleRecipesFor } from './recipes'
import { SAMPLE_RECIPES } from './sampleRecipes'
import { clearSessionCache } from './spoonacular'

beforeEach(() => clearSessionCache())

test('there are at least 15 sample recipes covering every cuisine', () => {
  expect(SAMPLE_RECIPES.length).toBeGreaterThanOrEqual(15)
  for (const cuisine of CUISINES) {
    expect(sampleRecipesFor([cuisine]).length).toBeGreaterThanOrEqual(2)
  }
  expect(new Set(SAMPLE_RECIPES.map((r) => r.id)).size).toBe(SAMPLE_RECIPES.length)
})

test.each(SAMPLE_RECIPES)('$name is well formed', (recipe) => {
  expect(recipe.source).toBe('sample')
  expect(recipe.description).toBeTruthy()
  expect(recipe.requiredIngredients.length).toBeGreaterThan(0)
  expect(recipe.steps.length).toBeGreaterThanOrEqual(3)
  for (const step of recipe.steps) {
    expect(step.text.length).toBeGreaterThan(step.brief!.length)
  }
  for (const name of [...recipe.requiredIngredients, ...recipe.optionalIngredients]) {
    expect(canonicalIngredient(name)).toBe(name)
  }
  expect(recipe.requiredIngredients.some(isStaple)).toBe(false)
  for (const key of Object.keys(recipe.substitutions)) {
    expect(recipe.requiredIngredients).toContain(key)
  }
  for (const item of recipe.requiredEquipment) expect(EQUIPMENT).toContain(item)
  const overlap = recipe.optionalIngredients.filter((n) =>
    recipe.requiredIngredients.includes(n),
  )
  expect(overlap).toEqual([])
})

test('getRecipes uses the samples when no API key is set', async () => {
  const fetchImpl = vi.fn()
  const load = await getRecipes(['Korean'], { apiKey: '', fetchImpl })
  expect(load.source).toBe('sample')
  expect(load.notice).toMatch(/API key/)
  expect(load.recipes.every((r) => r.cuisine === 'Korean')).toBe(true)
  expect(fetchImpl).not.toHaveBeenCalled()
})

test('getRecipes falls back to the samples and says why when the API fails', async () => {
  const fetchImpl = vi.fn(async () => new Response('{}', { status: 402 }))
  const load = await getRecipes(['Thai'], { apiKey: 'test-key', fetchImpl })
  expect(load.source).toBe('sample')
  expect(load.notice).toMatch(/quota/)
  expect(load.recipes.length).toBeGreaterThan(0)
})

test('getRecipes returns live recipes when the API answers', async () => {
  const body = {
    results: [
      {
        id: 5,
        title: 'Live Dish',
        cuisines: ['Thai'],
        extendedIngredients: [{ name: 'tofu' }],
        analyzedInstructions: [{ steps: [{ number: 1, step: 'Cook it.' }] }],
      },
    ],
  }
  const fetchImpl = vi.fn(async () => new Response(JSON.stringify(body)))
  const load = await getRecipes(['Thai'], { apiKey: 'test-key', fetchImpl })
  expect(load.source).toBe('spoonacular')
  expect(load.notice).toBeUndefined()
  expect(load.recipes.map((r) => r.name)).toEqual(['Live Dish'])
})
