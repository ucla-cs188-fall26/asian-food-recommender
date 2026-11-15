import * as dagre from '@dagrejs/dagre'
import type { GraphState } from './graphState'

/** LR: tree flowing left to right. TB: one stacked, indented column. */
export type Direction = 'LR' | 'TB'
export type Positions = Record<string, { x: number; y: number }>

export const NODE_WIDTH = 300
export const NODE_HEIGHT = 220
/** In the stacked layout, how far each level is indented and spaced. */
export const STACK_INDENT = 28
export const STACK_GAP = 28

/** Side-by-side tree for wide screens, laid out by dagre. */
function treeLayout(graph: GraphState): Positions {
  const g = new dagre.graphlib.Graph()
  g.setGraph({ rankdir: 'LR', nodesep: 40, ranksep: 90 })
  g.setDefaultEdgeLabel(() => ({}))
  for (const id of Object.keys(graph.nodes)) {
    g.setNode(id, { width: NODE_WIDTH, height: NODE_HEIGHT })
  }
  for (const edge of graph.edges) g.setEdge(edge.source, edge.target)
  dagre.layout(g)
  return Object.fromEntries(
    Object.keys(graph.nodes).map((id) => {
      // dagre reports node centres; React Flow wants the top-left corner.
      const { x, y } = g.node(id)
      return [id, { x: x - NODE_WIDTH / 2, y: y - NODE_HEIGHT / 2 }]
    }),
  )
}

/**
 * One column for narrow screens: each scenario sits below the previous one,
 * with children indented under the scenario they were first reached from. The
 * graph is only ever one card wide, so it stays readable on a phone.
 */
function stackedLayout(graph: GraphState): Positions {
  const childrenOf = new Map<string, string[]>()
  for (const node of Object.values(graph.nodes)) {
    if (!node.parentId) continue
    const siblings = childrenOf.get(node.parentId) ?? []
    siblings.push(node.id)
    childrenOf.set(node.parentId, siblings)
  }

  const positions: Positions = {}
  let row = 0
  const place = (id: string) => {
    positions[id] = {
      x: graph.nodes[id].depth * STACK_INDENT,
      y: row * (NODE_HEIGHT + STACK_GAP),
    }
    row += 1
    for (const child of childrenOf.get(id) ?? []) place(child)
  }
  place(graph.rootId)
  return positions
}

export function layoutGraph(graph: GraphState, direction: Direction): Positions {
  return direction === 'LR' ? treeLayout(graph) : stackedLayout(graph)
}

/** Width and height of the area the laid-out nodes cover. */
export function layoutSize(positions: Positions): { width: number; height: number } {
  const points = Object.values(positions)
  return {
    width: Math.max(...points.map((p) => p.x)) + NODE_WIDTH,
    height: Math.max(...points.map((p) => p.y)) + NODE_HEIGHT,
  }
}
