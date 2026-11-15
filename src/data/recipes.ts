import type { Cuisine, Recipe } from '../domain/types'
import { SAMPLE_RECIPES } from './sampleRecipes'
import { getApiKey, loadRecipes } from './spoonacular'
import type { FetchOptions } from './spoonacular'

export interface RecipeLoad {
  recipes: Recipe[]
  source: 'spoonacular' | 'sample'
  /** Set when we fell back to the saved samples, explaining why. */
  notice?: string
}

export function sampleRecipesFor(cuisines: readonly Cuisine[]): Recipe[] {
  return SAMPLE_RECIPES.filter((r) => cuisines.includes(r.cuisine))
}

/**
 * Get recipes for the chosen cuisines. Uses Spoonacular when an API key is
 * configured; otherwise, or if the request fails, uses the saved sample
 * recipes so the app always has something to explore.
 */
export async function getRecipes(
  cuisines: readonly Cuisine[],
  options: Partial<FetchOptions> = {},
): Promise<RecipeLoad> {
  const apiKey = options.apiKey ?? getApiKey()
  if (!apiKey) {
    return {
      recipes: sampleRecipesFor(cuisines),
      source: 'sample',
      notice: 'No Spoonacular API key is set, so these are the saved sample recipes.',
    }
  }
  try {
    const recipes = await loadRecipes(cuisines, { ...options, apiKey })
    return { recipes, source: 'spoonacular' }
  } catch (error) {
    if (options.signal?.aborted) throw error
    const reason = error instanceof Error ? error.message : 'The request failed.'
    return {
      recipes: sampleRecipesFor(cuisines),
      source: 'sample',
      notice: `${reason} Showing the saved sample recipes instead.`,
    }
  }
}
