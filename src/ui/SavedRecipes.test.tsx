import { renderToStaticMarkup } from 'react-dom/server'
import { expect, test } from 'vitest'
import { SAMPLE_RECIPES } from '../data/sampleRecipes'
import { DEFAULT_FILTERS, createFilterState } from '../domain/filters'
import { SavedRecipes } from './SavedRecipes'
import type { Recipe } from '../domain/types'

function render(bookmarks: Recipe[], storageUnavailable = false) {
  return renderToStaticMarkup(<SavedRecipes
    bookmarks={bookmarks}
    filters={createFilterState({ ...DEFAULT_FILTERS, cuisines: ['Chinese'] })}
    experience="beginner"
    onExperienceChange={() => {}}
    onToggleBookmark={() => {}}
    storageUnavailable={storageUnavailable}
  />)
}

test('empty dashboard explains how to save and links back to exploration', () => {
  const html = render([])
  expect(html).toContain('Your next favorite is waiting.')
  expect(html).toContain('href="#explore"')
  expect(html).not.toContain('Search saved recipes')
})

test('saved recipes from other cuisines stay visible with details and removal controls', () => {
  const recipe = SAMPLE_RECIPES.find((item) => item.cuisine === 'Korean')!
  const html = render([recipe])
  expect(html).toContain(recipe.name)
  expect(html).toContain('aria-pressed="true"')
  expect(html).toContain(`Remove bookmark for ${recipe.name}`)
  expect(html).toContain('Ingredients &amp; cooking steps')
  expect(html).toContain('Search saved recipes')
  expect(html).toContain('All cuisines')
  expect(html).toContain('Saved on this device')
})

test('dashboard explains live bookmark lifetime and unavailable storage', () => {
  const html = render([], true)
  expect(html).toContain('Live Spoonacular bookmarks last until you refresh or close this page.')
  expect(html).toContain('Browser storage is unavailable.')
})
