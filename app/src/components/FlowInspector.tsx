import { X } from 'lucide-react'
import { Panel, PanelHeader, DataRow } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { StreamChart } from '@/components/StreamChart'
import { useInspectorStore } from '@/store/inspectorStore'
import { cn } from '@/lib/utils'
import { shortTime } from '@/lib/utils'

/**
 * FlowInspector
 *
 * Right-docked panel that opens whenever a node or edge in any FlowCanvas
 * is clicked. Renders live telemetry (StreamChart), KPIs, schema columns,
 * recent rows, Cortex/Snowpark analysis, and lineage.
 *
 * The component is render-anywhere: the layout placement is up to the parent.
 * It renders nothing when no target is selected.
 */
export function FlowInspector({ className }: { className?: string }) {
  const active = useInspectorStore((s) => s.active)
  const close  = useInspectorStore((s) => s.close)

  if (!active) return null

  return (
    <Panel className={cn('flex flex-col', className)}>
      <PanelHeader
        label={
          active.kind === 'node'
            ? `INSPECT · ${active.code}`
            : `INSPECT · ${active.sourceLabel} → ${active.targetLabel}`
        }
        hint={active.kind === 'node' ? 'node telemetry' : 'data contract'}
      >
        <Badge tone="cyan">{active.kind.toUpperCase()}</Badge>
        <Badge tone="snow">{shortTime()}</Badge>
        <button
          onClick={close}
          className="ml-1 p-1 text-ink-muted hover:text-cyan transition-colors"
          aria-label="close inspector"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </PanelHeader>
      <div className="p-4 flex flex-col gap-3 overflow-y-auto">
        {active.kind === 'node' ? <NodeBody /> : <EdgeBody />}
      </div>
    </Panel>
  )
}

/* ─────────────────────────── NODE BODY ───────────────────────────── */
function NodeBody() {
  const active = useInspectorStore((s) => s.active)
  if (!active || active.kind !== 'node') return null
  const d = active.details

  return (
    <>
      {/* Identity strip */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="tag text-ink-muted">{d.subsystem}</div>
          <div className="font-cond text-base font-semibold text-snow tracking-tight">
            {active.label}
          </div>
        </div>
        <div className="flex gap-1">
          {d.toolkit && <Badge tone="cyan">{d.toolkit}</Badge>}
          {d.cortex && <Badge tone="amber">CORTEX</Badge>}
        </div>
      </div>

      {/* Summary */}
      {d.summary && (
        <div className="font-mono text-[10.5px] text-ink-muted leading-relaxed border-l-2 border-cyan/40 pl-3">
          {d.summary}
        </div>
      )}

      {/* Live telemetry */}
      {d.streamKey && (
        <div className="border border-edge-subtle p-3 bg-bg-base/40">
          <div className="flex items-center justify-between mb-1.5">
            <span className="tag text-snow">LIVE TELEMETRY · {d.streamKey}</span>
            <span className="led led-green animate-pulse-soft" />
          </div>
          <StreamChart
            streamKey={d.streamKey}
            label={d.streamKey}
            unit={d.streamUnit ?? ''}
            warn={d.streamWarn}
            threshold={d.streamThreshold}
            height={110}
            compact
          />
        </div>
      )}

      {/* KPIs */}
      {d.kpis && d.kpis.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {d.kpis.map((k) => (
            <div key={k.label} className="border border-edge-subtle bg-bg-base/40 px-3 py-2">
              <div className="tag">{k.label}</div>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span
                  className={cn(
                    'font-mono tabular-nums text-[16px]',
                    k.tone === 'alarm'  && 'text-alarm',
                    k.tone === 'amber'  && 'text-amber',
                    k.tone === 'signal' && 'text-signal',
                    k.tone === 'cyan'   && 'text-cyan',
                    k.tone === 'copper' && 'text-copper',
                    k.tone === 'flare'  && 'text-flare',
                    (!k.tone || k.tone === 'snow') && 'text-snow',
                  )}
                >
                  {k.value}
                </span>
                {k.delta && (
                  <span className="font-mono text-[10px] text-signal">{k.delta}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Schema columns */}
      {d.columns && d.columns.length > 0 && (
        <Panel className="bg-transparent">
          <PanelHeader label="SCHEMA · COLUMNS" hint={`${d.columns.length} fields`} />
          <div className="py-1 max-h-44 overflow-y-auto">
            {d.columns.map((c) => (
              <DataRow
                key={c.name}
                label={
                  <span className="flex items-center gap-2">
                    <span className="text-cyan">{c.name}</span>
                    <span className="text-ink-muted text-[10px] uppercase">{c.type}</span>
                  </span>
                }
                value={c.example ? <span className="text-ink-dim">{c.example}</span> : '—'}
              />
            ))}
          </div>
        </Panel>
      )}

      {/* Recent rows */}
      {d.rows && d.rows.length > 0 && (
        <Panel className="bg-transparent">
          <PanelHeader label="RECENT ROWS" hint={`${d.rows.length} sampled`}>
            <Badge tone="cyan">live</Badge>
          </PanelHeader>
          <div className="overflow-x-auto p-3 max-h-44 overflow-y-auto">
            <table className="w-full font-mono text-[10.5px]">
              <thead>
                <tr className="border-b border-edge-strong text-left">
                  {Object.keys(d.rows[0]).map((k) => (
                    <th key={k} className="tag text-ink-muted py-1 pr-3">{k}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {d.rows.map((r, i) => (
                  <tr key={i} className="border-b border-edge-subtle/60">
                    {Object.values(r).map((v, j) => (
                      <td key={j} className="py-1 pr-3 text-ink tabular-nums">{String(v)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      {/* Cortex / Analysis */}
      {(d.cortex || d.analysis) && (
        <Panel className="bg-transparent">
          <PanelHeader label="ANALYSIS · CORTEX" hint="auto-generated">
            {d.cortex && (
              <Badge tone="signal">{Math.round(d.cortex.confidence * 100)}%</Badge>
            )}
          </PanelHeader>
          <div className="p-3 space-y-2">
            {d.analysis && (
              <div className="font-mono text-[10.5px] text-ink leading-relaxed">
                {d.analysis}
              </div>
            )}
            {d.cortex && (
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] font-mono">
                <span className="text-ink-muted">model</span>
                <span className="text-amber">{d.cortex.model}</span>
                <span className="text-ink-muted">confidence</span>
                <span className="text-signal">{(d.cortex.confidence * 100).toFixed(1)}%</span>
                {d.cortex.tokens !== undefined && (
                  <>
                    <span className="text-ink-muted">tokens</span>
                    <span className="text-ink">{d.cortex.tokens}</span>
                  </>
                )}
                {d.cortex.latency_ms !== undefined && (
                  <>
                    <span className="text-ink-muted">latency</span>
                    <span className="text-ink">{d.cortex.latency_ms} ms</span>
                  </>
                )}
              </div>
            )}
          </div>
        </Panel>
      )}

      {/* Lineage */}
      {d.lineage && (
        <Panel className="bg-transparent">
          <PanelHeader label="HORIZON · LINEAGE" hint="catalog" />
          <div className="py-1">
            <DataRow label="source"  value={<span className="text-cyan">{d.lineage.source}</span>} />
            <DataRow label="target"  value={<span className="text-snow">{d.lineage.target}</span>} />
            <DataRow label="refresh" value={d.lineage.refresh} tone="signal" />
            {d.lineage.hash && (
              <DataRow label="hash" value={<span className="text-ink-dim text-[10px]">{d.lineage.hash}</span>} />
            )}
          </div>
        </Panel>
      )}

      {/* Writeback */}
      {d.writeback && (
        <div className="border border-edge-subtle bg-bg-base/60 px-3 py-2 font-mono text-[10px] text-signal">
          → push: {d.writeback}
        </div>
      )}

      {d.footer && (
        <div className="font-mono text-[10px] text-ink-muted border-t border-edge-subtle/60 pt-2">
          {d.footer}
        </div>
      )}
    </>
  )
}

/* ─────────────────────────── EDGE BODY ───────────────────────────── */
function EdgeBody() {
  const active = useInspectorStore((s) => s.active)
  if (!active || active.kind !== 'edge') return null
  const d = active.details

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <div className="tag text-ink-muted">{d.subsystem}</div>
          <div className="font-cond text-base font-semibold text-snow tracking-tight">
            {active.sourceLabel} → {active.targetLabel}
          </div>
        </div>
        {d.toolkit && <Badge tone="cyan">{d.toolkit}</Badge>}
      </div>

      <div className="font-mono text-[10.5px] text-ink-muted leading-relaxed border-l-2 border-cyan/40 pl-3">
        {d.contract}
      </div>

      <Panel className="bg-transparent">
        <PanelHeader label="CONTRACT · METADATA" hint="data plane" />
        <div className="py-1">
          {d.format     && <DataRow label="format"     value={d.format}     tone="cyan" />}
          {d.latency    && <DataRow label="latency"    value={d.latency}    tone="signal" />}
          {d.throughput && <DataRow label="throughput" value={d.throughput} tone="snow" />}
        </div>
      </Panel>

      {d.columns && d.columns.length > 0 && (
        <Panel className="bg-transparent">
          <PanelHeader label="SCHEMA · ON-WIRE" hint={`${d.columns.length} columns`} />
          <div className="py-1 max-h-44 overflow-y-auto">
            {d.columns.map((c) => (
              <DataRow
                key={c.name}
                label={<span className="text-cyan">{c.name}</span>}
                value={<span className="text-ink-muted text-[10px] uppercase">{c.type}</span>}
              />
            ))}
          </div>
        </Panel>
      )}

      {d.analysis && (
        <Panel className="bg-transparent">
          <PanelHeader label="ANALYSIS" hint="auto-generated" />
          <div className="p-3 font-mono text-[10.5px] text-ink leading-relaxed">
            {d.analysis}
          </div>
        </Panel>
      )}
    </>
  )
}
