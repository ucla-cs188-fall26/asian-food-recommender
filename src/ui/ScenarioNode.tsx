import { Handle, Position } from '@xyflow/react'
import type { Node, NodeProps } from '@xyflow/react'
import { changeLabel } from '../domain/branches'
import { summarizeFilters } from '../domain/filters'
import { evaluate, topRecipes } from '../domain/scoring'
import { DIFFICULTY_LABELS } from '../domain/types'
import type { Recipe } from '../domain/types'
import type { GraphNode } from '../graph/graphState'
import { NODE_HEIGHT, NODE_WIDTH } from '../graph/layout'
import type { Direction } from '../graph/layout'

export type ScenarioFlowNode = Node<{
  scenario: GraphNode
  parent?: GraphNode
  recipes: readonly Recipe[]
  direction: Direction
  onExpand: (id: string) => void
}, 'scenario'>

export function ScenarioNode({ data, selected }: NodeProps<ScenarioFlowNode>) {
  const { scenario, parent, recipes, direction, onExpand } = data
  const top = topRecipes(recipes, scenario.state)
  const parentTop = parent ? topRecipes(recipes, parent.state).map((e) => e.recipe.id) : []
  const added = scenario.change
  const newText = added?.kind === 'add-ingredient' ? added.ingredient : added?.kind === 'add-equipment' ? added.equipment : added ? DIFFICULTY_LABELS[added.to] : undefined
  return <article className={`scenario-node ${scenario.depth === 0 ? 'root-node' : ''} ${selected ? 'selected-node' : ''}`} style={{ width: NODE_WIDTH, height: NODE_HEIGHT }}>
    <Handle type="target" position={direction === 'LR' ? Position.Left : Position.Top} />
    <div className="node-heading"><h3>{scenario.depth === 0 ? 'Start' : `Change: ${changeLabel(scenario.change!)}`}</h3>{selected && <span className="selected-label">Selected</span>}</div>
    <p className="node-summary">{summarizeFilters(scenario.state)}</p>
    {newText && <p className="new-filter"><strong>{newText}</strong> (new)</p>}
    <ul className="node-recipes nodrag nowheel">{top.map((e) => {
      const nowReady = parent && e.makeable && !evaluate(e.recipe, parent.state)?.makeable
      return <li key={e.recipe.id}><div className="node-recipe-title">{e.recipe.name}</div><div className="node-recipe-meta">{DIFFICULTY_LABELS[e.recipe.difficulty]} · <span className={e.makeable ? 'ready' : ''}>{e.makeable ? 'Ready' : `Missing ${e.changesNeeded}`}</span>{parent && !parentTop.includes(e.recipe.id) && <span className="badge">New</span>}{nowReady && <span className="badge ready">Now ready</span>}</div></li>
    })}{!top.length && <li>No recipes for these cuisines.</li>}</ul>
    <div className="node-action">{scenario.expanded ? <p>{scenario.note ?? 'Explored'}</p> : <button className="nodrag" type="button" onClick={(event) => { event.stopPropagation(); onExpand(scenario.id) }}>Explore changes</button>}</div>
    <Handle type="source" position={direction === 'LR' ? Position.Right : Position.Bottom} />
  </article>
}
