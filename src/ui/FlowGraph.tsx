import { useEffect, useState } from 'react'
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
import { layoutGraph } from '../graph/layout'
import type { Direction } from '../graph/layout'
import { ScenarioNode } from './ScenarioNode'
import type { ScenarioFlowNode } from './ScenarioNode'
import { notice } from './styles'

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

/** Top-to-bottom on narrow screens, left-to-right otherwise. */
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
  const positions = layoutGraph(graph, direction)

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
    type: 'smoothstep',
    markerEnd: { type: MarkerType.ArrowClosed, color: EDGE_COLOR },
    style: { stroke: EDGE_COLOR, strokeWidth: 1.5 },
    labelStyle: { fill: EDGE_LABEL_COLOR, fontSize: 11, fontWeight: 600 },
    labelBgStyle: { fill: EDGE_LABEL_BACKGROUND },
    labelBgPadding: [6, 4] as [number, number],
  }))

  // Re-fit the view whenever the graph gains or loses nodes or flips direction.
  const { fitView } = useReactFlow()
  const count = nodes.length
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      void fitView({ padding: 0.12, maxZoom: 1, duration: 200 })
    })
    return () => cancelAnimationFrame(frame)
  }, [count, graph.rootId, direction, fitView])

  return (
    <div
      className="h-[560px] w-full overflow-hidden rounded-lg border border-line-soft bg-canvas md:h-[590px]"
      aria-label="Recipe scenario graph"
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={(_, node) => onSelect(node.id)}
        onNodeDoubleClick={(_, node) => onExpand(node.id)}
        fitView
        fitViewOptions={{ padding: 0.12, maxZoom: 1 }}
        minZoom={0.15}
        maxZoom={1.6}
        nodesConnectable={false}
        nodesDraggable={false}
        deleteKeyCode={null}
      >
        <Background color={GRID_COLOR} gap={20} size={1} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  )
}

export function FlowGraph(props: FlowGraphProps) {
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
        Select a scenario for recipes · Explore to branch · Scroll to zoom,
        drag to pan
      </p>
    </>
  )
}
