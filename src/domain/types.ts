export const CUISINES = [
  'Chinese',
  'Japanese',
  'Korean',
  'Thai',
  'Vietnamese',
  'Indian',
] as const
export type Cuisine = (typeof CUISINES)[number]

/** 1 = easy, 2 = medium, 3 = hard. Numeric so "one level harder" is arithmetic. */
export type Difficulty = 1 | 2 | 3
export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  1: 'Easy',
  2: 'Medium',
  3: 'Hard',
}

/** Equipment a user can say they have. Small tools (bowls, knives) are not tracked. */
export const EQUIPMENT = [
  'stove',
  'oven',
  'microwave',
  'rice cooker',
  'blender',
  'food processor',
  'grill',
  'steamer',
  'slow cooker',
  'pressure cooker',
  'air fryer',
  'deep fryer',
] as const
export type Equipment = (typeof EQUIPMENT)[number]

export interface RecipeStep {
  number: number
  /** Full wording, with heat, timing and doneness cues where the source has them. */
  text: string
  /** Shorter wording for experienced cooks, when available. */
  brief?: string
  /** Every tool the step mentions, including small ones, for display. */
  tools: string[]
  ingredients: string[]
  minutes?: number
}

export interface Recipe {
  id: number
  name: string
  cuisine: Cuisine
  description?: string
  /** Where the recipe came from: the live API or the saved sample set. */
  source: 'spoonacular' | 'sample'
  /**
   * Time as listed by the source, for display only. Spoonacular reports a
   * placeholder 45 minutes for most recipes, so it is never used to filter,
   * score or branch.
   */
  listedMinutes?: number
  difficulty: Difficulty
  /** Canonical names the user must have for the recipe to be makeable. */
  requiredIngredients: string[]
  /** Nice to have; never block a recipe or lower its score. */
  optionalIngredients: string[]
  /**
   * Required ingredient -> ingredients that can stand in for it. Only the
   * saved sample recipes have these; Spoonacular does not provide them.
   */
  substitutions: Record<string, string[]>
  /** Normalized pantry basics (salt, water, oil...) we assume everyone has. */
  stapleIngredients: string[]
  /** Original ingredient lines with amounts, for the details view. */
  ingredientLines: string[]
  requiredEquipment: Equipment[]
  steps: RecipeStep[]
  imageUrl?: string
  sourceName?: string
  sourceUrl?: string
}
