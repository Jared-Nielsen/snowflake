import { Handle, Position, type NodeProps } from '@xyflow/react'
import { cn } from '@/lib/utils'
import type { NodeInspectorDetails } from '@/store/inspectorStore'

export type SchematicKind = 'source' | 'process' | 'sink' | 'ai' | 'output' | 'risk'
export type SchematicStatus = 'ok' | 'warn' | 'alarm' | 'idle' | 'ai'

export interface SchematicNodeData {
  code: string
  label: string
  kind?: SchematicKind
  status?: SchematicStatus
  meta?: string
  /** Optional inspector payload (see inspectorStore.ts) */
  details?: NodeInspectorDetails
  /** Set by FlowCanvas when this node is the active inspector target */
  _selected?: boolean
  /** Allow Record<string, unknown> from xyflow's NodeProps generic */
  [key: string]: unknown
}

const KIND_BORDER: Record<SchematicKind, string> = {
  source:  'border-copper',
  process: 'border-edge-strong',
  sink:    'border-snow',
  ai:      'border-cyan',
  output:  'border-signal',
  risk:    'border-flare',
}

const KIND_LABEL: Record<SchematicKind, string> = {
  source:  'text-copper',
  process: 'text-ink-dim',
  sink:    'text-snow',
  ai:      'text-cyan',
  output:  'text-signal',
  risk:    'text-flare',
}

const STATUS_LED: Record<SchematicStatus, string> = {
  ok:    'led-green',
  warn:  'led-amber',
  alarm: 'led-red',
  idle:  'led-off',
  ai:    'led-cyan',
}

export function SchematicNode({ data }: NodeProps & { data: SchematicNodeData }) {
  const kind: SchematicKind = data.kind ?? 'process'
  const status: SchematicStatus = data.status ?? 'ok'
  const selected = !!data._selected

  return (
    <div
      className={cn(
        'group relative bg-bg-panel/95 backdrop-blur-sm border min-w-[174px] px-3 py-2.5',
        'cursor-grab active:cursor-grabbing transition-all',
        'hover:bg-bg-panel hover:shadow-[0_0_0_1px_rgba(78,226,244,0.18)]',
        KIND_BORDER[kind],
        selected && 'shadow-[0_0_0_2px_rgba(78,226,244,0.8),0_0_18px_rgba(78,226,244,0.35)]',
      )}
    >
      {/* corner ticks (drawn in same color as border) */}
      <span className={cn('absolute -top-px -left-px w-1.5 h-1.5 border-t border-l', KIND_BORDER[kind])} />
      <span className={cn('absolute -top-px -right-px w-1.5 h-1.5 border-t border-r', KIND_BORDER[kind])} />
      <span className={cn('absolute -bottom-px -left-px w-1.5 h-1.5 border-b border-l', KIND_BORDER[kind])} />
      <span className={cn('absolute -bottom-px -right-px w-1.5 h-1.5 border-b border-r', KIND_BORDER[kind])} />

      <div className="flex items-center justify-between gap-2 mb-0.5">
        <span className={cn('font-mono text-[10px] uppercase tracking-[0.18em]', KIND_LABEL[kind])}>
          {data.code}
        </span>
        <span
          className={cn(
            'led',
            STATUS_LED[status],
            status !== 'idle' && status !== 'ai' && 'animate-pulse-soft',
          )}
        />
      </div>
      <div className="font-cond text-[13px] uppercase tracking-wide font-semibold text-ink leading-tight">
        {data.label}
      </div>
      {data.meta && (
        <div className="font-mono text-[10px] text-ink-muted mt-1 truncate">{data.meta}</div>
      )}

      {/* Subtle inspect hint, fades in on hover */}
      <div
        className={cn(
          'absolute -top-2 right-2 px-1.5 py-0.5 text-[8px] font-mono uppercase tracking-[0.18em]',
          'bg-bg-base border border-cyan/50 text-cyan',
          'opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none',
          selected && 'opacity-100',
        )}
      >
        {selected ? 'INSPECTING' : 'CLICK · DRAG'}
      </div>

      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  )
}
