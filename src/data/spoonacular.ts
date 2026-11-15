import { deriveDifficulty } from '../domain/difficulty'
import { isStaple, toEquipment } from '../domain/kitchen'
import { canonicalIngredients } from '../domain/ingredients'
import { normalizeList, normalizeName } from '../domain/normalize'
import { CUISINES } from '../domain/types'
import type { Cuisine, Equipment, Recipe, RecipeStep } from '../domain/types'

/**
 * Spoonacular's terms forbid storing ingredients or instructions, so recipes
 * fetched here live only in memory for the current page session. Nothing is
 * written to localStorage, IndexedDB or the repo.
 */

const SEARCH_URL = 'https://api.spoonacular.com/recipes/complexSearch'
export const RECIPES_PER_CUISINE = 25

/** The subset of Spoonacular's recipe response that we read. */
export interface SpoonacularRecipe {
  id: number
  title: string
  image?: string
  readyInMinutes?: number
  cuisines?: string[]
  dishTypes?: string[]
  sourceName?: string
  sourceUrl?: string
  spoonacularSourceUrl?: string
  extendedIngredients?: {
    name: string
    nameClean?: string | null
    original?: string
  }[]
  analyzedInstructions?: {
    steps: {
      number: number
      step: string
      equipment?: { name: string }[]
      ingredients?: { name: string }[]
      length?: { number: number; unit: string }
    }[]
  }[]
}

export class SpoonacularError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'SpoonacularError'
    this.status = status
  }
}

function stepMinutes(length?: { number: number; unit: string }) {
  if (!length) return undefined
  return /hour/i.test(length.unit) ? length.number * 60 : length.number
}

/** Dish types that are not something you would cook for a meal. */
const NOT_A_MEAL = new Set([
  'dessert',
  'sauce',
  'condiment',
  'dip',
  'spread',
  'marinade',
  'beverage',
  'drink',
  'seasoning',
])

/** True unless every dish type the recipe is tagged with is a non-meal. */
function isMeal(dishTypes: string[] = []): boolean {
  if (dishTypes.length === 0) return true
  return dishTypes.some((t) => !NOT_A_MEAL.has(normalizeName(t)))
}

/**
 * Convert one Spoonacular recipe into our model. Returns undefined when the
 * recipe cannot be scored honestly: no usable ingredients or steps, not
 * tagged with the cuisine we asked for, or only a dessert, sauce or drink.
 */
export function toRecipe(
  raw: SpoonacularRecipe,
  requestedCuisine: Cuisine,
): Recipe | undefined {
  const tagged = (raw.cuisines ?? []).map(normalizeName)
  if (!tagged.includes(normalizeName(requestedCuisine))) return undefined

  if (!isMeal(raw.dishTypes)) return undefined

  const names = canonicalIngredients(
    (raw.extendedIngredients ?? []).map((i) => i.nameClean || i.name),
  )
  const requiredIngredients = names.filter((n) => !isStaple(n))
  if (requiredIngredients.length === 0) return undefined

  const steps: RecipeStep[] = (raw.analyzedInstructions ?? [])
    .flatMap((section) => section.steps)
    .map((s, index) => ({
      number: index + 1,
      text: s.step.trim(),
      tools: normalizeList((s.equipment ?? []).map((e) => e.name)),
      ingredients: canonicalIngredients((s.ingredients ?? []).map((i) => i.name)),
      minutes: stepMinutes(s.length),
    }))
  if (steps.length === 0) return undefined

  const equipment = new Set<Equipment>()
  for (const step of steps) {
    for (const tool of step.tools) {
      const mapped = toEquipment(tool)
      if (mapped) equipment.add(mapped)
    }
  }

  return {
    id: raw.id,
    name: raw.title.trim(),
    cuisine: requestedCuisine,
    source: 'spoonacular',
    listedMinutes:
      raw.readyInMinutes && raw.readyInMinutes > 0
        ? raw.readyInMinutes
        : undefined,
    difficulty: deriveDifficulty(names.length, steps.length),
    requiredIngredients,
    optionalIngredients: [],
    substitutions: {},
    stapleIngredients: names.filter(isStaple),
    ingredientLines: (raw.extendedIngredients ?? [])
      .map((i) => i.original?.trim() ?? i.name)
      .filter(Boolean),
    requiredEquipment: [...equipment].sort(),
    steps,
    imageUrl: raw.image,
    sourceName: raw.sourceName,
    sourceUrl: raw.sourceUrl ?? raw.spoonacularSourceUrl,
  }
}

function describeFailure(status: number): string {
  if (status === 401) return 'Spoonacular rejected the API key.'
  if (status === 402)
    return "Today's Spoonacular quota is used up. It resets at midnight UTC."
  if (status === 429) return 'Too many requests to Spoonacular. Try again shortly.'
  return `Spoonacular request failed (HTTP ${status}).`
}

export interface FetchOptions {
  apiKey: string
  signal?: AbortSignal
  fetchImpl?: typeof fetch
}

/** Fetch one cuisine's recipes with ingredients and step-by-step instructions. */
export async function fetchCuisine(
  cuisine: Cuisine,
  { apiKey, signal, fetchImpl = fetch }: FetchOptions,
): Promise<Recipe[]> {
  const params = new URLSearchParams({
    apiKey,
    cuisine,
    number: String(RECIPES_PER_CUISINE),
    instructionsRequired: 'true',
    addRecipeInformation: 'true',
    addRecipeInstructions: 'true',
    // Without this the search response has no ingredient list at all.
    fillIngredients: 'true',
    sort: 'popularity',
  })
  const response = await fetchImpl(`${SEARCH_URL}?${params}`, { signal })
  if (!response.ok) {
    throw new SpoonacularError(response.status, describeFailure(response.status))
  }
  const body = (await response.json()) as { results?: SpoonacularRecipe[] }
  return (body.results ?? []).flatMap((raw) => toRecipe(raw, cuisine) ?? [])
}

/** In-memory only, cleared on page reload. See the note at the top of this file. */
const sessionCache = new Map<Cuisine, Recipe[]>()

export function clearSessionCache() {
  sessionCache.clear()
}

/**
 * Load recipes for the given cuisines, one request at a time to respect the
 * free plan's rate limit. Cuisines already loaded this session cost nothing.
 */
export async function loadRecipes(
  cuisines: readonly Cuisine[],
  options: FetchOptions,
): Promise<Recipe[]> {
  const wanted = CUISINES.filter((c) => cuisines.includes(c))
  const byId = new Map<number, Recipe>()
  for (const cuisine of wanted) {
    let recipes = sessionCache.get(cuisine)
    if (!recipes) {
      recipes = await fetchCuisine(cuisine, options)
      sessionCache.set(cuisine, recipes)
    }
    for (const recipe of recipes) {
      if (!byId.has(recipe.id)) byId.set(recipe.id, recipe)
    }
  }
  return [...byId.values()]
}

export function getApiKey(): string | undefined {
  return import.meta.env?.VITE_SPOONACULAR_API_KEY || undefined
}
