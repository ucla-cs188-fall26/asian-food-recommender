import { expect, it } from 'vitest'
import { SAMPLE_RECIPES } from '../data/sampleRecipes'
import { DEFAULT_FILTERS } from '../domain/filters'
import { createGraph, graphReducer } from './graphState'
import {
  layoutGraph,
  layoutSize,
  NODE_HEIGHT,
  NODE_WIDTH,
  STACK_INDENT,
} from './layout'

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

it('stacks the narrow layout in one indented column without overlaps', () => {
  let graph = createGraph(DEFAULT_FILTERS, SAMPLE_RECIPES)
  const firstChild = Object.values(graph.nodes).find((n) => n.depth === 1)!
  graph = graphReducer(graph, {
    type: 'expand',
    nodeId: firstChild.id,
    recipes: SAMPLE_RECIPES,
  })
  const positions = layoutGraph(graph, 'TB')
  const nodes = Object.values(graph.nodes)
  expect(nodes.some((n) => n.depth === 2)).toBe(true)

  for (const node of nodes) {
    expect(positions[node.id].x).toBe(node.depth * STACK_INDENT)
  }
  const rows = nodes.map((n) => positions[n.id].y).sort((a, b) => a - b)
  for (let i = 1; i < rows.length; i += 1) {
    expect(rows[i] - rows[i - 1]).toBeGreaterThanOrEqual(NODE_HEIGHT)
  }
  // A grandchild sits directly under its own parent, before the next sibling.
  const grandchild = nodes.find((n) => n.parentId === firstChild.id)!
  const laterSibling = nodes.find(
    (n) => n.depth === 1 && positions[n.id].y > positions[firstChild.id].y,
  )
  if (laterSibling) {
    expect(positions[grandchild.id].y).toBeLessThan(positions[laterSibling.id].y)
  }

  const size = layoutSize(positions)
  expect(size.width).toBe(2 * STACK_INDENT + NODE_WIDTH)
  expect(size.height).toBe(rows[rows.length - 1] + NODE_HEIGHT)
})
