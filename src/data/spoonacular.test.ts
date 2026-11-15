import { beforeEach, expect, test, vi } from 'vitest'
import {
  clearSessionCache,
  fetchCuisine,
  loadRecipes,
  SpoonacularError,
  toRecipe,
} from './spoonacular'
import type { SpoonacularRecipe } from './spoonacular'

/** Hand-written to match the documented response shape; not real API data. */
function sample(overrides: Partial<SpoonacularRecipe> = {}): SpoonacularRecipe {
  return {
    id: 1,
    title: ' Test Tofu Stir Fry ',
    readyInMinutes: 25,
    cuisines: ['Chinese', 'Asian'],
    sourceName: 'Example Kitchen',
    sourceUrl: 'https://example.com/tofu',
    extendedIngredients: [
      { name: 'firm tofu', nameClean: 'Tofu', original: '1 block firm tofu' },
      { name: 'eggs', nameClean: 'egg', original: '2 eggs' },
      { name: 'Soy  Sauce', original: '1 tbsp soy sauce' },
      { name: 'salt', original: 'pinch of salt' },
      { name: 'egg', original: '1 more egg' },
    ],
    analyzedInstructions: [
      {
        steps: [
          {
            number: 1,
            step: 'Whisk the eggs in a bowl.',
            equipment: [{ name: 'bowl' }, { name: 'whisk' }],
            ingredients: [{ name: 'egg' }],
          },
          {
            number: 2,
            step: 'Stir-fry the tofu in a wok.',
            equipment: [{ name: 'Wok' }],
            ingredients: [{ name: 'tofu' }],
            length: { number: 5, unit: 'minutes' },
          },
        ],
      },
    ],
    ...overrides,
  }
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status })
}

beforeEach(() => clearSessionCache())

test('toRecipe normalizes ingredients and separates pantry staples', () => {
  const recipe = toRecipe(sample(), 'Chinese')!
  expect(recipe.name).toBe('Test Tofu Stir Fry')
  expect(recipe.requiredIngredients).toEqual(['tofu', 'egg', 'soy sauce'])
  expect(recipe.stapleIngredients).toEqual(['salt'])
  expect(recipe.ingredientLines).toHaveLength(5)
})

test('toRecipe maps cooking tools to filterable equipment and ignores small tools', () => {
  const recipe = toRecipe(sample(), 'Chinese')!
  expect(recipe.requiredEquipment).toEqual(['stove'])
  expect(recipe.steps[0].tools).toEqual(['bowl', 'whisk'])
  expect(recipe.steps[1].minutes).toBe(5)
})

test('toRecipe derives difficulty from ingredients and steps, not time', () => {
  expect(toRecipe(sample(), 'Chinese')!.difficulty).toBe(1)
  const slow = toRecipe(sample({ readyInMinutes: 400 }), 'Chinese')!
  expect(slow.difficulty).toBe(1)
  expect(slow.listedMinutes).toBe(400)
  expect(toRecipe(sample({ readyInMinutes: 0 }), 'Chinese')!.listedMinutes).toBeUndefined()
})

test('toRecipe rejects recipes it cannot score honestly', () => {
  expect(toRecipe(sample({ cuisines: ['Italian'] }), 'Chinese')).toBeUndefined()
  expect(toRecipe(sample({ analyzedInstructions: [] }), 'Chinese')).toBeUndefined()
  expect(
    toRecipe(sample({ extendedIngredients: [{ name: 'water' }] }), 'Chinese'),
  ).toBeUndefined()
})

test('toRecipe merges ingredient spellings and drops non-meals', () => {
  const recipe = toRecipe(
    sample({
      extendedIngredients: [
        { name: 'green onions' },
        { name: 'scallion' },
        { name: 'garlic cloves' },
      ],
    }),
    'Chinese',
  )!
  expect(recipe.requiredIngredients).toEqual(['scallion', 'garlic'])
  expect(toRecipe(sample({ dishTypes: ['dessert'] }), 'Chinese')).toBeUndefined()
  expect(toRecipe(sample({ dishTypes: ['sauce', 'dip'] }), 'Chinese')).toBeUndefined()
  expect(toRecipe(sample({ dishTypes: ['lunch', 'soup'] }), 'Chinese')).toBeDefined()
})

test('fetchCuisine requests details and instructions for one cuisine', async () => {
  const fetchImpl = vi.fn(async (_input: RequestInfo | URL) =>
    jsonResponse({ results: [sample()] }),
  )
  const recipes = await fetchCuisine('Chinese', { apiKey: 'test-key', fetchImpl })
  expect(recipes).toHaveLength(1)
  const url = new URL(String(fetchImpl.mock.calls[0][0]))
  expect(url.pathname).toBe('/recipes/complexSearch')
  expect(url.searchParams.get('cuisine')).toBe('Chinese')
  expect(url.searchParams.get('addRecipeInstructions')).toBe('true')
  expect(url.searchParams.get('apiKey')).toBe('test-key')
})

test('fetchCuisine explains an exhausted quota', async () => {
  const fetchImpl = vi.fn(async () => jsonResponse({}, 402))
  const attempt = fetchCuisine('Thai', { apiKey: 'test-key', fetchImpl })
  await expect(attempt).rejects.toBeInstanceOf(SpoonacularError)
  await expect(attempt).rejects.toThrow(/quota/)
})

test('loadRecipes fetches each cuisine once per session and removes duplicates', async () => {
  const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
    const cuisine = new URL(String(input)).searchParams.get('cuisine')!
    const ownId = cuisine === 'Thai' ? 40 : 70
    return jsonResponse({
      results: [
        sample({ id: 7, cuisines: ['Chinese', 'Thai'] }),
        sample({ id: ownId, cuisines: [cuisine] }),
      ],
    })
  })
  const options = { apiKey: 'test-key', fetchImpl }
  const first = await loadRecipes(['Thai', 'Chinese'], options)
  expect(first.map((r) => r.id).sort((a, b) => a - b)).toEqual([7, 40, 70])
  await loadRecipes(['Chinese'], options)
  expect(fetchImpl).toHaveBeenCalledTimes(2)
})
