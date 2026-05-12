import dagre from 'dagre'
import type { Node, Edge } from '@xyflow/react'

/**
 * Run a Dagre layered layout over a React Flow graph and return new node
 * positions (left-to-right by default).
 *
 * Each node is treated as a fixed-size rectangle (defaults match the
 * SchematicNode card). The function is pure: it returns new Node + Edge
 * arrays without mutating the inputs.
 */
export interface AutoLayoutOptions {
  /** Layout direction. 'LR' = left → right · 'TB' = top → bottom */
  direction?: 'LR' | 'TB' | 'RL' | 'BT'
  /** Horizontal/vertical gap between nodes (Dagre rank/node sep). */
  nodeSep?: number
  rankSep?: number
  /** Per-node size used by the layout engine. */
  nodeWidth?: number
  nodeHeight?: number
}

export function autoLayout<N extends Node, E extends Edge>(
  nodes: N[],
  edges: E[],
  opts: AutoLayoutOptions = {},
): { nodes: N[]; edges: E[] } {
  const {
    direction = 'LR',
    nodeSep = 50,
    rankSep = 90,
    nodeWidth = 188,
    nodeHeight = 78,
  } = opts

  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: direction, nodesep: nodeSep, ranksep: rankSep, marginx: 24, marginy: 24 })

  nodes.forEach((n) => {
    g.setNode(n.id, { width: nodeWidth, height: nodeHeight })
  })
  edges.forEach((e) => {
    g.setEdge(e.source, e.target)
  })

  dagre.layout(g)

  const laidOutNodes: N[] = nodes.map((n) => {
    const pos = g.node(n.id)
    if (!pos) return n
    // Dagre returns centers; React Flow uses top-left.
    return {
      ...n,
      position: { x: pos.x - nodeWidth / 2, y: pos.y - nodeHeight / 2 },
    }
  })

  return { nodes: laidOutNodes, edges }
}
