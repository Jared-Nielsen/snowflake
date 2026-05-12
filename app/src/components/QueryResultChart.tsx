/**
 * QueryResultChart — generic mini-viz that visualizes whatever data shape
 * is in `mock`. Falls back to a "no chart" message when nothing is plottable.
 *
 * Heuristics for what to render:
 *   1. If `mock` has a numeric array under a known key (yields, paths, history, series, scorecards, leak_locations),
 *      render as a bar chart.
 *   2. If `mock` looks like a forecast (p5/p50/p95 + horizon_days), render as a fan-strip.
 *   3. If `mock` has a flat record of numeric leaf values (subset), render as a horizontal bar.
 *   4. Otherwise, render a "no chart available — see TEXT tab" notice.
 *
 * Kept dependency-free (pure SVG) to avoid pulling chart libs.
 */

interface ChartPoint { label: string; value: number; tone?: 'cyan' | 'amber' | 'signal' | 'alarm' | 'snow' }

const TONE_FILL: Record<NonNullable<ChartPoint['tone']>, string> = {
  cyan:   '#4ee2f4',
  amber:  '#ffb627',
  signal: '#34d57b',
  alarm:  '#ef4444',
  snow:   '#1ea7ff',
}

export function QueryResultChart({ mock }: { mock: unknown }) {
  const pts = tryExtractPoints(mock)
  if (pts && pts.length > 0) return <BarChart points={pts} />

  const forecast = tryExtractForecast(mock)
  if (forecast) return <ForecastStrip {...forecast} />

  return (
    <div className="h-[180px] flex items-center justify-center text-ink-muted font-mono text-[11px] border border-edge-subtle bg-bg-base/40">
      no chartable series in this result · open the TEXT tab
    </div>
  )
}

/* ─── Bar chart ─────────────────────────────────────────────────── */
function BarChart({ points }: { points: ChartPoint[] }) {
  const W = 580
  const H = 180
  const PAD_L = 110
  const PAD_R = 24
  const PAD_T = 14
  const PAD_B = 14

  const max = Math.max(...points.map((p) => Math.abs(p.value)), 1)
  const usableW = W - PAD_L - PAD_R
  const usableH = H - PAD_T - PAD_B
  const rowH = points.length > 0 ? usableH / points.length : usableH
  const barH = Math.max(6, rowH - 8)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[180px] font-mono">
      <line
        x1={PAD_L} x2={PAD_L}
        y1={PAD_T} y2={H - PAD_B}
        stroke="#1e3049"
        strokeWidth="1"
      />
      {points.map((p, i) => {
        const y = PAD_T + i * rowH + (rowH - barH) / 2
        const w = (Math.abs(p.value) / max) * usableW
        const fill = TONE_FILL[p.tone ?? 'cyan']
        return (
          <g key={p.label}>
            <text
              x={PAD_L - 8}
              y={y + barH / 2 + 3}
              fontSize="9"
              fill="#7a8aa1"
              textAnchor="end"
            >
              {p.label}
            </text>
            <rect x={PAD_L} y={y} width={w} height={barH} fill={fill} opacity="0.72" />
            <rect x={PAD_L} y={y} width={w} height={barH} fill="none" stroke={fill} strokeWidth="1" />
            <text
              x={PAD_L + w + 6}
              y={y + barH / 2 + 3}
              fontSize="9"
              fill="#c8d4e6"
            >
              {formatValue(p.value)}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

/* ─── Forecast fan-strip (P5 / P50 / P95) ───────────────────────── */
interface ForecastStrip { p5: number; p50: number; p95: number; horizonDays: number; mape?: number }

function ForecastStrip({ p5, p50, p95, horizonDays, mape }: ForecastStrip) {
  const W = 580
  const H = 180
  const PAD = 30

  const samples = Array.from({ length: horizonDays }, (_, i) => {
    const x = i / Math.max(1, horizonDays - 1)
    return {
      x,
      mid: p50 * x + p50 * 0.4,
      sigma: (p95 - p5) / 4,
    }
  })

  const toX = (i: number) => PAD + (i / Math.max(1, horizonDays - 1)) * (W - PAD * 2)
  const toY = (v: number) => {
    const maxV = p95 * 1.1
    return H - PAD - (v / maxV) * (H - PAD * 2)
  }

  const bandPath = (lo: number, hi: number) => {
    const top = samples.map((s, i) => `${i === 0 ? 'M' : 'L'}${toX(i).toFixed(1)},${toY(s.mid + hi * s.sigma).toFixed(1)}`).join(' ')
    const bot = samples
      .slice()
      .reverse()
      .map((s, idx) => {
        const i = horizonDays - 1 - idx
        return `L${toX(i).toFixed(1)},${toY(s.mid + lo * s.sigma).toFixed(1)}`
      })
      .join(' ')
    return `${top} ${bot} Z`
  }

  const median = samples
    .map((s, i) => `${i === 0 ? 'M' : 'L'}${toX(i).toFixed(1)},${toY(s.mid).toFixed(1)}`)
    .join(' ')

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[180px] font-mono">
      <defs>
        <linearGradient id="fcst95" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%"  stopColor="#4ee2f4" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#4ee2f4" stopOpacity="0.04" />
        </linearGradient>
        <linearGradient id="fcst50" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%"  stopColor="#34d57b" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#34d57b" stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <path d={bandPath(-1.96, 1.96)} fill="url(#fcst95)" />
      <path d={bandPath(-0.67, 0.67)} fill="url(#fcst50)" />
      <path d={median} fill="none" stroke="#4ee2f4" strokeWidth="1.6" />
      <text x={PAD} y={H - 6} fontSize="9" fill="#7a8aa1">T+0</text>
      <text x={W / 2} y={H - 6} fontSize="9" fill="#7a8aa1" textAnchor="middle">T+{Math.floor(horizonDays/2)}d</text>
      <text x={W - PAD} y={H - 6} fontSize="9" fill="#7a8aa1" textAnchor="end">T+{horizonDays}d</text>
      <text x={4} y={PAD + 8} fontSize="9" fill="#34d57b">P50</text>
      <text x={4} y={PAD + 22} fontSize="9" fill="#4ee2f4">P5/P95</text>
      {mape !== undefined && (
        <text x={W - PAD} y={PAD} fontSize="9" fill="#7a8aa1" textAnchor="end">
          MAPE {(mape * 100).toFixed(1)}%
        </text>
      )}
    </svg>
  )
}

/* ─── Heuristic extractors ──────────────────────────────────────── */

function tryExtractPoints(raw: unknown): ChartPoint[] | null {
  if (!raw || typeof raw !== 'object') return null
  const obj = raw as Record<string, unknown>

  // 1. Yields dict (e.g. MarginTab cortexMock.yields)
  if (obj.yields && typeof obj.yields === 'object') {
    return Object.entries(obj.yields as Record<string, number>).map(([k, v]) => ({
      label: k,
      value: Number(v),
      tone: 'cyan',
    }))
  }

  // 2. Scorecards (counterparty)
  if (Array.isArray(obj.scorecards)) {
    return (obj.scorecards as Array<{ name: string; composite: number; status?: string }>).map((s) => ({
      label: s.name,
      value: s.composite,
      tone: s.status === 'ESCALATE' ? 'alarm' : s.status === 'WATCH' ? 'amber' : 'signal',
    }))
  }

  // 3. Tool registry (cortex agents)
  if (Array.isArray(obj.tool_registry)) {
    return (obj.tool_registry as string[]).map((t, i) => ({
      label: t,
      value: 1 + (i % 4) * 0.25,
      tone: 'cyan',
    }))
  }

  // 4. Recommended dispatch (logistics)
  if (Array.isArray(obj.recommended_dispatch)) {
    return (obj.recommended_dispatch as Array<{ tanker: string; cargo_kbbl: number }>).map((d) => ({
      label: d.tanker,
      value: d.cargo_kbbl,
      tone: 'cyan',
    }))
  }

  // 5. Shares (marketplace) — equal-value visual
  if (Array.isArray(obj.shares)) {
    return (obj.shares as Array<{ name: string }>).map((s) => ({
      label: s.name.replace(/_/g, ' '),
      value: 100,
      tone: 'snow',
    }))
  }

  // 6. Generic: scan keys, gather any numeric leaves with sane labels
  const numericLeaves: ChartPoint[] = []
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === 'number' && Number.isFinite(v) && Math.abs(v) > 0) {
      // Skip noisy fields
      if (/(time|ts|epoch|hash|id)$/i.test(k)) continue
      numericLeaves.push({
        label: k.replace(/_/g, ' '),
        value: v,
        tone: pickTone(k),
      })
    }
    if (numericLeaves.length >= 8) break
  }
  return numericLeaves.length >= 2 ? numericLeaves : null
}

function tryExtractForecast(raw: unknown): ForecastStrip | null {
  if (!raw || typeof raw !== 'object') return null
  const obj = raw as Record<string, unknown>
  const p50 =
    (obj.p50_next_30d_usd as number | undefined) ??
    (obj.p50 as number | undefined)
  const p5 =
    (obj.p5_lower_band_usd as number | undefined) ??
    (obj.p5 as number | undefined)
  const p95 =
    (obj.p95_upper_band_usd as number | undefined) ??
    (obj.p95 as number | undefined)
  const horizon =
    (obj.horizon_days as number | undefined) ??
    (obj.forecast_horizon_days as number | undefined)

  if (
    typeof p5 === 'number' &&
    typeof p50 === 'number' &&
    typeof p95 === 'number' &&
    typeof horizon === 'number'
  ) {
    return { p5, p50, p95, horizonDays: horizon, mape: obj.mape_backtest_pct as number | undefined }
  }
  return null
}

function pickTone(key: string): ChartPoint['tone'] {
  if (/loss|alarm|fail|risk|delta/i.test(key)) return 'alarm'
  if (/warn|amber|stress/i.test(key))           return 'amber'
  if (/gain|uplift|saving|signal|margin|score/i.test(key)) return 'signal'
  if (/cortex|conf|model/i.test(key)) return 'cyan'
  return 'snow'
}

function formatValue(v: number): string {
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M`
  if (Math.abs(v) >= 1_000)     return `${(v / 1_000).toFixed(1)}k`
  if (Number.isInteger(v))      return v.toString()
  return v.toFixed(2)
}
