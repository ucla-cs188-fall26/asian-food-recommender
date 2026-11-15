import { expect, it } from 'vitest'
import { getRecipes } from '../data/recipes'
import { createFilterState } from '../domain/filters'
import { rank } from '../domain/scoring'
import { createGraph, graphReducer } from './graphState'

it('loads samples and supports the core exploration, selection, reset and restart', async () => {
  const filters = createFilterState({ cuisines: ['Korean'], ingredients: ['tofu', 'egg', 'soy sauce', 'garlic'], equipment: ['stove'], maxDifficulty: 1 })
  // Explicitly disable the API even if the developer has a local key.
  const load = await getRecipes(filters.cuisines, { apiKey: '' })
  expect(load.source).toBe('sample')
  let graph = createGraph(filters, load.recipes)
  const edge = graph.edges.find((e) => e.label === 'Add potato')!
  expect(edge).toBeDefined()
  const child = graph.nodes[edge.target]
  const braised = rank(load.recipes, child.state).find((e) => e.recipe.name.startsWith('Dubu Jorim'))!
  expect(braised.makeable).toBe(true)
  expect(rank(load.recipes, filters).find((e) => e.recipe.id === braised.recipe.id)?.makeable).toBe(false)
  graph = graphReducer(graph, { type: 'select', nodeId: child.id })
  expect(graph.selectedId).toBe(child.id)
  for (const node of Object.values(graph.nodes).filter((n) => n.depth === 1)) graph = graphReducer(graph, { type: 'expand', nodeId: node.id, recipes: load.recipes })
  // With this small Korean collection, further changes may reveal nothing.
  // The depth-limit path is covered with independent recipes in graphState.test.
  expect(graph.nodes[child.id].expanded).toBe(true)
  expect(graph.nodes[child.id].note).toBe('No single change reveals new recipes from here.')
  graph = graphReducer(graph, { type: 'reset', recipes: load.recipes })
  expect(graph).toEqual(createGraph(filters, load.recipes))
  const next = createFilterState({ ...filters, ingredients: ['potato'] })
  graph = graphReducer(graph, { type: 'start', filters: next, recipes: load.recipes })
  expect(graph.nodes[graph.rootId].state).toEqual(next)
})
