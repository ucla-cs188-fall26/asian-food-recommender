import type { Evaluation } from './scoring'

export function requiredChange(evaluation: Evaluation): string {
  if (evaluation.makeable) return 'You have everything you need.'
  const changes: string[] = []
  if (evaluation.missingIngredients.length) changes.push(`Add ${evaluation.missingIngredients.join(', ')}`)
  if (evaluation.missingEquipment.length) changes.push(`Use ${evaluation.missingEquipment.join(', ')}`)
  if (evaluation.difficultyOver) changes.push(`Try ${evaluation.recipe.difficulty === 2 ? 'medium' : 'hard'} difficulty`)
  return `${changes.join('; ')}.`
}
