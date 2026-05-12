import { useState, type ReactNode } from 'react'
import { Database, Sparkles, Copy, Check } from 'lucide-react'
import { Panel, PanelHeader } from './Card'
import { Badge } from './Badge'
import { Button } from './Button'
import { useQueryStore } from '@/store/queryStore'
import { runQuery, formatBytes, type QueryResult } from '@/lib/snowflakeClient'
import { QueryResultChart } from '@/components/QueryResultChart'
import { shortTime, cn } from '@/lib/utils'

type Tone = 'cyan' | 'amber' | 'signal' | 'copper' | 'snow' | 'flare'

/**
 * SubToolkit — full-parity §6.x.y sub-toolkit card.
 *
 * Panel-local: clicking "Query Snowflake" on this card does NOT dim the
 * other sub-toolkit cards. Each card maintains its own running flag.
 *
 * When `sql` is provided the card renders:
 *   - "Query Snowflake" / "Run Cortex AI" buttons
 *   - WHAT THIS MEANS — plain-English interpretation strip
 *   - CHART / TEXT toggle (chart visualizes mock data)
 *   - telemetry strip (warehouse, dur, rows, scan, cortex conf)
 */
export function SubToolkit({
  id,
  title,
  badge,
  badgeTone = 'cyan',
  tagline,
  formula,
  readout,
  footer,
  children,
  sql,
  mock,
  cortex = true,
  rows: rowsHint,
  minMs = 380,
  maxMs = 1800,
  explanation,
}: {
  id: string
  title: string
  badge?: string
  badgeTone?: Tone
  tagline?: string
  formula?: ReactNode
  readout?: ReactNode
  footer?: ReactNode
  children?: ReactNode
  sql?: string
  mock?: unknown
  cortex?: boolean
  rows?: number
  minMs?: number
  maxMs?: number
  /** Optional plain-English interpretation factory. */
  explanation?: (mock: unknown) => string
}) {
  const recordGlobal = useQueryStore((s) => s.run)
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<QueryResult | null>(null)
  const [showSql, setShowSql] = useState(false)
  const [copied, setCopied] = useState(false)
  const [didFire, setDidFire] = useState(false)
  const [view, setView] = useState<'text' | 'chart'>('text')

  async function trigger(useCortex: boolean) {
    if (!sql) return
    setRunning(true)
    const res = await runQuery(sql, {
      rows: rowsHint,
      cortex: useCortex && cortex,
      mock,
      minMs,
      maxMs,
    })
    void recordGlobal(sql, { rows: rowsHint, cortex: useCortex && cortex, mock, minMs: 0, maxMs: 0 }).catch(() => {})
    setResult(res)
    setDidFire(true)
    setRunning(false)
  }

  async function copySql() {
    if (!sql) return
    try {
      await navigator.clipboard.writeText(sql)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {/* clipboard may be blocked */}
  }

  const interpretation = result
    ? (explanation ? explanation(mock) : defaultExplanation(mock, result))
    : null

  return (
    <Panel className="flex flex-col">
      <PanelHeader label={`${id} · ${title}`} hint="sub-toolkit">
        {badge && <Badge tone={badgeTone}>{badge}</Badge>}
        {sql && (
          <Badge tone={didFire ? (running ? 'amber' : 'signal') : 'snow'}>
            {running ? 'RUNNING…' : didFire ? 'OK' : 'READY'}
          </Badge>
        )}
      </PanelHeader>
      <div className="p-4 flex flex-col gap-3 flex-1">
        {tagline && (
          <div className="font-mono text-[10.5px] leading-relaxed text-ink-muted">
            {tagline}
          </div>
        )}
        {formula && (
          <div className="border-y border-edge-subtle/60 py-3 my-1 space-y-2">
            {formula}
          </div>
        )}
        {readout}
        {children}

        {sql && (
          <div className="flex flex-col gap-2 mt-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                onClick={() => trigger(false)}
                disabled={running}
                variant="primary"
                size="sm"
              >
                <Database className="w-3 h-3 mr-1.5" strokeWidth={2} />
                Query Snowflake
              </Button>
              {cortex && (
                <Button
                  onClick={() => trigger(true)}
                  disabled={running}
                  variant="ghost"
                  size="sm"
                >
                  <Sparkles className="w-3 h-3 mr-1.5 text-cyan" strokeWidth={2} />
                  Run Cortex AI
                </Button>
              )}
              <button
                onClick={() => setShowSql(v => !v)}
                className="ml-auto tag text-ink-muted hover:text-cyan transition-colors"
                aria-label="toggle SQL"
              >
                {showSql ? 'HIDE SQL' : 'SHOW SQL'}
              </button>
              {result && (
                <div className="inline-flex border border-edge-subtle ml-1">
                  {(['text', 'chart'] as const).map((v) => (
                    <button
                      key={v}
                      onClick={() => setView(v)}
                      className={cn(
                        'px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.16em] transition-colors',
                        view === v ? 'bg-cyan/15 text-cyan' : 'text-ink-muted hover:text-ink-dim',
                      )}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {showSql && (
              <div className="relative">
                <pre className="bg-bg-base/80 border border-edge-subtle p-3 pr-10 text-[10.5px] font-mono leading-relaxed text-cyan/90 overflow-x-auto whitespace-pre-wrap max-h-40">
                  {sql}
                </pre>
                <button
                  onClick={copySql}
                  className="absolute top-2 right-2 p-1.5 text-ink-muted hover:text-cyan transition-colors"
                  aria-label="copy SQL"
                >
                  {copied
                    ? <Check className="w-3.5 h-3.5 text-signal" />
                    : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            )}

            {result && (
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] font-mono text-ink-muted border-y border-edge-subtle/60 py-1.5">
                <span><span className="text-ink-muted/60">wh </span><span className="text-cyan">{result.warehouse}</span></span>
                <span><span className="text-ink-muted/60">dur </span><span className="text-ink">{result.duration_ms}</span> ms</span>
                <span><span className="text-ink-muted/60">rows </span><span className="text-ink">{result.rows.toLocaleString()}</span></span>
                <span><span className="text-ink-muted/60">scan </span><span className="text-ink">{formatBytes(result.bytes_scanned)}</span></span>
                {result.cortex && (
                  <span>
                    <span className="text-ink-muted/60">cortex </span>
                    <span className="text-amber">{result.cortex.model}</span>
                    <span className="text-ink-muted/60"> · conf </span>
                    <span className="text-signal">{(result.cortex.confidence * 100).toFixed(1)}%</span>
                  </span>
                )}
                <span className="ml-auto"><span className="text-ink-muted/60">at </span>{shortTime()}</span>
              </div>
            )}

            {interpretation && (
              <div className="bg-cyan/5 border border-cyan/30 px-3 py-2 text-[10.5px] font-mono leading-relaxed text-snow">
                <span className="tag text-cyan mr-2">WHAT THIS MEANS</span>
                {interpretation}
              </div>
            )}

            {result && view === 'chart' && (
              <div className="bg-bg-base/90 border border-edge-subtle p-3">
                <QueryResultChart mock={mock} />
              </div>
            )}
          </div>
        )}

        {footer && (
          <div className="mt-auto pt-2 border-t border-edge-subtle/60 font-mono text-[10px] text-ink-muted">
            {footer}
          </div>
        )}
      </div>
    </Panel>
  )
}

/* ─── fallback plain-English explanation ─────────────────────────── */
function defaultExplanation(mock: unknown, _r: QueryResult): string {
  if (!mock || typeof mock !== 'object') return 'Query executed. The raw rows are in the buffer above.'
  const obj = mock as Record<string, unknown>

  if ('recommendation' in obj) {
    return `Recommendation returned: ${String(obj.recommendation)}.`
  }
  if ('action' in obj) {
    return `Suggested action: ${String(obj.action)}.`
  }
  if ('mode_selected' in obj) {
    return `Optimal mode selected: ${String(obj.mode_selected)} for the next ${obj.locked_window_h ?? 24}h.`
  }
  if ('reactor_t_suggested_c' in obj) {
    return `Setpoint suggestion: raise reactor T to ${obj.reactor_t_suggested_c} °C (+${obj.delta_c} °C). Expected gasoline yield +${((obj.gasoline_yield_delta_pct as number) * 100).toFixed(2)}%.`
  }
  if ('r_f' in obj) {
    return `Fouling resistance is ${(obj.r_f as number).toExponential(1)}. ${obj.action ? `Action: ${String(obj.action)}.` : ''} Clean window: ${obj.clean_window ?? 'TBD'}.`
  }
  if ('p_failure_48h' in obj) {
    return `48-hour failure probability ${((obj.p_failure_48h as number) * 100).toFixed(0)}%. WO ${obj.work_order ?? 'pending'}.`
  }
  if ('p50_next_30d_usd' in obj) {
    return `30-day cashflow P50 ≈ $${formatN(Number(obj.p50_next_30d_usd))}. Tight window: ${obj.tight_window ?? 'none'}.`
  }
  if ('cdu_throughput_kbbl_d' in obj) {
    return `What-if at ${obj.derate_pct}% derate: CDU runs at ${obj.cdu_throughput_kbbl_d} kbbl/d, margin Δ $${obj.contribution_margin_delta_usd_d}/day, MTBF +${obj.mtbf_delta_days}d.`
  }
  if ('counterparties' in obj) {
    return `Composite scores updated for ${obj.counterparties} counterparties. ${obj.alerts_24h ?? 0} alerts in last 24h.`
  }
  if ('intensity_kg_per_bbl' in obj) {
    return `Carbon intensity ${(obj.intensity_kg_per_bbl as number).toFixed(1)} kg/bbl (baseline ${obj.baseline_intensity_kg_per_bbl}).`
  }
  return 'Cortex AI returned the structured result above. Switch to the CHART tab to see the numeric fields graphed.'
}

function formatN(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (Math.abs(n) >= 1_000)     return `${(n / 1_000).toFixed(0)}k`
  return n.toFixed(0)
}
