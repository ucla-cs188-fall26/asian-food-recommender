import { expect, test, vi } from 'vitest'
import { BOOKMARK_STORAGE_KEY, readBookmarks, recipeKey, toggleBookmark, writeBookmarks } from './bookmarks'
import { SAMPLE_RECIPES } from './sampleRecipes'
import type { Recipe } from '../domain/types'

const sample = SAMPLE_RECIPES[0]
// Hand-written fixture; never a real API response.
const live: Recipe = {
  id: sample.id, name: 'Test live dish', source: 'spoonacular', cuisine: 'Thai', difficulty: 1,
  requiredIngredients: ['tofu'], optionalIngredients: [], stapleIngredients: [],
  substitutions: {}, ingredientLines: ['100g tofu'], requiredEquipment: [],
  steps: [{ number: 1, text: 'Cook tofu.', tools: [], ingredients: ['tofu'] }],
}

test('saving and removing distinguishes sources even when recipe IDs collide', () => {
  const saved = toggleBookmark(toggleBookmark([], sample), live)
  expect(saved).toHaveLength(2)
  expect(recipeKey(sample)).not.toBe(recipeKey(live))
  expect(toggleBookmark(saved, sample)).toEqual([live])
  expect(toggleBookmark(toggleBookmark([], sample), sample)).toEqual([])
})

test('refresh restores samples in saved order and never persists live data', () => {
  const storage = { setItem: vi.fn(), getItem: vi.fn() }
  expect(writeBookmarks(storage, [SAMPLE_RECIPES[1], live, sample, sample])).toBe(true)
  const payload = JSON.stringify([SAMPLE_RECIPES[1].id, sample.id])
  expect(storage.setItem).toHaveBeenCalledExactlyOnceWith(BOOKMARK_STORAGE_KEY, payload)
  storage.getItem.mockReturnValue(payload)
  expect(readBookmarks(storage)).toEqual([SAMPLE_RECIPES[1], sample])
})

test.each(['invalid json', '{}', 'null', '[null,"1",999999999]'])('bad storage is handled: %s', (value) => {
  expect(readBookmarks({ getItem: () => value })).toEqual([])
})

test('unknown IDs are skipped and duplicate IDs are restored once', () => {
  expect(readBookmarks({ getItem: () => JSON.stringify([sample.id, sample.id, 999999999]) })).toEqual([sample])
})

test('blocked or full storage does not prevent session bookmarks', () => {
  expect(readBookmarks({ getItem: () => { throw new Error('blocked') } })).toEqual([])
  expect(writeBookmarks({ setItem: () => { throw new Error('full') } }, [sample, live])).toBe(false)
  expect(toggleBookmark([sample], live)).toEqual([live, sample])
})
