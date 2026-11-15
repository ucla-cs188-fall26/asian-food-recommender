import { expect, it } from 'vitest'
import { SAMPLE_RECIPES } from '../data/sampleRecipes'
import { DEFAULT_FILTERS } from '../domain/filters'
import { createGraph } from './graphState'
import { layoutGraph } from './layout'

it('positions every node after its parent in either direction', () => {
  const graph = createGraph(DEFAULT_FILTERS, SAMPLE_RECIPES)
  for (const direction of ['LR', 'TB'] as const) {
    const positions = layoutGraph(graph, direction)
    expect(Object.keys(positions).sort()).toEqual(Object.keys(graph.nodes).sort())
    for (const e of graph.edges) {
      const axis = direction === 'LR' ? 'x' : 'y'
      expect(positions[e.target][axis]).toBeGreaterThan(positions[e.source][axis])
    }
  }
})
