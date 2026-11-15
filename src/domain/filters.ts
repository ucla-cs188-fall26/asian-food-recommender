import { canonicalIngredients } from './ingredients'
import { isStaple } from './kitchen'
import { CUISINES, EQUIPMENT, DIFFICULTY_LABELS } from './types'
import type { Cuisine, Difficulty, Equipment } from './types'

export interface FilterState {
  readonly ingredients: readonly string[]
  readonly cuisines: readonly Cuisine[]
  readonly equipment: readonly Equipment[]
  readonly maxDifficulty: Difficulty
}

export interface FilterInput {
  ingredients: Iterable<string>
  cuisines: Iterable<Cuisine>
  equipment: Iterable<Equipment>
  maxDifficulty: Difficulty
}

export function createFilterState(input: FilterInput): FilterState {
  const cuisines = new Set(input.cuisines)
  const equipment = new Set(input.equipment)
  return {
    ingredients: canonicalIngredients(input.ingredients).filter((name) => !isStaple(name)).sort(),
    cuisines: CUISINES.filter((name) => cuisines.has(name)),
    equipment: EQUIPMENT.filter((name) => equipment.has(name)),
    maxDifficulty: input.maxDifficulty,
  }
}

export function filterStateId(state: FilterState): string {
  return `c=${state.cuisines.join(',')}|i=${state.ingredients.join(',')}|e=${state.equipment.join(',')}|d=${state.maxDifficulty}`
}

export function summarizeFilters(state: FilterState): string {
  return `${state.cuisines.join(', ') || 'none'} · ${state.ingredients.join(', ') || 'none'} · ${state.equipment.join(', ') || 'none'} · up to ${DIFFICULTY_LABELS[state.maxDifficulty]}`
}

export const DEFAULT_FILTERS = createFilterState({
  cuisines: ['Chinese', 'Japanese', 'Korean'], ingredients: ['tofu', 'egg'],
  equipment: ['stove'], maxDifficulty: 1,
})
