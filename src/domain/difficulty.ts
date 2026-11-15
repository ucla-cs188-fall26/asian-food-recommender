import type { Difficulty } from './types'

function band(value: number, low: number, high: number): number {
  if (value <= low) return 0
  return value <= high ? 1 : 2
}

/**
 * Spoonacular has no difficulty field, so we derive one from two things a cook
 * can see up front: how many ingredients to gather and how many steps to
 * follow. Each contributes 0-2 points; the total picks the level.
 *
 * Time is deliberately left out: Spoonacular reports a placeholder 45 minutes
 * for most recipes, so it would skew the result.
 */
export function deriveDifficulty(
  ingredientCount: number,
  stepCount: number,
): Difficulty {
  const points = band(ingredientCount, 7, 12) + band(stepCount, 5, 9)
  if (points === 0) return 1
  return points <= 2 ? 2 : 3
}
