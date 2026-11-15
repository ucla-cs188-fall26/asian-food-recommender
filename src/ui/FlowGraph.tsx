import { useEffect, useState } from 'react'
import { ReactFlow, ReactFlowProvider, Background, Controls, MarkerType, useReactFlow } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import type { Recipe } from '../domain/types'
import type { GraphState } from '../graph/graphState'
import { layoutGraph } from '../graph/layout'
import type { Direction } from '../graph/layout'
import { ScenarioNode } from './ScenarioNode'
import type { ScenarioFlowNode } from './ScenarioNode'

interface FlowGraphProps {
  graph: GraphState
  recipes: readonly Recipe[]
  onExpand: (nodeId: string) => void
  onSelect: (nodeId: string) => void
}
const nodeTypes = { scenario: ScenarioNode }

function useDirection(): Direction {
  const [narrow, setNarrow] = useState(() => window.matchMedia('(max-width: 767px)').matches)
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
  const nodes: ScenarioFlowNode[] = Object.values(graph.nodes).map((scenario) => ({
    id: scenario.id, type: 'scenario', position: positions[scenario.id], selected: scenario.id === graph.selectedId,
    data: { scenario, parent: scenario.parentId ? graph.nodes[scenario.parentId] : undefined, recipes, direction, onExpand },
  }))
  const edges = graph.edges.map((edge) => ({ ...edge, type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed, color: '#70866c' }, style: { stroke: '#70866c', strokeWidth: 1.5 }, labelStyle: { fill: '#354e37', fontSize: 11, fontWeight: 600 }, labelBgStyle: { fill: '#fffef9' }, labelBgPadding: [6, 4] as [number, number] }))
  const { fitView } = useReactFlow()
  const count = nodes.length
  useEffect(() => {
    const frame = requestAnimationFrame(() => { void fitView({ padding: 0.12, maxZoom: 1, duration: 200 }) })
    return () => cancelAnimationFrame(frame)
  }, [count, graph.rootId, direction, fitView])
  return <div className="graph-canvas" aria-label="Recipe scenario graph">
    <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} onNodeClick={(_, node) => onSelect(node.id)} fitView fitViewOptions={{ padding: .12, maxZoom: 1 }} minZoom={0.15} maxZoom={1.6} nodesConnectable={false} nodesDraggable={false} deleteKeyCode={null} onNodeDoubleClick={(_, node) => onExpand(node.id)}>
      <Background color="#d1d9c7" gap={20} size={1} /><Controls showInteractive={false} />
    </ReactFlow>
  </div>
}

export function FlowGraph(props: FlowGraphProps) {
  return <>{props.graph.message && <p className="notice" role="status">{props.graph.message}</p>}<ReactFlowProvider><GraphCanvas {...props} /></ReactFlowProvider><p className="graph-help">Select a scenario for recipes · Explore to branch · Scroll to zoom, drag to pan</p></>
}
