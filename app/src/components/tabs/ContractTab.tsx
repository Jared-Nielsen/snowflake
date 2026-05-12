import { Panel, PanelHeader, Kpi, DataRow } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { SubToolkit } from '@/components/ui/SubToolkit'
import { FlowCanvas } from '@/components/FlowCanvas'
import { FlowInspector } from '@/components/FlowInspector'
import { QueryPanel } from '@/components/QueryPanel'
import { InvoiceFlow } from '@/components/three/InvoiceFlow'
import { Tex } from '@/lib/katex'
import { cn, formatUSD, formatUSDk } from '@/lib/utils'
import { decorateNodes, decorateEdges } from '@/lib/flowDetails'
import { QUORUM, SIRION, ANCHOR_BATCH } from '@/lib/mockData'
import type { Node, Edge } from '@xyflow/react'
import type { SirionContract } from '@/types'

const nodes: Node[] = [
  { id: 'quorum', type: 'schematic', position: { x:   0, y:   0 }, data: { code: 'QUORUM',       label: 'Physical Flows',     kind: 'source',  status: 'ok',   meta: `${QUORUM.length} flows · live`     } },
  { id: 'sirion', type: 'schematic', position: { x:   0, y: 130 }, data: { code: 'SIRION',       label: 'Contracts',          kind: 'source',  status: 'ok',   meta: `${SIRION.length} active · API>32` } },
  { id: 'sap',    type: 'schematic', position: { x:   0, y: 260 }, data: { code: 'SAP',          label: 'Finance · cash',     kind: 'process', status: 'ok',   meta: 'FIN-001 → $1.85M'                  } },
  { id: 'snow',   type: 'schematic', position: { x: 320, y: 130 }, data: { code: 'SNOW · JOIN',  label: 'Snowpark Reconcile', kind: 'ai',      status: 'ai',   meta: 'ts−1h window'                      } },
  { id: 'ledger', type: 'schematic', position: { x: 640, y:  65 }, data: { code: 'OUT · LEDGER', label: 'Reconciled Ledger',  kind: 'output',  status: 'ok',   meta: 'Δ surfaced t+0s'                   } },
  { id: 'cash',   type: 'schematic', position: { x: 640, y: 195 }, data: { code: 'OUT · CASH',   label: 'Cash Posted',        kind: 'sink',    status: 'ok',   meta: 'auto-clear'                        } },
]

const edges: Edge[] = [
  { id: 'e1', source: 'quorum', target: 'snow',   animated: true, style: { stroke: '#c79a4a' } },
  { id: 'e2', source: 'sirion', target: 'snow',   animated: true, style: { stroke: '#c79a4a' } },
  { id: 'e3', source: 'sap',    target: 'snow',   animated: true, style: { stroke: '#1ea7ff' } },
  { id: 'e4', source: 'snow',   target: 'ledger', animated: true, style: { stroke: '#34d57b' } },
  { id: 'e5', source: 'snow',   target: 'cash',   animated: true, style: { stroke: '#34d57b' } },
]

const sql = `-- Zero-copy reconciliation: Quorum (flows) × SAP (finance) × Sirion (contracts)
WITH window AS (
  SELECT *
    FROM quorum.gold.flows
   WHERE ts >= DATEADD(hour, -1, CURRENT_TIMESTAMP())
)
SELECT
  q.batch_id,
  q.flow_id,
  q.kbbl                                    AS phys_kbbl,
  s.amount                                  AS sap_amount_usd,
  c.contract_id,
  c.counterparty,
  q.kbbl * c.price_usd_bbl                  AS expected_amount_usd,
  q.kbbl * c.price_usd_bbl - s.amount       AS reconciliation_delta_usd,
  SNOWFLAKE.CORTEX.FORECAST(
    INPUT_DATA => OBJECT_CONSTRUCT('amount', s.amount, 'flows', q.kbbl),
    HORIZON    => 14,
    UNIT       => 'day'
  )                                         AS cash_forecast_14d
  FROM window           q
  JOIN sap.gold.financials  s ON s.batch_id   = q.batch_id
  JOIN sirion.gold.contracts c ON c.contract_id = q.contract_id
 WHERE q.batch_id = '${ANCHOR_BATCH}';`

const cortexMock = {
  anchor_batch: ANCHOR_BATCH,
  flows_kbbl: 120,
  sap_amount_usd: 1_850_000,
  sirion_terms: { contract: 'CON-789', price: 78.50 },
  reconciliation_delta_usd: 84_200,
  forecast_cash_14d_usd: 22_400_000,
  dso_today: 32,
  dso_forecast: 24,
  recommendation: 'ACCRUE $84k DISPUTE · ESCALATE Supplier-X TERM REVIEW',
}

type CortexMock = typeof cortexMock

const fmt = (raw: unknown) => {
  const m = raw as CortexMock
  return [
    `// Snowpark JOIN  · zero-copy   sources={quorum, sap, sirion}`,
    `// CORTEX.FORECAST  horizon=14d  warehouse=REFINERY_AI_XL`,
    ``,
    `anchor_batch              ${m.anchor_batch}`,
    `flows_kbbl                ${m.flows_kbbl}`,
    `sirion.contract           ${m.sirion_terms.contract}`,
    `sirion.price_usd_bbl      ${m.sirion_terms.price.toFixed(2)}`,
    `expected_amount_usd       ${formatUSD(m.flows_kbbl * 1000 * m.sirion_terms.price)}`,
    `sap.amount_usd            ${formatUSD(m.sap_amount_usd)}`,
    `reconciliation_delta_usd  ${formatUSD(m.reconciliation_delta_usd)}   ← surfaced t+0s`,
    ``,
    `forecast.cash_14d_usd     ${formatUSD(m.forecast_cash_14d_usd)}`,
    `dso.today                 ${m.dso_today}`,
    `dso.forecast              ${m.dso_forecast}    (Δ ${m.dso_forecast - m.dso_today} days)`,
    ``,
    `recommendation            ${m.recommendation}`,
    ``,
    `[push] writeback → SAP.GL_ACCRUAL_DISPUTE ($84k) ✓`,
    `[push] writeback → Sirion.CON-789.REVIEW (auto) ✓`,
    `[push] notify    → Treasury · A. KHAN · CFO desk ✓`,
  ].join('\n')
}

function riskTone(r: SirionContract['risk']): 'signal' | 'amber' | 'alarm' {
  if (r === 'low') return 'signal'
  if (r === 'med') return 'amber'
  return 'alarm'
}

export function ContractTab() {
  const rows = SIRION.slice(0, 6)
  return (
    <div className="px-6 pb-8 space-y-4 animate-reveal-up">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <div className="tag">TOOLKIT · §6.3 END-TO-END CONTRACT-TO-CASH VISIBILITY</div>
          <h1 className="font-display text-2xl font-bold tracking-tight mt-1">
            Quorum flows ↔ SAP cash ↔ Sirion obligations · zero-copy reconciliation
          </h1>
          <div className="tag mt-1 text-ink-muted">
            §6.3.1 Reconciliation (above) · §6.3.2 Obligation Tracking (active contracts) · §6.3.3 Cash-Flow Forecast (below)
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Badge tone="cyan">Snowpark JOIN</Badge>
          <Badge tone="amber">CORTEX.FORECAST</Badge>
          <Badge tone="signal">+$2–4M ARR</Badge>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <Kpi label="Open Recon Δ"           value="$84k"            tone="amber"  delta="+$84k" />
        <Kpi label="DSO (days)"               value="32" unit="→ 24" tone="signal" delta="−8d" />
        <Kpi label="Contract Fulfillment"     value="94"  unit="%"   tone="cyan"   delta="+2%" />
        <Kpi label="Disputed Invoices"        value="3"               tone="alarm"  delta="+1" />
      </div>

      <div className="grid grid-cols-[1fr_360px] gap-4">
        <Panel>
          <PanelHeader label="DATA FLOW · QUORUM × SAP × SIRION → LEDGER" hint="click nodes/edges to inspect">
            <Badge tone="cyan">animated · draggable</Badge>
          </PanelHeader>
          <div className="p-2">
            <FlowCanvas
              flowKey="contract"
              nodes={decorateNodes('contract', nodes)}
              edges={decorateEdges('contract', edges)}
              height={320}
            />
          </div>
        </Panel>
        <FlowInspector />
      </div>

      <Panel>
        <PanelHeader label="RECON Δ · DSO" hint="KaTeX" />
        <div className="p-4 space-y-3 grid grid-cols-[auto_1fr] gap-x-6 items-center">
          <Tex display tex={String.raw`\Delta \;=\; \sum_{i \in F} v_i\, p_i \;-\; \sum_{j \in I} \text{amt}_j`} className="text-ink" />
          <div className="tag text-ink-muted">days sales outstanding</div>
          <Tex display tex={String.raw`\text{DSO} \;=\; \frac{\overline{AR}}{R / 365}`} className="text-ink-dim" />
          <div className="tag">
            v volume kbbl · p contract price · amt SAP invoice · AR mean receivables · R annual revenue
          </div>
        </div>
      </Panel>

      <div className="grid grid-cols-2 gap-4">
        <Panel>
          <PanelHeader label="INVOICE PIPELINE" hint="React Three Fiber">
            <Badge tone="copper">3D twin</Badge>
          </PanelHeader>
          <div className="h-[420px] relative">
            <InvoiceFlow />
            <div className="absolute top-3 left-3 panel-elev px-3 py-2">
              <div className="tag">ORBIT · PAN · ZOOM</div>
            </div>
            <div className="absolute top-3 right-3 panel-elev px-3 py-2 font-mono text-[10px] text-cyan">
              {ANCHOR_BATCH} · <span className="text-signal">LIVE</span>
            </div>
          </div>
        </Panel>
        <QueryPanel
          title="SNOWPARK · reconcile_c2c"
          sql={sql}
          cortex
          mock={cortexMock}
          rows={1}
          formatter={fmt}
        />
      </div>

      <Panel>
        <PanelHeader label="SIRION · ACTIVE CONTRACTS" hint="zero-copy mirror">
          <Badge tone="cyan">{SIRION.length} active</Badge>
        </PanelHeader>
        <div className="p-4 overflow-x-auto">
          <table className="w-full font-mono text-[11px]">
            <thead>
              <tr className="border-b border-edge-strong text-left">
                <th className="tag text-ink-muted py-1.5 pr-4">CONTRACT</th>
                <th className="tag text-ink-muted py-1.5 pr-4">COUNTERPARTY</th>
                <th className="tag text-ink-muted py-1.5 pr-4">TYPE</th>
                <th className="tag text-ink-muted py-1.5 pr-4 text-right">TCV</th>
                <th className="tag text-ink-muted py-1.5 pr-4 text-right">FULFILL</th>
                <th className="tag text-ink-muted py-1.5 text-right">RISK</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.contract_id} className="border-b border-edge-subtle/60">
                  <td className="py-1.5 pr-4 text-cyan">{c.contract_id}</td>
                  <td className="py-1.5 pr-4 text-ink">{c.counterparty}</td>
                  <td className="py-1.5 pr-4 text-ink-dim">{c.type}</td>
                  <td className="py-1.5 pr-4 text-right tabular-nums text-ink">{formatUSDk(c.tcv)}</td>
                  <td className="py-1.5 pr-4 text-right tabular-nums text-ink-dim">
                    {c.fulfilled}/{c.obligations}
                  </td>
                  <td className="py-1.5 text-right">
                    <span className={cn('inline-flex')}>
                      <Badge tone={riskTone(c.risk)}>{c.risk.toUpperCase()}</Badge>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* ─── §6.3.3 Cash-Flow Forecasting (CORTEX.FORECAST) ─────────── */}
      <div className="flex items-end justify-between mt-2">
        <div className="tag text-snow">SUB-TOOLKIT · §6.3.3</div>
        <div className="tag text-ink-muted">treasury · 90-day rolling horizon</div>
      </div>

      <div className="grid grid-cols-[1.4fr_1fr] gap-4">
        <Panel>
          <PanelHeader label="§6.3.3 · CASH-FLOW FORECAST · 90-DAY FAN" hint="cortex.forecast · daily">
            <Badge tone="cyan">CORTEX.FORECAST</Badge>
            <Badge tone="amber">P5/P50/P95</Badge>
          </PanelHeader>
          <div className="p-4">
            <CashFlowFan />
            <div className="mt-3 font-mono text-[10px] text-ink-muted leading-relaxed">
              Exogenous regressors: WTI forward · gasoline crack · contract obligation calendar (Sirion) · planned outage windows · seasonality.
              <br />
              <span className="text-amber">JUN-04 → JUN-11</span> tight liquidity window flagged · Treasury auto-draws revolver early.
            </div>
          </div>
        </Panel>

        <SubToolkit
          id="§6.3.3"
          title="Cash-Flow Forecasting"
          badge="CORTEX.FORECAST"
          badgeTone="cyan"
          tagline="Time-series transformer fed by Endur settlements (TRADE-001 day +30), SAP receivables (FIN-001 paid), Sirion obligations (CON-789 / CON-790), and operating costs."
          formula={
            <Tex display tex={String.raw`\hat{\mathrm{CF}}_{t+h} \sim \mathcal{N}(\mu_h,\,\sigma_h^{2})`} className="text-ink" />
          }
          readout={
            <div className="py-1">
              <DataRow label="model"               value="cortex.forecast.transformer_v3" tone="snow" />
              <DataRow label="horizon"             value="90 days"                        tone="cyan" />
              <DataRow label="MAPE (backtest)"     value="3.8 %"                          tone="signal" />
              <DataRow label="next 30d net CF (P50)" value={formatUSDk(18_400_000)}       tone="signal" />
              <DataRow label="P5 lower band"       value={formatUSDk(11_900_000)}         tone="amber" />
              <DataRow label="tight window"        value="JUN-04 → JUN-11"                tone="alarm" />
              <DataRow label="suggested action"    value="draw revolver $4M · day −3"     tone="cyan" />
            </div>
          }
          sql={SQL_633}
          mock={MOCK_633}
          rows={90}
          minMs={620}
          maxMs={2100}
          footer="[push] writeback → SAP.TREASURY.REVOLVER_DRAFT ✓   ·   ROI band $0.5–1M / yr"
        />
      </div>
    </div>
  )
}

/* ─── §6.3.3 — small inline SVG fanchart so we don't pull a new lib ── */
function CashFlowFan() {
  // 90 daily points; deterministic so the chart is steady across renders.
  const days = 90
  const samples = Array.from({ length: days }, (_, i) => {
    const x = i / (days - 1)
    // Drifting baseline with a dip around day 22-30 (Jun 4-11).
    const dip = Math.exp(-Math.pow((x - 0.27) * 6, 2)) * 28
    const base = 60 + 35 * x - dip
    const sigma = 6 + 18 * x
    return { x, base, sigma }
  })

  const W = 580
  const H = 170
  const PAD = 26

  const toX = (i: number) => PAD + (i / (days - 1)) * (W - PAD * 2)
  const toY = (v: number) => H - PAD - (v / 110) * (H - PAD * 2)

  const path = (offset: number) =>
    samples
      .map((s, i) => `${i === 0 ? 'M' : 'L'}${toX(i).toFixed(1)},${toY(s.base + offset).toFixed(1)}`)
      .join(' ')

  const bandPath = (lo: number, hi: number) => {
    const top = samples.map((s, i) => `${i === 0 ? 'M' : 'L'}${toX(i).toFixed(1)},${toY(s.base + hi * s.sigma).toFixed(1)}`).join(' ')
    const bot = samples
      .slice()
      .reverse()
      .map((s, idx) => {
        const i = days - 1 - idx
        return `L${toX(i).toFixed(1)},${toY(s.base + lo * s.sigma).toFixed(1)}`
      })
      .join(' ')
    return `${top} ${bot} Z`
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-44 font-mono">
      <defs>
        <linearGradient id="fan95" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%"  stopColor="#4ee2f4" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#4ee2f4" stopOpacity="0.04" />
        </linearGradient>
        <linearGradient id="fan50" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%"  stopColor="#34d57b" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#34d57b" stopOpacity="0.05" />
        </linearGradient>
      </defs>

      {/* P5–P95 band */}
      <path d={bandPath(-1.96, 1.96)} fill="url(#fan95)" />
      {/* P25–P75 band */}
      <path d={bandPath(-0.67, 0.67)} fill="url(#fan50)" />

      {/* zero line */}
      <line x1={PAD} x2={W - PAD} y1={toY(0)} y2={toY(0)} stroke="#1e3049" strokeDasharray="3 4" />

      {/* P50 median */}
      <path d={path(0)} fill="none" stroke="#4ee2f4" strokeWidth="1.6" />

      {/* tight window highlight */}
      <rect
        x={toX(21)}
        y={toY(110)}
        width={toX(28) - toX(21)}
        height={H - PAD - toY(110)}
        fill="#ff6b35"
        opacity="0.08"
      />
      <text x={toX(24)} y={PAD + 2} fontSize="9" textAnchor="middle" fill="#ffb627">
        TIGHT
      </text>

      {/* axis labels */}
      <text x={PAD} y={H - 6} fontSize="9" fill="#7a8aa1">T+0</text>
      <text x={W / 2} y={H - 6} fontSize="9" fill="#7a8aa1" textAnchor="middle">T+45d</text>
      <text x={W - PAD} y={H - 6} fontSize="9" fill="#7a8aa1" textAnchor="end">T+90d</text>
      <text x={4} y={toY(0) + 3} fontSize="9" fill="#7a8aa1">$0</text>
      <text x={4} y={toY(100) + 3} fontSize="9" fill="#7a8aa1">$100M</text>
    </svg>
  )
}

/* ─── §6.3.3 · Cash-Flow Forecasting SQL + mock ───────────────────── */
const SQL_633 = `-- CORTEX.FORECAST: 90-day cash-flow with P5/P50/P95 bands
WITH cashflow_daily AS (
  SELECT  business_date,
          SUM(receivables_usd) AS rcv,
          SUM(payables_usd)    AS pay,
          SUM(settlement_usd)  AS settle,
          SUM(rcv + settle - pay) AS net_cashflow_usd
    FROM  finance.gold.cashflow_facts
   WHERE  business_date BETWEEN DATEADD(year, -2, CURRENT_DATE()) AND CURRENT_DATE()
   GROUP BY business_date
)
SELECT  SNOWFLAKE.CORTEX.FORECAST(
          INPUT_DATA         => 'cashflow_daily',
          TIMESTAMP_COLNAME  => 'business_date',
          TARGET_COLNAME     => 'net_cashflow_usd',
          FORECAST_HORIZON_DAYS => 90,
          EXOG_COLNAMES      => ['wti_forward','gasoline_crack','outage_flag','seasonality']
        ) AS forecast
  FROM  cashflow_daily;`
const MOCK_633 = {
  model: 'cortex.forecast.transformer_v3',
  horizon_days: 90,
  mape_backtest_pct: 0.038,
  p50_next_30d_usd: 18_400_000,
  p5_lower_band_usd: 11_900_000,
  p95_upper_band_usd: 24_800_000,
  tight_window: 'JUN-04 → JUN-11',
  tight_window_p5_usd: -2_400_000,
  suggested_action: 'DRAW_REVOLVER · 4_000_000_USD · day-3',
  writeback: 'SAP.TREASURY.REVOLVER_DRAFT',
}
