import type { Recipe } from '../domain/types'
import { SAMPLE_RECIPES } from './sampleRecipes'

export const BOOKMARK_STORAGE_KEY = 'recipe-explorer:sample-bookmarks:v1'

export function recipeKey(recipe: Pick<Recipe, 'source' | 'id'>): string {
  return `${recipe.source}:${recipe.id}`
}

export function toggleBookmark(bookmarks: readonly Recipe[], recipe: Recipe): Recipe[] {
  const key = recipeKey(recipe)
  return bookmarks.some((saved) => recipeKey(saved) === key)
    ? bookmarks.filter((saved) => recipeKey(saved) !== key)
    : [recipe, ...bookmarks]
}

/** Persist only identifiers from our own sample set. Live API data stays in memory. */
export function writeBookmarks(storage: Pick<Storage, 'setItem'>, bookmarks: readonly Recipe[]): boolean {
  try {
    const ids = [...new Set(bookmarks.filter((recipe) => recipe.source === 'sample').map((recipe) => recipe.id))]
    storage.setItem(BOOKMARK_STORAGE_KEY, JSON.stringify(ids))
    return true
  } catch {
    return false
  }
}

export function readBookmarks(storage: Pick<Storage, 'getItem'>): Recipe[] {
  try {
    const ids: unknown = JSON.parse(storage.getItem(BOOKMARK_STORAGE_KEY) ?? '[]')
    if (!Array.isArray(ids)) return []
    const samples = new Map(SAMPLE_RECIPES.map((recipe) => [recipe.id, recipe]))
    return [...new Set(ids)].flatMap((id: unknown) => {
      const recipe = typeof id === 'number' ? samples.get(id) : undefined
      return recipe ? [recipe] : []
    })
  } catch {
    return []
  }
}
