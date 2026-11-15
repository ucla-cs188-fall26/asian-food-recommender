import { normalizeName } from './normalize'
import type { Equipment } from './types'

/** Pantry basics we assume every kitchen has, so they never block a recipe. */
const STAPLES = new Set([
  'water',
  'salt',
  'table salt',
  'kosher salt',
  'sea salt',
  'salt and pepper',
  'pepper',
  'black pepper',
  'ground black pepper',
  'oil',
  'cooking oil',
  'vegetable oil',
  'canola oil',
  'olive oil',
  'sugar',
  'granulated sugar',
  'ice',
])

export function isStaple(ingredient: string): boolean {
  return STAPLES.has(normalizeName(ingredient))
}

/**
 * Maps the tool names Spoonacular reports to the equipment a user can filter
 * on. Anything not listed (bowl, knife, whisk...) is a small tool and never
 * blocks a recipe. A wok maps to "stove" because a frying pan can stand in.
 */
const TOOL_TO_EQUIPMENT: Record<string, Equipment> = {
  stove: 'stove',
  'frying pan': 'stove',
  pan: 'stove',
  skillet: 'stove',
  wok: 'stove',
  'sauce pan': 'stove',
  saucepan: 'stove',
  pot: 'stove',
  'dutch oven': 'stove',
  griddle: 'stove',
  'grill pan': 'stove',
  oven: 'oven',
  'baking sheet': 'oven',
  'baking pan': 'oven',
  'casserole dish': 'oven',
  'roasting pan': 'oven',
  broiler: 'oven',
  microwave: 'microwave',
  'rice cooker': 'rice cooker',
  blender: 'blender',
  'immersion blender': 'blender',
  'food processor': 'food processor',
  grill: 'grill',
  steamer: 'steamer',
  'steamer basket': 'steamer',
  'bamboo steamer': 'steamer',
  'slow cooker': 'slow cooker',
  'pressure cooker': 'pressure cooker',
  'instant pot': 'pressure cooker',
  'air fryer': 'air fryer',
  'deep fryer': 'deep fryer',
}

export function toEquipment(tool: string): Equipment | undefined {
  return TOOL_TO_EQUIPMENT[normalizeName(tool)]
}
