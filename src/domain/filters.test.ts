import { describe, expect, it } from 'vitest'
import { createFilterState, DEFAULT_FILTERS, filterStateId, summarizeFilters } from './filters'

describe('filter state', () => {
  it('canonicalizes, deduplicates, removes staples and orders every field', () => {
    const a = createFilterState({ ingredients: [' Green Onions ', 'scallion', 'salt', 'tofu', 'egg'], cuisines: ['Korean', 'Chinese', 'Korean'], equipment: ['oven', 'stove', 'oven'], maxDifficulty: 1 })
    const b = createFilterState({ ingredients: ['egg', 'tofu', 'scallion'], cuisines: ['Chinese', 'Korean'], equipment: ['stove', 'oven'], maxDifficulty: 1 })
    expect(a).toEqual(b)
    expect(a.ingredients).toEqual(['egg', 'scallion', 'tofu'])
    expect(filterStateId(a)).toBe('c=Chinese,Korean|i=egg,scallion,tofu|e=stove,oven|d=1')
    expect(filterStateId(a)).toBe(filterStateId(b))
  })
  it('distinguishes changes in every field', () => {
    for (const patch of [{ ingredients: ['potato'] }, { cuisines: ['Thai'] as const }, { equipment: ['oven'] as const }, { maxDifficulty: 2 as const }]) {
      expect(filterStateId(createFilterState({ ...DEFAULT_FILTERS, ...patch }))).not.toBe(filterStateId(DEFAULT_FILTERS))
    }
  })
  it('summarizes empty lists', () => {
    expect(summarizeFilters(createFilterState({ ...DEFAULT_FILTERS, ingredients: [], equipment: [] }))).toBe('Chinese, Japanese, Korean · none · none · up to Easy')
  })
})
