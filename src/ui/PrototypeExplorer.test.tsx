import { renderToStaticMarkup } from 'react-dom/server'
import { expect, test } from 'vitest'
import { DEFAULT_FILTERS } from '../domain/filters'
import { PrototypeExplorer } from './PrototypeExplorer'

test('starts with one question, no preselected permission, and progress guidance', () => {
  const html = renderToStaticMarkup(<PrototypeExplorer filters={DEFAULT_FILTERS} recipes={[]}
    experience="beginner" onExperienceChange={() => {}} bookmarks={[]} onToggleBookmark={() => {}} />)
  expect(html).toContain('Can you add one ingredient?')
  expect(html).toContain('aria-current="step"')
  expect(html).toContain('at most one change in total')
  expect(html).not.toContain('checked=""')
  expect(html).toMatch(/disabled=""[^>]*>Continue/)
  expect(html).not.toContain('Your dinner suggestion')
})
