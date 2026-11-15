import { expect, it } from 'vitest'
import { SAMPLE_RECIPES } from '../data/sampleRecipes'
import { createFilterState, DEFAULT_FILTERS } from '../domain/filters'
import type { Recipe } from '../domain/types'
import { createGraph, graphReducer, MAX_DEPTH, MAX_NODES } from './graphState'

it('starts expanded and selected, ignores invalid or repeated expansions', () => {
  const graph = createGraph(DEFAULT_FILTERS, SAMPLE_RECIPES)
  expect(graph.nodes[graph.rootId]).toMatchObject({ depth: 0, expanded: true })
  expect(graph.selectedId).toBe(graph.rootId)
  expect(graphReducer(graph, { type: 'expand', nodeId: graph.rootId, recipes: SAMPLE_RECIPES })).toBe(graph)
  expect(graphReducer(graph, { type: 'expand', nodeId: 'unknown', recipes: SAMPLE_RECIPES })).toBe(graph)
  expect(graphReducer(graph, { type: 'select', nodeId: 'unknown' })).toBe(graph)
})
it('shares states reached along two paths, preserves old state and resets', () => {
  const fixture: Recipe = { id: 1, name: 'A', cuisine: 'Chinese', source: 'sample', difficulty: 1, requiredIngredients: ['a'], optionalIngredients: [], stapleIngredients: [], substitutions: {}, requiredEquipment: [], ingredientLines: [], steps: [] }
  const recipes = [fixture, { ...fixture, id: 2, name: 'B', requiredIngredients: ['b'] }]
  const filters = createFilterState({ ...DEFAULT_FILTERS, ingredients: [] })
  let graph = createGraph(filters, recipes)
  const old = graph
  const copy = structuredClone(graph)
  const children = Object.values(graph.nodes).filter((n) => n.depth === 1)
  for (const node of children) graph = graphReducer(graph, { type: 'expand', nodeId: node.id, recipes })
  expect(old).toEqual(copy)
  expect(Object.keys(graph.nodes)).toHaveLength(4)
  const shared = Object.values(graph.nodes).find((n) => n.depth === 2)!
  expect(graph.edges.filter((e) => e.target === shared.id)).toHaveLength(2)
  graph = graphReducer(graph, { type: 'select', nodeId: shared.id })
  expect(graph.selectedId).toBe(shared.id)
  graph = graphReducer(graph, { type: 'expand', nodeId: shared.id, recipes })
  expect(graph.nodes[shared.id].note).toBe(`Exploration stops ${MAX_DEPTH} levels from the start.`)
  expect(graphReducer(graph, { type: 'reset', recipes })).toEqual(createGraph(filters, recipes))
})
it('caps graph size and reports the limit', () => {
  // Independent one-change recipes provide four first-level alternatives and
  // enough combinations for the fourth expansion to encounter the cap.
  const recipes: Recipe[] = Array.from({ length: 6 }, (_, i) => ({ id: i, name: `Recipe ${i}`, cuisine: 'Chinese', source: 'sample', difficulty: 1, requiredIngredients: [`item${i}`], optionalIngredients: [], stapleIngredients: [], substitutions: {}, requiredEquipment: [], ingredientLines: [], steps: [] }))
  let graph = createGraph(createFilterState({ ...DEFAULT_FILTERS, ingredients: [] }), recipes)
  for (const node of Object.values(graph.nodes)) graph = graphReducer(graph, { type: 'expand', nodeId: node.id, recipes })
  expect(Object.keys(graph.nodes)).toHaveLength(MAX_NODES)
  expect(graph.message).toContain('limited to 12')
  expect(Math.max(...Object.values(graph.nodes).map((n) => n.depth))).toBeLessThanOrEqual(MAX_DEPTH)
})
