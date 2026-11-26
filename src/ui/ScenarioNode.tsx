import { Handle, Position } from '@xyflow/react'
import type { Node, NodeProps } from '@xyflow/react'
import { changeLabel } from '../domain/branches'
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

const badge = 'rounded-[3px] px-[3px]'

export function ScenarioNode({ data, selected }: NodeProps<ScenarioFlowNode>) {
  const { scenario, parent, recipes, direction, onExpand } = data
  const isRoot = scenario.depth === 0
  const top = topRecipes(recipes, scenario.state)
  const parentTopIds = parent
    ? topRecipes(recipes, parent.state).map((e) => e.recipe.id)
    : []
  const summary = summarizeFilters(scenario.state)

  return (
    <article
      className={[
        'flex flex-col rounded-[9px] p-3 text-[11px] text-ink shadow-[0_3px_10px_#14141410]',
        isRoot
          ? 'border-2 border-[#c51e2c] bg-sage'
          : 'border border-[#8a8581] bg-card',
        selected ? 'outline-3 outline-offset-2 outline-moss' : '',
      ].join(' ')}
      style={{ width: NODE_WIDTH, height: NODE_HEIGHT }}
    >
      {/* Edges always arrive at the left side of a card. */}
      {!isRoot && <Handle type="target" position={Position.Left} />}

      {isRoot && (
        <p className="mb-1 text-[10px] font-extrabold uppercase tracking-wide text-moss">
          Start here
        </p>
      )}

      <div className="flex items-start justify-between gap-[5px]">
        <h3 className="truncate text-[13px] leading-[1.2] font-[750]">
          {isRoot ? 'Your kitchen' : changeLabel(scenario.change!)}
        </h3>
        {selected && (
          <span className="text-[9px] font-bold text-moss">Selected</span>
        )}
      </div>
      {/* Clamped so a long ingredient list cannot push recipes out of view. */}
      <p
        className="my-[5px] line-clamp-2 text-[9px] leading-[1.4] text-[#625d59]"
        title={summary}
      >
        {summary}
      </p>
      {isRoot && (
        <p className="mb-1 text-[10px] text-moss">
          What you have now. Follow a branch to try one change.
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
            <li key={e.recipe.id} className="border-t border-[#e4e1de] py-[5px]">
              <div
                className="truncate text-[11px] leading-tight font-semibold"
                title={e.recipe.name}
              >
                {e.recipe.name}
              </div>
              <div className="mt-0.5 flex flex-wrap gap-1 text-[9px] text-[#625d59]">
                {DIFFICULTY_LABELS[e.recipe.difficulty]} ·{' '}
                <span className={e.makeable ? 'font-[750] text-ready' : ''}>
                  {e.makeable
                    ? 'Ready to cook'
                    : `${e.changesNeeded} ${e.changesNeeded === 1 ? 'change' : 'changes'} away`}
                </span>
                {isNew && (
                  <span className={`${badge} bg-[#ffe2e4] text-[#a51521]`}>
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
          <li className="border-t border-[#e4e1de] py-[5px]">
            No recipes for these cuisines.
          </li>
        )}
      </ul>

      <div className="border-t border-line-soft pt-[5px]">
        {scenario.expanded ? (
          <p className="text-[9px] leading-tight text-[#625d59]">
            {scenario.note ?? 'Changes shown'}
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
            Show next changes
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
