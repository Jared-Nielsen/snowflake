import { create } from 'zustand'

/**
 * NodeInspectorDetails / EdgeInspectorDetails
 *
 * Optional inspector payload attached to a React Flow Node.data or Edge.data.
 * When the user clicks a node or edge in any FlowCanvas, FlowInspector renders
 * the payload as a live telemetry + analysis panel.
 *
 * Everything here is plain data so tabs can stay declarative.
 */

export interface InspectorKpi {
  label: string
  value: string
  /** Tailwind-compatible color hint via the existing tone palette */
  tone?: 'cyan' | 'amber' | 'signal' | 'copper' | 'snow' | 'flare' | 'alarm'
  delta?: string
}

export interface InspectorLineage {
  /** Source dataset · table · column */
  source: string
  /** Target Gold artifact */
  target: string
  /** Refresh cadence in human form, e.g. "1m" / "stream" / "daily" */
  refresh: string
  hash?: string
}

export interface NodeInspectorDetails {
  /** What sub-system does this node represent (drives header copy) */
  subsystem: string
  /** Sub-title under the node title */
  summary: string
  /** Optional streaming-chart key (`useStreamStore`) — appears as live mini-chart */
  streamKey?: string
  /** Unit for the streaming chart, e.g. "mm/s", "°C", "kbbl/d" */
  streamUnit?: string
  /** Soft warning / threshold for the chart */
  streamWarn?: number
  streamThreshold?: number
  /** KPI rows shown below the header */
  kpis?: InspectorKpi[]
  /** Schema columns (Snowflake table) — used for source / process nodes */
  columns?: { name: string; type: string; example?: string }[]
  /** Recent rows / events — gives the inspector "live data" */
  rows?: Record<string, string | number>[]
  /** Lineage card data */
  lineage?: InspectorLineage
  /** Where the recommendation gets pushed back */
  writeback?: string
  /** Short narrative for analysts, rendered as italic body copy */
  analysis?: string
  /** Toolkit reference, e.g. "§6.2.1" */
  toolkit?: string
  /** Cortex telemetry to display on the analysis card */
  cortex?: {
    model: string
    confidence: number
    tokens?: number
    latency_ms?: number
  }
  /** Anything else to render as a footer string */
  footer?: string
}

export interface EdgeInspectorDetails {
  subsystem: string
  /** Plain-text data contract */
  contract: string
  /** Format of the payload, e.g. "Avro / Snowpipe Streaming" */
  format?: string
  /** Latency band */
  latency?: string
  /** Approx records / sec or per refresh */
  throughput?: string
  /** Columns crossing this edge */
  columns?: { name: string; type: string }[]
  toolkit?: string
  analysis?: string
}

export type InspectorTarget =
  | { kind: 'node'; flowKey: string; id: string; label: string; code: string; details: NodeInspectorDetails }
  | { kind: 'edge'; flowKey: string; id: string; sourceLabel: string; targetLabel: string; details: EdgeInspectorDetails }

interface InspectorState {
  active: InspectorTarget | null
  selectNode: (t: Extract<InspectorTarget, { kind: 'node' }>) => void
  selectEdge: (t: Extract<InspectorTarget, { kind: 'edge' }>) => void
  close: () => void
}

export const useInspectorStore = create<InspectorState>((set) => ({
  active: null,
  selectNode: (t) => set({ active: t }),
  selectEdge: (t) => set({ active: t }),
  close:      ()  => set({ active: null }),
}))
