import type { FilterState } from './filters'
import { rank } from './scoring'
import type { Recipe } from './types'

export type Preference = 'ingredient' | 'equipment' | 'difficulty'
export type Answers = Record<Preference, boolean | null>
export const INITIAL_GUIDE = {
  step: 0,
  answers: { ingredient: null, equipment: null, difficulty: null } as Answers,
  showAlternatives: false,
}
export const QUESTION_KEYS: readonly Preference[] = ['ingredient', 'equipment', 'difficulty']
export type GuideState = typeof INITIAL_GUIDE
export type GuideAction =
  | { type: 'answer'; value: boolean }
  | { type: 'next' }
  | { type: 'back' }
  | { type: 'edit' }
  | { type: 'restart' }
  | { type: 'alternatives' }

export function guideReducer(state: GuideState, action: GuideAction): GuideState {
  if (action.type === 'restart') return INITIAL_GUIDE
  if (action.type === 'edit') return { ...state, step: 0, showAlternatives: false }
  if (action.type === 'back') return { ...state, step: Math.max(0, state.step - 1), showAlternatives: false }
  if (action.type === 'alternatives') return state.step === 3 ? { ...state, showAlternatives: !state.showAlternatives } : state
  if (state.step >= 3) return state
  const key = QUESTION_KEYS[state.step]
  if (action.type === 'answer') return { ...state, answers: { ...state.answers, [key]: action.value }, showAlternatives: false }
  if (action.type === 'next' && state.answers[key] !== null) return { ...state, step: state.step + 1 }
  return state
}

export function guidedCandidates(recipes: readonly Recipe[], filters: FilterState, answers: Answers) {
  if (Object.values(answers).some((answer) => answer === null)) return []
  return rank(recipes, filters).filter((e) =>
    e.changesNeeded <= 1 &&
    (e.missingIngredients.length === 0 || answers.ingredient) &&
    (e.missingEquipment.length === 0 || answers.equipment) &&
    (e.difficultyOver === 0 || answers.difficulty),
  )
}
