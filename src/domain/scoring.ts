import type { FilterState } from './filters'
import { DIFFICULTY_LABELS } from './types'
import type { Equipment, Recipe } from './types'

export interface Evaluation {
  recipe: Recipe
  haveIngredients: string[]
  substituted: { ingredient: string; using: string }[]
  missingIngredients: string[]
  missingEquipment: Equipment[]
  difficultyOver: number
  changesNeeded: number
  makeable: boolean
  score: number
  reasons: string[]
}
export const TOP_N = 3
export const compareText = (a: string, b: string): number => a < b ? -1 : a > b ? 1 : 0

export function evaluate(recipe: Recipe, state: FilterState): Evaluation | undefined {
  if (!state.cuisines.includes(recipe.cuisine)) return undefined
  const haveIngredients: string[] = []
  const substituted: Evaluation['substituted'] = []
  const missingIngredients: string[] = []
  for (const ingredient of recipe.requiredIngredients) {
    if (state.ingredients.includes(ingredient)) haveIngredients.push(ingredient)
    else {
      const using = recipe.substitutions[ingredient]?.find((name) => state.ingredients.includes(name))
      if (using) substituted.push({ ingredient, using })
      else missingIngredients.push(ingredient)
    }
  }
  const missingEquipment = recipe.requiredEquipment.filter((item) => !state.equipment.includes(item))
  const difficultyOver = Math.max(0, recipe.difficulty - state.maxDifficulty)
  const changesNeeded = missingIngredients.length + missingEquipment.length + difficultyOver
  const makeable = changesNeeded === 0
  const ingredientScore = recipe.requiredIngredients.length ? 70 * (haveIngredients.length + 0.5 * substituted.length) / recipe.requiredIngredients.length : 70
  const equipmentScore = recipe.requiredEquipment.length ? 15 * (recipe.requiredEquipment.length - missingEquipment.length) / recipe.requiredEquipment.length : 15
  const score = Math.round(ingredientScore + equipmentScore + (difficultyOver === 0 ? 15 : difficultyOver === 1 ? 7 : 0))
  const reasons = [`Uses ${haveIngredients.length} of ${recipe.requiredIngredients.length} required ingredients you have`]
  for (const { ingredient, using } of substituted) reasons.push(`Swap in ${using} for ${ingredient}`)
  if (missingIngredients.length) reasons.push(`Missing: ${missingIngredients.join(', ')}`)
  if (missingEquipment.length) reasons.push(`Needs equipment you don't have: ${missingEquipment.join(', ')}`)
  if (difficultyOver) reasons.push(`Rated ${DIFFICULTY_LABELS[recipe.difficulty]}, above your ${DIFFICULTY_LABELS[state.maxDifficulty]} limit`)
  if (makeable) reasons.push('You can make this now')
  return { recipe, haveIngredients, substituted, missingIngredients, missingEquipment, difficultyOver, changesNeeded, makeable, score, reasons }
}

export function rank(recipes: readonly Recipe[], state: FilterState): Evaluation[] {
  return recipes.flatMap((recipe) => {
    const result = evaluate(recipe, state)
    return result ? [result] : []
  }).sort((a, b) => Number(b.makeable) - Number(a.makeable) || b.score - a.score || a.changesNeeded - b.changesNeeded || compareText(a.recipe.name, b.recipe.name) || a.recipe.id - b.recipe.id)
}

export function topRecipes(recipes: readonly Recipe[], state: FilterState): Evaluation[] {
  return rank(recipes, state).slice(0, TOP_N)
}
