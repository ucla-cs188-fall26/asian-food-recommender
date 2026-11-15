import { suggestChanges } from '../domain/branches'
import type { Change } from '../domain/branches'
import { filterStateId } from '../domain/filters'
import type { FilterState } from '../domain/filters'
import type { Recipe } from '../domain/types'

export const MAX_NODES = 12
export const MAX_DEPTH = 2
export interface GraphNode {
  id: string
  state: FilterState
  depth: number
  parentId?: string
  change?: Change
  expanded: boolean
  note?: string
}
export interface GraphEdge { id: string; source: string; target: string; label: string }
export interface GraphState {
  rootId: string
  nodes: Record<string, GraphNode>
  edges: GraphEdge[]
  selectedId: string
  message?: string
}
export type GraphAction =
  | { type: 'start'; filters: FilterState; recipes: readonly Recipe[] }
  | { type: 'expand'; nodeId: string; recipes: readonly Recipe[] }
  | { type: 'select'; nodeId: string }
  | { type: 'reset'; recipes: readonly Recipe[] }

export function createGraph(filters: FilterState, recipes: readonly Recipe[]): GraphState {
  const id = filterStateId(filters)
  return graphReducer({ rootId: id, nodes: { [id]: { id, state: filters, depth: 0, expanded: false } }, edges: [], selectedId: id }, { type: 'expand', nodeId: id, recipes })
}

export function graphReducer(state: GraphState, action: GraphAction): GraphState {
  if (action.type === 'start') return createGraph(action.filters, action.recipes)
  if (action.type === 'reset') return createGraph(state.nodes[state.rootId].state, action.recipes)
  if (action.type === 'select') return state.nodes[action.nodeId] ? { ...state, selectedId: action.nodeId } : state
  const node = state.nodes[action.nodeId]
  if (!node || node.expanded) return state
  const expanded = { ...node, expanded: true }
  const next = { ...state, nodes: { ...state.nodes, [node.id]: expanded }, edges: [...state.edges] }
  if (node.depth >= MAX_DEPTH) {
    expanded.note = `Exploration stops ${MAX_DEPTH} levels from the start.`
    return next
  }
  const suggestions = suggestChanges(action.recipes, node.state)
  if (!suggestions.length) expanded.note = 'No single change reveals new recipes from here.'
  for (const s of suggestions) {
    if (!next.nodes[s.childId]) {
      if (Object.keys(next.nodes).length >= MAX_NODES) {
        next.message = `The graph is limited to ${MAX_NODES} scenarios. Reset to explore a different path.`
        expanded.note = next.message
        break
      }
      next.nodes[s.childId] = { id: s.childId, state: s.childState, depth: node.depth + 1, parentId: node.id, change: s.change, expanded: false }
    }
    const id = `${node.id}->${s.childId}`
    if (!next.edges.some((e) => e.id === id)) next.edges.push({ id, source: node.id, target: s.childId, label: s.label })
  }
  return next
}
