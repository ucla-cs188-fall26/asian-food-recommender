import type { Evaluation } from './scoring'

export function requiredChange(evaluation: Evaluation): string {
  if (evaluation.makeable) return 'You have everything you need.'
  if (evaluation.missingIngredients.length) return `Add ${evaluation.missingIngredients[0]}.`
  if (evaluation.missingEquipment.length) return `Use ${evaluation.missingEquipment[0]}.`
  return `Try ${evaluation.recipe.difficulty === 2 ? 'medium' : 'hard'} difficulty.`
}
