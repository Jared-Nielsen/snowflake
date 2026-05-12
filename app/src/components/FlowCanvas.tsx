import { useEffect, useMemo } from 'react'
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeMouseHandler,
  type EdgeMouseHandler,
} from '@xyflow/react'
import { SchematicNode } from './nodes/SchematicNode'
import { useInspectorStore } from '@/store/inspectorStore'
import type { NodeInspectorDetails, EdgeInspectorDetails } from '@/store/inspectorStore'

const nodeTypes = { schematic: SchematicNode }

/**
 * FlowCanvas
 * ----------
 * - Nodes are now draggable (drag handle = the whole node body).
 * - Clicking a node or edge surfaces it to <FlowInspector />.
 * - Each diagram passes a unique `flowKey` so the inspector knows which canvas owns the selection.
 * - Node + edge data may carry an optional `details: NodeInspectorDetails | EdgeInspectorDetails`
 *   payload (see `inspectorStore.ts`). When absent, sensible defaults are synthesized.
 */
export function FlowCanvas({
  nodes: initialNodes,
  edges: initialEdges,
  flowKey,
  height = 320,
}: {
  nodes: Node[]
  edges: Edge[]
  /** Unique id per tab/diagram (e.g. 'margin', 'maintenance') */
  flowKey: string
  height?: number
}) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, , onEdgesChange] = useEdgesState(initialEdges)

  // If the caller passes new initial nodes (e.g. tab switch hot-reload), reset.
  useEffect(() => {
    setNodes(initialNodes)
  }, [initialNodes, setNodes])

  const selectNode = useInspectorStore((s) => s.selectNode)
  const selectEdge = useInspectorStore((s) => s.selectEdge)
  const active = useInspectorStore((s) => s.active)

  const activeNodeId = active && active.kind === 'node' && active.flowKey === flowKey ? active.id : null
  const activeEdgeId = active && active.kind === 'edge' && active.flowKey === flowKey ? active.id : null

  // Decorate every node with a selected flag so SchematicNode can highlight.
  const decoratedNodes = useMemo(
    () =>
      nodes.map((n) => ({
        ...n,
        selected: n.id === activeNodeId,
        data: { ...n.data, _selected: n.id === activeNodeId },
      })),
    [nodes, activeNodeId],
  )

  // Edges: animate the selected one a touch brighter.
  const decoratedEdges = useMemo(
    () =>
      edges.map((e) => {
        const isSel = e.id === activeEdgeId
        const baseStyle = (e.style as React.CSSProperties | undefined) ?? {}
        return {
          ...e,
          // Force selected edge to be visibly highlighted
          style: {
            ...baseStyle,
            strokeWidth: isSel ? 3 : (baseStyle.strokeWidth ?? 1.5),
            filter: isSel ? 'drop-shadow(0 0 6px rgba(78,226,244,0.7))' : baseStyle.filter,
          },
        }
      }),
    [edges, activeEdgeId],
  )

  const handleNodeClick: NodeMouseHandler = (_event, node) => {
    const data = node.data as { code?: string; label?: string; details?: NodeInspectorDetails }
    selectNode({
      kind: 'node',
      flowKey,
      id: node.id,
      label: String(data.label ?? node.id),
      code: String(data.code ?? node.id),
      details: data.details ?? synthDefaultNodeDetails(node),
    })
  }

  const handleEdgeClick: EdgeMouseHandler = (_event, edge) => {
    const data = (edge.data ?? {}) as { details?: EdgeInspectorDetails }
    // Find source / target labels for the inspector header
    const src = nodes.find((n) => n.id === edge.source)
    const tgt = nodes.find((n) => n.id === edge.target)
    const srcLabel = (src?.data as { code?: string })?.code ?? edge.source
    const tgtLabel = (tgt?.data as { code?: string })?.code ?? edge.target
    selectEdge({
      kind: 'edge',
      flowKey,
      id: edge.id,
      sourceLabel: String(srcLabel),
      targetLabel: String(tgtLabel),
      details: data.details ?? synthDefaultEdgeDetails(String(srcLabel), String(tgtLabel)),
    })
  }

  return (
    // Use minHeight so the canvas grows to fill its parent row when other
    // panels (e.g. FlowInspector) make the row taller, but never collapses
    // below the requested baseline.
    <div style={{ minHeight: height, height: '100%' }} className="w-full">
      <ReactFlow
        nodes={decoratedNodes}
        edges={decoratedEdges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.18 }}
        proOptions={{ hideAttribution: true }}
        // ─── interactivity: draggable + clickable ─────────────────────
        nodesDraggable
        nodesConnectable={false}
        elementsSelectable
        selectNodesOnDrag={false}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        onEdgeClick={handleEdgeClick}
        // background pan still works, but no scroll-zoom (keeps the demo stable)
        zoomOnScroll={false}
        zoomOnPinch={false}
        panOnDrag
        defaultEdgeOptions={{
          style: { strokeWidth: 1.5 },
          interactionWidth: 12, // wider click target on edges
        }}
      >
        <Background variant={BackgroundVariant.Dots} gap={22} size={1} color="rgb(56,76,105)" />
      </ReactFlow>
    </div>
  )
}

/* ─── sensible fallbacks if a node/edge has no `details` payload ───── */

function synthDefaultNodeDetails(node: Node): NodeInspectorDetails {
  const data = node.data as { code?: string; label?: string; kind?: string; meta?: string }
  return {
    subsystem: String(data.kind ?? 'process').toUpperCase(),
    summary: data.meta ?? `${data.label ?? node.id} — no detailed telemetry attached.`,
    analysis:
      'This node is part of the live data flow. Detailed telemetry is registered on most production nodes; this one inherits a defaults profile.',
  }
}

function synthDefaultEdgeDetails(src: string, tgt: string): EdgeInspectorDetails {
  return {
    subsystem: 'DATA CONTRACT',
    contract: `${src} → ${tgt}`,
    format: 'governed dataset (Snowflake share)',
    latency: '< 60 s',
    throughput: 'auto-scaled',
    analysis:
      'This connector carries governed data between two services. Schema is enforced upstream and lineage is captured in Horizon Catalog.',
  }
}
