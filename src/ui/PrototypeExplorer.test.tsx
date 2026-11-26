import { renderToStaticMarkup } from 'react-dom/server'
import { expect, test } from 'vitest'
import { createFilterState } from '../domain/filters'
import type { Recipe } from '../domain/types'
import { rank } from '../domain/scoring'
import { PrototypeExplorer } from './PrototypeExplorer'
import { requiredChange } from '../domain/discovery'

const filters = createFilterState({ cuisines: ['Korean'], ingredients: ['tofu'], equipment: ['stove'], maxDifficulty: 1 })
const base: Recipe = {
  id: 1, name: 'Ready tofu', cuisine: 'Korean', source: 'sample', difficulty: 1,
  requiredIngredients: ['tofu'], optionalIngredients: [], substitutions: {}, stapleIngredients: [],
  ingredientLines: ['1 block tofu'], requiredEquipment: ['stove'], steps: [],
}

test('groups dishes by readiness without hiding the required change', () => {
  const html = renderToStaticMarkup(<PrototypeExplorer
    filters={filters} recipes={[base, { ...base, id: 2, name: 'Potato tofu', requiredIngredients: ['tofu', 'potato'] },
      { ...base, id: 3, name: 'Two additions', requiredIngredients: ['tofu', 'potato', 'egg'] }]}
    experience="beginner" onExperienceChange={() => {}} bookmarks={[]} onToggleBookmark={() => {}} />)
  const ready = html.indexOf('Ready tofu')
  const oneChange = html.indexOf('aria-label="One change away"')
  expect(ready).toBeGreaterThan(html.indexOf('aria-label="Ready now"'))
  expect(ready).toBeLessThan(oneChange)
  expect(html.indexOf('Potato tofu')).toBeGreaterThan(oneChange)
  expect(html).toContain('Add potato.')
  expect(html).not.toContain('Two additions')
  expect(html).toContain('Browse recipes needing more changes')
})

test('explains ingredient, equipment and difficulty changes', () => {
  const recipes = [
    { ...base, id: 2, requiredIngredients: ['tofu', 'egg'] },
    { ...base, id: 3, requiredEquipment: ['oven'] as Recipe['requiredEquipment'] },
    { ...base, id: 4, difficulty: 2 as const },
  ]
  expect(rank(recipes, filters).map(requiredChange).sort()).toEqual(['Add egg.', 'Try medium difficulty.', 'Use oven.'])
})

test('empty groups explain how to continue', () => {
  const html = renderToStaticMarkup(<PrototypeExplorer filters={filters} recipes={[]} experience="beginner"
    onExperienceChange={() => {}} bookmarks={[]} onToggleBookmark={() => {}} />)
  expect(html).toContain('Nothing is ready yet.')
  expect(html).toContain('No recipes are exactly one change away.')
})
