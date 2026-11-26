import { useEffect, useRef, useState } from 'react'
import {
  Background,
  Controls,
  MarkerType,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import type { Recipe } from '../domain/types'
import type { GraphState } from '../graph/graphState'
import { layoutGraph, layoutSize } from '../graph/layout'
import type { Direction } from '../graph/layout'
import { ScenarioNode } from './ScenarioNode'
import type { ScenarioFlowNode } from './ScenarioNode'
import { notice, smallButton } from './styles'

interface FlowGraphProps {
  graph: GraphState
  recipes: readonly Recipe[]
  onExpand: (nodeId: string) => void
  onSelect: (nodeId: string) => void
}

const nodeTypes = { scenario: ScenarioNode }

// React Flow styles edges through props, not class names, so these colours
// repeat the `--color-*` tokens from index.css.
const EDGE_COLOR = '#70866c'
const EDGE_LABEL_COLOR = '#354e37'
const EDGE_LABEL_BACKGROUND = '#fffef9'
const GRID_COLOR = '#d1d9c7'

/** Space around the stacked column, in graph pixels. */
const STACK_PADDING = 12

/** One stacked column on narrow screens, a left-to-right tree otherwise. */
function useDirection(): Direction {
  const [narrow, setNarrow] = useState(
    () => window.matchMedia('(max-width: 767px)').matches,
  )
  useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)')
    const update = () => setNarrow(media.matches)
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])
  return narrow ? 'TB' : 'LR'
}

function GraphCanvas({ graph, recipes, onExpand, onSelect }: FlowGraphProps) {
  const direction = useDirection()
  const stacked = direction === 'TB'
  const positions = layoutGraph(graph, direction)
  const size = layoutSize(positions)

  const nodes: ScenarioFlowNode[] = Object.values(graph.nodes).map(
    (scenario) => ({
      id: scenario.id,
      type: 'scenario',
      position: positions[scenario.id],
      selected: scenario.id === graph.selectedId,
      data: {
        scenario,
        parent: scenario.parentId ? graph.nodes[scenario.parentId] : undefined,
        recipes,
        direction,
        onExpand,
      },
    }),
  )

  const edges = graph.edges.map((edge) => ({
    ...edge,
    // Stacked cards already name their change in the heading, and a label
    // would not fit in the narrow gutter the edge runs through.
    label: stacked ? undefined : edge.label,
    type: 'smoothstep',
    markerEnd: { type: MarkerType.ArrowClosed, color: EDGE_COLOR },
    style: { stroke: EDGE_COLOR, strokeWidth: 1.5 },
    labelStyle: { fill: EDGE_LABEL_COLOR, fontSize: 11, fontWeight: 600 },
    labelBgStyle: { fill: EDGE_LABEL_BACKGROUND },
    labelBgPadding: [6, 4] as [number, number],
  }))

  // Re-fit the view whenever the graph gains or loses nodes, flips direction,
  // or its box changes size.
  const { fitView } = useReactFlow()
  const container = useRef<HTMLDivElement>(null)
  const count = nodes.length
  const padding = stacked ? 0 : 0.12
  useEffect(() => {
    let frame = 0
    const fit = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        void fitView({ padding, maxZoom: 1, duration: 200 })
      })
    }
    fit()
    const observer = new ResizeObserver(fit)
    if (container.current) observer.observe(container.current)
    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [count, graph.rootId, direction, padding, fitView])

  // Stacked: the box takes the column's own shape, so the whole graph shows at
  // a readable size and the page scrolls through it. Tree: a fixed-height box
  // the user pans and zooms inside.
  const stackedWidth = size.width + 2 * STACK_PADDING
  const stackedHeight = size.height + 2 * STACK_PADDING

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-[480px] text-xs leading-relaxed text-muted">
          Begin at <strong className="text-moss">Your kitchen</strong>. Follow
          a branch to see what one change unlocks. Select any card to see recipes
          below.
        </p>
        <button
          type="button"
          className={smallButton}
          onClick={() => {
            onSelect(graph.rootId)
            void fitView({
              nodes: [{ id: graph.rootId }],
              padding: 0.3,
              maxZoom: 1,
              duration: 200,
            })
          }}
        >
          Back to start
        </button>
      </div>
      <div
      ref={container}
      className={`w-full overflow-hidden rounded-lg border border-line-soft bg-canvas ${
        stacked ? '' : 'h-[590px]'
      }`}
      style={
        stacked
          ? {
              aspectRatio: `${stackedWidth} / ${stackedHeight}`,
              maxHeight: stackedHeight,
            }
          : undefined
      }
      aria-label="Recipe scenario graph"
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={(_, node) => onSelect(node.id)}
        onNodeDoubleClick={(_, node) => onExpand(node.id)}
        fitView
        fitViewOptions={{ padding, maxZoom: 1 }}
        minZoom={0.15}
        maxZoom={1.6}
        panOnDrag={!stacked}
        zoomOnScroll={!stacked}
        zoomOnPinch={!stacked}
        zoomOnDoubleClick={false}
        preventScrolling={!stacked}
        nodesConnectable={false}
        nodesDraggable={false}
        deleteKeyCode={null}
      >
        <Background color={GRID_COLOR} gap={20} size={1} />
        {!stacked && <Controls showInteractive={false} />}
      </ReactFlow>
      </div>
    </>
  )
}

export function FlowGraph(props: FlowGraphProps) {
  const stacked = useDirection() === 'TB'
  return (
    <>
      {props.graph.message && (
        <p className={notice} role="status">
          {props.graph.message}
        </p>
      )}
      <ReactFlowProvider>
        <GraphCanvas {...props} />
      </ReactFlowProvider>
      <p className="pt-2.5 text-[11px] text-muted">
        Choose “Show next changes” on a card to explore further.
        {!stacked && ' Scroll to zoom; drag to move the map.'}
      </p>
    </>
  )
}
