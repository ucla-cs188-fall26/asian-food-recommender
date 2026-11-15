import { Handle, Position } from '@xyflow/react'
import type { Node, NodeProps } from '@xyflow/react'
import { changeLabel } from '../domain/branches'
import type { Change } from '../domain/branches'
import { summarizeFilters } from '../domain/filters'
import { evaluate, topRecipes } from '../domain/scoring'
import { DIFFICULTY_LABELS } from '../domain/types'
import type { Recipe } from '../domain/types'
import type { GraphNode } from '../graph/graphState'
import { NODE_HEIGHT, NODE_WIDTH, STACK_INDENT } from '../graph/layout'
import type { Direction } from '../graph/layout'
import { smallButton } from './styles'

export type ScenarioFlowNode = Node<
  {
    scenario: GraphNode
    parent?: GraphNode
    recipes: readonly Recipe[]
    direction: Direction
    onExpand: (id: string) => void
  },
  'scenario'
>

/** The one thing this node's change added, e.g. "potato" or "Medium". */
function addedByChange(change?: Change): string | undefined {
  if (!change) return undefined
  if (change.kind === 'add-ingredient') return change.ingredient
  if (change.kind === 'add-equipment') return change.equipment
  return DIFFICULTY_LABELS[change.to]
}

const badge = 'rounded-[3px] px-[3px]'

export function ScenarioNode({ data, selected }: NodeProps<ScenarioFlowNode>) {
  const { scenario, parent, recipes, direction, onExpand } = data
  const isRoot = scenario.depth === 0
  const top = topRecipes(recipes, scenario.state)
  const parentTopIds = parent
    ? topRecipes(recipes, parent.state).map((e) => e.recipe.id)
    : []
  const added = addedByChange(scenario.change)

  return (
    <article
      className={[
        'flex flex-col rounded-[9px] bg-card p-3 text-[11px] text-ink shadow-[0_3px_10px_#263c3210]',
        isRoot
          ? 'border-4 border-double border-[#597650]'
          : 'border border-[#acbca4]',
        selected ? 'outline-3 outline-offset-2 outline-moss' : '',
      ].join(' ')}
      style={{ width: NODE_WIDTH, height: NODE_HEIGHT }}
    >
      {/* Edges always arrive at the left side of a card. */}
      <Handle type="target" position={Position.Left} />

      <div className="flex items-start justify-between gap-[5px]">
        <h3 className="text-[13px] leading-[1.2] font-[750]">
          {isRoot ? 'Start' : `Change: ${changeLabel(scenario.change!)}`}
        </h3>
        {selected && (
          <span className="text-[9px] font-bold text-moss">Selected</span>
        )}
      </div>
      <p className="my-[5px] text-[9px] leading-[1.4] text-[#6b7665]">
        {summarizeFilters(scenario.state)}
      </p>
      {added && (
        <p className="mb-[3px] text-[9px] text-[#8f532a]">
          <strong>{added}</strong> (new)
        </p>
      )}

      <ul className="nodrag nowheel min-h-0 flex-1 overflow-y-auto">
        {top.map((e) => {
          const isNew = parent && !parentTopIds.includes(e.recipe.id)
          const nowReady =
            parent &&
            e.makeable &&
            !evaluate(e.recipe, parent.state)?.makeable
          return (
            <li key={e.recipe.id} className="border-t border-[#e8ebdf] py-[5px]">
              <div className="text-[11px] leading-tight font-semibold">
                {e.recipe.name}
              </div>
              <div className="mt-0.5 flex flex-wrap gap-1 text-[9px] text-[#737a69]">
                {DIFFICULTY_LABELS[e.recipe.difficulty]} ·{' '}
                <span className={e.makeable ? 'font-[750] text-ready' : ''}>
                  {e.makeable ? 'Ready' : `Missing ${e.changesNeeded}`}
                </span>
                {isNew && (
                  <span className={`${badge} bg-[#f1ead2] text-[#785323]`}>
                    New
                  </span>
                )}
                {nowReady && (
                  <span
                    className={`${badge} bg-ready-bg font-[750] text-ready`}
                  >
                    Now ready
                  </span>
                )}
              </div>
            </li>
          )
        })}
        {!top.length && (
          <li className="border-t border-[#e8ebdf] py-[5px]">
            No recipes for these cuisines.
          </li>
        )}
      </ul>

      <div className="border-t border-line-soft pt-[5px]">
        {scenario.expanded ? (
          <p className="text-[9px] leading-tight text-[#67795f]">
            {scenario.note ?? 'Explored'}
          </p>
        ) : (
          <button
            className={`nodrag w-full ${smallButton}`}
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              onExpand(scenario.id)
            }}
          >
            Explore changes
          </button>
        )}
      </div>

      {/* Tree: edges leave from the right. Stacked: they drop from the
          bottom-left corner and run down the gutter beside the indented
          children. */}
      {direction === 'LR' ? (
        <Handle type="source" position={Position.Right} />
      ) : (
        <Handle
          type="source"
          position={Position.Bottom}
          style={{ left: STACK_INDENT / 2 }}
        />
      )}
    </article>
  )
}
