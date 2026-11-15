import { createFilterState, filterStateId } from './filters'
import type { FilterState } from './filters'
import { compareText, rank, TOP_N } from './scoring'
import { DIFFICULTY_LABELS } from './types'
import type { Difficulty, Equipment, Recipe } from './types'

export type Change =
  | { kind: 'add-ingredient'; ingredient: string }
  | { kind: 'add-equipment'; equipment: Equipment }
  | { kind: 'raise-difficulty'; to: Difficulty }

export interface Suggestion {
  change: Change
  label: string
  childState: FilterState
  childId: string
  newlyMakeable: Recipe[]
  enteredTop: Recipe[]
  explanation: string
}
export const MAX_SUGGESTIONS = 4

export function applyChange(state: FilterState, change: Change): FilterState {
  return createFilterState({ ...state,
    ingredients: change.kind === 'add-ingredient' ? [...state.ingredients, change.ingredient] : state.ingredients,
    equipment: change.kind === 'add-equipment' ? [...state.equipment, change.equipment] : state.equipment,
    maxDifficulty: change.kind === 'raise-difficulty' ? change.to : state.maxDifficulty,
  })
}

export function changeLabel(change: Change): string {
  if (change.kind === 'add-ingredient') return `Add ${change.ingredient}`
  if (change.kind === 'add-equipment') return `Add ${change.equipment}`
  return `Allow ${DIFFICULTY_LABELS[change.to].toLowerCase()} difficulty`
}

export function suggestChanges(recipes: readonly Recipe[], state: FilterState, limit = MAX_SUGGESTIONS): Suggestion[] {
  if (limit <= 0) return []
  const parentRank = rank(recipes, state)
  const candidates = new Map<string, Change>()
  const add = (change: Change) => {
    const id = filterStateId(applyChange(state, change))
    if (id !== filterStateId(state)) candidates.set(id, change)
  }
  for (const evaluation of parentRank.filter((e) => e.changesNeeded === 1)) {
    if (evaluation.missingIngredients.length) add({ kind: 'add-ingredient', ingredient: evaluation.missingIngredients[0] })
    else if (evaluation.missingEquipment.length) add({ kind: 'add-equipment', equipment: evaluation.missingEquipment[0] })
    else if (state.maxDifficulty < 3) add({ kind: 'raise-difficulty', to: (state.maxDifficulty + 1) as Difficulty })
  }
  if (candidates.size < limit) {
    const closest = parentRank.filter((e) => !e.makeable).sort((a, b) => b.score - a.score || a.changesNeeded - b.changesNeeded || compareText(a.recipe.name, b.recipe.name) || a.recipe.id - b.recipe.id).slice(0, 10)
    for (const e of closest) for (const ingredient of e.missingIngredients) add({ kind: 'add-ingredient', ingredient })
  }
  const parentReady = new Set(parentRank.filter((e) => e.makeable).map((e) => e.recipe.id))
  const parentTop = new Set(parentRank.slice(0, TOP_N).map((e) => e.recipe.id))
  const suggestions: Suggestion[] = []
  for (const [childId, change] of candidates) {
    const childState = applyChange(state, change)
    const childRank = rank(recipes, childState)
    const newlyMakeable = childRank.filter((e) => e.makeable && !parentReady.has(e.recipe.id)).map((e) => e.recipe)
    const enteredTop = childRank.slice(0, TOP_N).filter((e) => !parentTop.has(e.recipe.id)).map((e) => e.recipe)
    if (!newlyMakeable.length && !enteredTop.length) continue
    const names = (newlyMakeable.length ? newlyMakeable : enteredTop).slice(0, 3).map((r) => r.name).join(', ')
    suggestions.push({ change, label: changeLabel(change), childState, childId, newlyMakeable, enteredTop,
      explanation: newlyMakeable.length ? `Makes ${newlyMakeable.length} more recipe(s) cookable: ${names}` : `Brings ${names} into your top ${TOP_N}`,
    })
  }
  return suggestions.sort((a, b) => b.newlyMakeable.length - a.newlyMakeable.length || b.enteredTop.length - a.enteredTop.length || compareText(a.label, b.label)).slice(0, limit)
}
