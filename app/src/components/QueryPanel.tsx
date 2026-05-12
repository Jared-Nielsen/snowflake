import { useState } from 'react'
import { Database, Sparkles, Activity, Copy, Check } from 'lucide-react'
import { Button } from './ui/Button'
import { Panel, PanelHeader } from './ui/Card'
import { Badge } from './ui/Badge'
import { QueryResultChart } from './QueryResultChart'
import { runQuery, formatBytes, type QueryResult } from '@/lib/snowflakeClient'
import { useQueryStore } from '@/store/queryStore'
import { shortTime, cn } from '@/lib/utils'

export interface QueryPanelProps {
  title: string
  sql: string
  cortex?: boolean
  mock: unknown
  rows?: number
  /** Plain-text formatter for the result buffer. Receives the same `mock` value. */
  formatter?: (mock: unknown) => string
  /** Optional plain-English interpretation factory. Receives the same `mock` value. */
  explanation?: (mock: unknown) => string
  /** Extra badges to render in the header. */
  headerBadges?: React.ReactNode
}

const DEFAULT_OUTPUT = `// Snowflake terminal · ready
// Connection : XCMP zero-copy · governed
// Warehouse  : REFINERY_AI_XL  ·  Region: us-east-2
// Hit "Query Snowflake (Zero-Copy)" or "Run Cortex AI" to populate buffer.`

export function QueryPanel({
  title,
  sql,
  cortex,
  mock,
  rows,
  formatter,
  explanation,
  headerBadges,
}: QueryPanelProps) {
  const recordGlobal = useQueryStore((s) => s.run)
  const [running, setRunning] = useState(false)
  const [active, setActive] = useState<QueryResult | null>(null)
  const [output, setOutput] = useState<string>(DEFAULT_OUTPUT)
  const [view, setView] = useState<'text' | 'chart'>('text')
  const [copied, setCopied] = useState(false)
  const [lastMode, setLastMode] = useState<'sql' | 'cortex' | 'pipe' | null>(null)

  async function trigger(mode: 'sql' | 'cortex' | 'pipe') {
    setRunning(true)
    setLastMode(mode)
    // Run the request via the snowflakeClient directly so other panels aren't
    // forced into a global "RUNNING…" state. Still mirror to the global store
    // for header-level history/telemetry consumers.
    const res = await runQuery(sql, {
      rows,
      cortex: mode === 'cortex' && !!cortex,
      mock,
      minMs: mode === 'pipe' ? 220 : 420,
      maxMs: mode === 'pipe' ? 700 : 1900,
    })
    // Fire-and-forget: log into the global history without awaiting.
    // recordGlobal returns a promise but we already have the result locally.
    void recordGlobal(sql, {
      rows,
      cortex: mode === 'cortex' && !!cortex,
      mock,
      minMs: 0,
      maxMs: 0,
    }).catch(() => {/* ignore */})
    setActive(res)
    const fmt = formatter ? formatter(mock) : JSON.stringify(mock, null, 2)
    setOutput(fmt)
    setRunning(false)
  }

  async function copySQL() {
    try {
      await navigator.clipboard.writeText(sql)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {/* clipboard may be blocked */}
  }

  const interpretation = active
    ? (explanation ? explanation(mock) : defaultExplanation(mock, lastMode, active))
    : null

  return (
    <Panel className="flex flex-col h-full">
      <PanelHeader label={title} hint={cortex ? 'cortex · zero-copy' : 'zero-copy mock'}>
        {headerBadges}
        <Badge tone={running ? 'amber' : 'snow'}>
          {running ? 'RUNNING…' : 'READY'}
        </Badge>
      </PanelHeader>

      <div className="p-4 flex flex-col gap-3 flex-1 min-h-0">
        <div className="relative">
          <pre className="bg-bg-base/80 border border-edge-subtle p-3 pr-10 text-[11px] font-mono leading-relaxed text-cyan/90 overflow-x-auto whitespace-pre-wrap max-h-44">
            {sql}
          </pre>
          <button
            onClick={copySQL}
            className="absolute top-2 right-2 p-1.5 text-ink-muted hover:text-cyan transition-colors"
            aria-label="copy SQL"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-signal" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={() => trigger('sql')} disabled={running} variant="primary" size="sm">
            <Database className="w-3 h-3 mr-1.5" strokeWidth={2} />
            Query Snowflake
          </Button>
          {cortex && (
            <Button onClick={() => trigger('cortex')} disabled={running} variant="ghost" size="sm">
              <Sparkles className="w-3 h-3 mr-1.5 text-cyan" strokeWidth={2} />
              Run Cortex AI
            </Button>
          )}
          <Button onClick={() => trigger('pipe')} disabled={running} variant="ghost" size="sm">
            <Activity className="w-3 h-3 mr-1.5 text-amber" strokeWidth={2} />
            Simulate Snowpipe
          </Button>
          <div className="ml-auto flex items-center gap-1">
            <ViewToggle current={view} onChange={setView} disabled={!active} />
          </div>
        </div>

        {active && (
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-mono text-ink-muted border-y border-edge-subtle/60 py-1.5">
            <span><span className="text-ink-muted/60">wh </span><span className="text-cyan">{active.warehouse}</span></span>
            <span><span className="text-ink-muted/60">dur </span><span className="text-ink">{active.duration_ms}</span> ms</span>
            <span><span className="text-ink-muted/60">rows </span><span className="text-ink">{active.rows.toLocaleString()}</span></span>
            <span><span className="text-ink-muted/60">scan </span><span className="text-ink">{formatBytes(active.bytes_scanned)}</span></span>
            {active.cortex && (
              <span>
                <span className="text-ink-muted/60">cortex </span>
                <span className="text-amber">{active.cortex.model}</span>
                <span className="text-ink-muted/60"> · conf </span>
                <span className="text-signal">{(active.cortex.confidence * 100).toFixed(1)}%</span>
              </span>
            )}
            <span><span className="text-ink-muted/60">at </span>{shortTime()}</span>
          </div>
        )}

        {/* "What this means" — plain-English interpretation */}
        {interpretation && (
          <div className="bg-cyan/5 border border-cyan/30 px-3 py-2 text-[10.5px] font-mono leading-relaxed text-snow">
            <span className="tag text-cyan mr-2">WHAT THIS MEANS</span>
            {interpretation}
          </div>
        )}

        {/* TEXT or CHART pane */}
        {view === 'chart' && active ? (
          <div className="bg-bg-base/90 border border-edge-subtle p-3 flex-1 min-h-[180px]">
            <QueryResultChart mock={mock} />
          </div>
        ) : (
          <pre className="bg-bg-base/90 border border-edge-subtle p-4 text-[11px] font-mono leading-relaxed text-signal overflow-auto flex-1 min-h-[180px]">
            {output}
          </pre>
        )}
      </div>
    </Panel>
  )
}

/* ─── view toggle (text / chart) ─────────────────────────────────── */
function ViewToggle({
  current,
  onChange,
  disabled,
}: {
  current: 'text' | 'chart'
  onChange: (v: 'text' | 'chart') => void
  disabled: boolean
}) {
  return (
    <div className="inline-flex border border-edge-subtle">
      {(['text', 'chart'] as const).map((v) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          disabled={disabled}
          className={cn(
            'px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.16em] transition-colors',
            current === v
              ? 'bg-cyan/15 text-cyan'
              : 'text-ink-muted hover:text-ink-dim',
            disabled && 'opacity-40 cursor-not-allowed',
          )}
        >
          {v}
        </button>
      ))}
    </div>
  )
}

/* ─── fallback plain-English explanation ─────────────────────────── */
function defaultExplanation(mock: unknown, mode: string | null, _r: QueryResult): string {
  if (!mock || typeof mock !== 'object') {
    return mode === 'pipe'
      ? 'Snowpipe ingest simulated. Rows above are the records that just landed in Bronze.'
      : 'Query executed. The buffer below shows the raw result rows.'
  }
  const obj = mock as Record<string, unknown>

  // Common interpretation patterns
  if ('recommendation' in obj) {
    return `Recommendation: ${String(obj.recommendation)}.` +
      (obj.margin_uplift_usd_day ? ` Expected uplift ~$${formatNum(Number(obj.margin_uplift_usd_day))}/day.` : '')
  }
  if ('p_failure_14d' in obj || 'p_failure_48h' in obj) {
    const p = Number(obj.p_failure_48h ?? obj.p_failure_14d ?? 0)
    return `Failure probability scored at ${(p * 100).toFixed(0)}%. Reliability action recommended above the threshold.`
  }
  if ('var_99_1d_usd' in obj) {
    return `1-day 99% Value at Risk computed at $${formatNum(Number(obj.var_99_1d_usd))}. Hedge effectiveness ${((obj.hedge_effectiveness as number) * 100).toFixed(1)}%.`
  }
  if ('intensity_kg_per_bbl' in obj) {
    return `Live carbon intensity is ${(obj.intensity_kg_per_bbl as number).toFixed(1)} kg/bbl. Methane leaks detected: ${obj.methane_leaks_detected ?? 0}.`
  }
  if ('mode_selected' in obj) {
    return `Optimal slate mode: ${String(obj.mode_selected)}. Locked for ${obj.locked_window_h ?? 24} hours.`
  }
  if ('p50_next_30d_usd' in obj) {
    return `Forecast median cashflow next 30d: $${formatNum(Number(obj.p50_next_30d_usd))}. P5 lower band: $${formatNum(Number(obj.p5_lower_band_usd))}.`
  }
  if ('composite' in obj || 'scorecards' in obj) {
    return 'Counterparty composite scores updated. Watchlist items surface in the Today\'s Scorecards panel.'
  }
  if ('user_query' in obj && 'generated_sql' in obj) {
    return `Cortex Analyst translated the NL question into governed SQL and returned ${obj.rows_returned ?? '?'} rows.`
  }
  if ('action' in obj) {
    return `Action returned: ${String(obj.action)}.`
  }

  return mode === 'pipe'
    ? 'Snowpipe ingest simulated. Rows above are the records that just landed in Bronze.'
    : mode === 'cortex'
      ? 'Cortex AI returned the structured result above. The CHART tab visualizes the numeric fields.'
      : 'Snowflake returned the result above. Switch to the CHART tab to see the values graphed.'
}

function formatNum(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`
  if (Math.abs(n) >= 1_000)     return `${(n / 1_000).toFixed(1)}k`
  return n.toFixed(0)
}
