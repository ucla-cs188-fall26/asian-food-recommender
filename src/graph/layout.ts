import * as dagre from '@dagrejs/dagre'
import type { GraphState } from './graphState'

export type Direction = 'LR' | 'TB'
export const NODE_WIDTH = 300
export const NODE_HEIGHT = 220

export function layoutGraph(graph: GraphState, direction: Direction): Record<string, { x: number; y: number }> {
  const g = new dagre.graphlib.Graph()
  g.setGraph({ rankdir: direction, nodesep: 40, ranksep: 90 })
  g.setDefaultEdgeLabel(() => ({}))
  for (const id of Object.keys(graph.nodes)) g.setNode(id, { width: NODE_WIDTH, height: NODE_HEIGHT })
  for (const edge of graph.edges) g.setEdge(edge.source, edge.target)
  dagre.layout(g)
  return Object.fromEntries(Object.keys(graph.nodes).map((id) => {
    const { x, y } = g.node(id)
    return [id, { x: x - NODE_WIDTH / 2, y: y - NODE_HEIGHT / 2 }]
  }))
}
