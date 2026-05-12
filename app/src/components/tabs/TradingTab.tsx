import { Panel, PanelHeader, Kpi, DataRow } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { SubToolkit } from '@/components/ui/SubToolkit'
import { FlowCanvas } from '@/components/FlowCanvas'
import { FlowInspector } from '@/components/FlowInspector'
import { QueryPanel } from '@/components/QueryPanel'
import { PositionBars } from '@/components/three/PositionBars'
import { Tex } from '@/lib/katex'
import { cn, formatUSD, formatInt, pct } from '@/lib/utils'
import { decorateNodes, decorateEdges } from '@/lib/flowDetails'
import { ENDUR } from '@/lib/mockData'
import type { Node, Edge } from '@xyflow/react'

const nodes: Node[] = [
  { id: 'endur',  type: 'schematic', position: { x:   0, y:   0 }, data: { code: 'ENDUR',        label: 'Trades',                   kind: 'source',  status: 'ok',    meta: 'TRADE-001 · Crack Spread' } },
  { id: 'quorum', type: 'schematic', position: { x:   0, y: 150 }, data: { code: 'QUORUM',       label: 'Physical Flows',           kind: 'source',  status: 'ok',    meta: '120 kbbl gasoline'        } },
  { id: 'recon',  type: 'schematic', position: { x: 280, y:  75 }, data: { code: 'SNOW · RECON', label: 'Position Reconciliation',  kind: 'ai',      status: 'ai',    meta: 'physical vs paper'        } },
  { id: 'var',    type: 'schematic', position: { x: 560, y:   0 }, data: { code: 'CORTEX · VAR', label: 'Monte Carlo · VaR99',      kind: 'ai',      status: 'ai',    meta: '10k paths'                } },
  { id: 'hedge',  type: 'schematic', position: { x: 840, y:  75 }, data: { code: 'OUT · HEDGE',  label: 'Hedge Adjustment',         kind: 'output',  status: 'ok',    meta: '+12 lots WTI Z26'         } },
  { id: 'risk',   type: 'schematic', position: { x: 560, y: 150 }, data: { code: 'RISK · CCY',   label: 'Counterparty Stress',      kind: 'risk',    status: 'warn',  meta: 'stress 3σ · L1'           } },
]

const edges: Edge[] = [
  { id: 'e1', source: 'endur',  target: 'recon', animated: true, style: { stroke: '#c79a4a' } },
  { id: 'e2', source: 'quorum', target: 'recon', animated: true, style: { stroke: '#c79a4a' } },
  { id: 'e3', source: 'recon', target: 'var',    animated: true, style: { stroke: '#4ee2f4' } },
  { id: 'e4', source: 'recon', target: 'risk',   animated: true, style: { stroke: '#ff6b35' } },
  { id: 'e5', source: 'var',    target: 'hedge', animated: true, style: { stroke: '#34d57b' } },
  { id: 'e6', source: 'risk',   target: 'hedge', animated: true, style: { stroke: '#ff6b35' } },
]

const sql = `-- Snowpark · Monte Carlo VaR over physical + paper positions
WITH paper AS (
  SELECT trade_id, commodity, qty_kbbl, price, pnl, ts
    FROM endur.gold.positions
   WHERE ts >= DATEADD(day, -30, CURRENT_TIMESTAMP())
),
phys AS (
  SELECT product, SUM(kbbl) AS phys_kbbl
    FROM quorum.gold.flows
   WHERE ts >= DATEADD(day, -30, CURRENT_TIMESTAMP())
   GROUP BY product
)
SELECT
  refinery_ai.monte_carlo_var(
    positions  => ARRAY_AGG(OBJECT_CONSTRUCT(
                    'trade_id', p.trade_id,
                    'commodity', p.commodity,
                    'qty_kbbl',  p.qty_kbbl,
                    'price',     p.price)),
    confidence => 0.99,
    horizon    => 1,
    paths      => 10000
  )                                                  AS var_99_1d,
  SNOWFLAKE.CORTEX.FORECAST(
    INPUT_DATA => OBJECT_CONSTRUCT('pnl', SUM(p.pnl)),
    HORIZON    => 7, UNIT => 'day'
  )                                                  AS pnl_forecast_7d
  FROM paper p
  LEFT JOIN phys f ON f.product = LOWER(p.commodity);`

const cortexMock = {
  net_exposure_usd: 2_400_000,
  var_99_1d_usd: 184_300,
  hedge_effectiveness: 0.924,
  recommended_action: 'BUY 12 LOTS WTI Z26 @ MKT',
  stress_3sigma_loss_usd: 612_000,
  counterparties: {
    'Supplier-X': { rating: 'AA−', limit: 5e8, used: 1.4e8 },
  },
  paths_simulated: 10_000,
}

type CortexMock = typeof cortexMock

const fmt = (raw: unknown) => {
  const m = raw as CortexMock
  const cp = m.counterparties['Supplier-X']
  return [
    `// Snowpark · monte_carlo_var   paths=${formatInt(m.paths_simulated)}   conf=99%`,
    `// CORTEX.FORECAST horizon=7d · warehouse=REFINERY_AI_XL`,
    ``,
    `net_exposure_usd        ${formatUSD(m.net_exposure_usd)}`,
    `var_99_1d_usd           ${formatUSD(m.var_99_1d_usd)}      ← 1-day VaR @ 99%`,
    `hedge_effectiveness     ${pct(m.hedge_effectiveness, 1)}    ← > 80% effective`,
    `stress_3σ_loss_usd      ${formatUSD(m.stress_3sigma_loss_usd)}`,
    ``,
    `counterparty.Supplier-X`,
    `  rating                ${cp.rating}`,
    `  limit                 ${formatUSD(cp.limit)}`,
    `  used                  ${formatUSD(cp.used)}   (${pct(cp.used / cp.limit, 1)})`,
    ``,
    `recommended_action      ${m.recommended_action}`,
    ``,
    `[push] writeback → ENDUR.HEDGE_TICKET (auto-draft) ✓`,
    `[push] writeback → RISK.LEDGER (VaR_99 stamp t+0s) ✓`,
    `[push] notify    → CRO desk · Trading lead · S. PARK ✓`,
  ].join('\n')
}

const sideTone = (s: 'buy' | 'sell') => (s === 'buy' ? 'signal' : 'flare')

export function TradingTab() {
  const rows = ENDUR.slice(0, 6)
  return (
    <div className="px-6 pb-8 space-y-4 animate-reveal-up">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <div className="tag">TOOLKIT · §6.4 TRADING &amp; RISK MANAGEMENT</div>
          <h1 className="font-display text-2xl font-bold tracking-tight mt-1">
            Endur position recon · physical vs paper · VaR &amp; hedge effectiveness
          </h1>
          <div className="tag mt-1 text-ink-muted">
            §6.4.1 Position Recon (above) · §6.4.2 VaR (above) · §6.4.3 Counterparty Risk Scoring (below)
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Badge tone="flare">Snowpark VaR</Badge>
          <Badge tone="cyan">CORTEX.FORECAST</Badge>
          <Badge tone="signal">+$2–4M Risk</Badge>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <Kpi label="Net Exposure"          value="$2.4M"             tone="cyan"   delta="−$120k" />
        <Kpi label="1-day VaR (99%)"       value="$184k"             tone="amber"  delta="−$12k"  />
        <Kpi label="Hedge Effect."         value="92.4" unit="%"     tone="signal" delta="+1.8%"  />
        <Kpi label="Counterparty α"        value="AA−"               tone="copper" delta="stable" />
      </div>

      <div className="grid grid-cols-[1fr_360px] gap-4">
        <Panel>
          <PanelHeader label="DATA FLOW · ENDUR × QUORUM → VAR → HEDGE" hint="click nodes/edges to inspect">
            <Badge tone="cyan">animated · draggable</Badge>
          </PanelHeader>
          <div className="p-2">
            <FlowCanvas
              flowKey="trading"
              nodes={decorateNodes('trading', nodes)}
              edges={decorateEdges('trading', edges)}
              height={300}
            />
          </div>
        </Panel>
        <FlowInspector />
      </div>

      <Panel>
        <PanelHeader label="VAR · HEDGE EFFECTIVENESS" hint="KaTeX" />
        <div className="p-4 space-y-3 grid grid-cols-[auto_1fr] gap-x-6 items-center">
          <Tex display tex={String.raw`\text{VaR}_{\alpha}(L) = \inf\{\, \ell \,:\, P(L > \ell) \leq 1 - \alpha \,\}`} className="text-ink" />
          <div className="tag text-ink-muted">hedge effectiveness</div>
          <Tex display tex={String.raw`\text{HE} \;=\; 1 - \frac{\sigma_{\text{net}}^{2}}{\sigma_{\text{phys}}^{2}}`} className="text-ink-dim" />
          <div className="tag">
            L loss r.v. · α 0.99 · σ²ₙₑₜ residual var after hedge · σ²ₚₕᵧₛ unhedged var
          </div>
        </div>
      </Panel>

      <div className="grid grid-cols-2 gap-4">
        <Panel>
          <PanelHeader label="POSITION · PHYSICAL vs PAPER" hint="React Three Fiber">
            <Badge tone="copper">3D twin</Badge>
          </PanelHeader>
          <div className="h-[420px] relative">
            <PositionBars />
            <div className="absolute top-3 left-3 panel-elev px-3 py-2">
              <div className="tag">ORBIT · PAN · ZOOM</div>
            </div>
            <div className="absolute bottom-3 right-3 panel-elev px-3 py-2 font-mono text-[10px] text-ink-muted">
              <div><span className="text-cyan">paths</span> 10,000 · <span className="text-cyan">α</span> 0.99</div>
              <div><span className="text-flare">stress</span> 3σ · L1</div>
            </div>
          </div>
        </Panel>
        <QueryPanel
          title="SNOWPARK · monte_carlo_var"
          sql={sql}
          cortex
          mock={cortexMock}
          rows={1}
          formatter={fmt}
        />
      </div>

      <Panel>
        <PanelHeader label="ENDUR · TOP TRADES" hint="paper book">
          <Badge tone="cyan">{ENDUR.length} positions</Badge>
        </PanelHeader>
        <div className="p-4 overflow-x-auto">
          <table className="w-full font-mono text-[11px]">
            <thead>
              <tr className="border-b border-edge-strong text-left">
                <th className="tag text-ink-muted py-1.5 pr-4">TRADE</th>
                <th className="tag text-ink-muted py-1.5 pr-4">SIDE</th>
                <th className="tag text-ink-muted py-1.5 pr-4">COMMODITY</th>
                <th className="tag text-ink-muted py-1.5 pr-4 text-right">QTY (kbbl)</th>
                <th className="tag text-ink-muted py-1.5 pr-4 text-right">PRICE</th>
                <th className="tag text-ink-muted py-1.5 text-right">P&amp;L</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => (
                <tr key={t.trade_id} className="border-b border-edge-subtle/60">
                  <td className="py-1.5 pr-4 text-cyan">{t.trade_id}</td>
                  <td className="py-1.5 pr-4">
                    <Badge tone={sideTone(t.side)}>{t.side.toUpperCase()}</Badge>
                  </td>
                  <td className="py-1.5 pr-4 text-ink">{t.commodity}</td>
                  <td className="py-1.5 pr-4 text-right tabular-nums text-ink">{formatInt(t.qty_kbbl)}</td>
                  <td className="py-1.5 pr-4 text-right tabular-nums text-ink-dim">{t.price.toFixed(2)}</td>
                  <td className={cn(
                    'py-1.5 text-right tabular-nums',
                    t.pnl >= 0 ? 'text-signal' : 'text-alarm',
                  )}>
                    {formatUSD(t.pnl)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* ─── §6.4.3 Counterparty Risk Scoring ───────────────────────── */}
      <div className="flex items-end justify-between mt-2">
        <div className="tag text-snow">SUB-TOOLKIT · §6.4.3 COUNTERPARTY RISK SCORING</div>
        <div className="tag text-ink-muted">cortex.sentiment + altman-Z + exposure</div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <SubToolkit
          id="§6.4.3"
          title="Counterparty Composite Score"
          badge="CORTEX.SENTIMENT"
          badgeTone="cyan"
          tagline="Daily composite score on every Sirion counterparty: Altman-Z (financials from Marketplace) + Cortex Sentiment on news + Exposure ratio (book / TTM P&L). Credit knows before legal."
          formula={
            <>
              <Tex display tex={String.raw`R_c = w_1 Z_c + w_2 S_c + w_3 (1 - E_c)`} className="text-ink" />
              <div className="tag">Z Altman-Z · S sentiment ∈ [-1,1] · E exposure ratio · weights 0.4/0.3/0.3</div>
            </>
          }
          readout={
            <div className="py-1">
              <DataRow label="model"          value="cortex.counterparty_v2"   tone="snow" />
              <DataRow label="counterparties" value="42 active"                tone="cyan" />
              <DataRow label="news scanned/d" value="5,184"                    tone="cyan" />
              <DataRow label="alerts (24h)"   value="3 · 1 escalated"          tone="amber" />
              <DataRow label="MTTR alerts"    value="11 min · trader desk"     tone="signal" />
              <DataRow label="bad-debt avoided" value="$0.5–1M / yr"           tone="signal" />
            </div>
          }
          sql={SQL_643}
          mock={MOCK_643}
          rows={42}
          footer="[push] writeback → ENDUR.COUNTERPARTY.SCORE_TODAY ✓"
        />

        <Panel className="flex flex-col">
          <PanelHeader label="§6.4.3 · TODAY'S SCORECARDS" hint="ranked by composite">
            <Badge tone="amber">3 watch</Badge>
          </PanelHeader>
          <div className="p-3 font-mono text-[11px]">
            <CounterpartyCard
              name="Supplier-X"
              contract="CON-789"
              composite={0.78}
              altmanZ={3.4}
              sentiment={0.42}
              exposure={0.18}
              status="healthy"
            />
            <CounterpartyCard
              name="Offtaker-Y"
              contract="CON-790"
              composite={0.61}
              altmanZ={2.1}
              sentiment={-0.08}
              exposure={0.31}
              status="watch"
            />
            <CounterpartyCard
              name="Pipeline-Z"
              contract="CON-791"
              composite={0.84}
              altmanZ={4.1}
              sentiment={0.21}
              exposure={0.09}
              status="healthy"
            />
            <CounterpartyCard
              name="Trader-K (paper)"
              contract="—"
              composite={0.49}
              altmanZ={1.7}
              sentiment={-0.32}
              exposure={0.44}
              status="escalate"
            />
          </div>
        </Panel>

        <SubToolkit
          id="§6.4.3b"
          title="Marketplace Data Sources"
          badge="ZERO-COPY"
          badgeTone="snow"
          tagline="One-click Snowflake Marketplace subscriptions feed the composite score. No ETL. No vendor data copies."
          readout={
            <div className="py-1">
              <DataRow label="S&P Capital IQ Pro"   value="financials · altman-Z" tone="cyan" />
              <DataRow label="Moody's"              value="credit ratings"        tone="cyan" />
              <DataRow label="Reuters News"         value="cortex.sentiment feed" tone="amber" />
              <DataRow label="Cybersyn"             value="macro indicators"      tone="snow" />
              <DataRow label="OFAC / Sanctions"     value="auto-tag governance"   tone="alarm" />
              <DataRow label="refresh"              value="daily · zero-copy"     tone="signal" />
              <DataRow label="storage cost"         value="$0 · marketplace"      tone="signal" />
            </div>
          }
          sql={SQL_643B}
          mock={MOCK_643B}
          rows={6}
          cortex={false}
          minMs={280}
          maxMs={820}
          footer="all feeds governed by Horizon · MNPI auto-classified"
        />
      </div>
    </div>
  )
}

/* ─── §6.4.3 counterparty scorecard ────────────────────────────────── */
function CounterpartyCard({
  name,
  contract,
  composite,
  altmanZ,
  sentiment,
  exposure,
  status,
}: {
  name: string
  contract: string
  composite: number
  altmanZ: number
  sentiment: number
  exposure: number
  status: 'healthy' | 'watch' | 'escalate'
}) {
  const tone =
    status === 'escalate' ? 'alarm' :
    status === 'watch'    ? 'amber' :
    'signal'
  return (
    <div className="border-b border-edge-subtle/60 py-2 last:border-b-0">
      <div className="flex items-center justify-between">
        <span className="text-cyan">{name}</span>
        <Badge tone={tone === 'alarm' ? 'flare' : tone === 'amber' ? 'amber' : 'signal'}>
          {status.toUpperCase()}
        </Badge>
      </div>
      <div className="flex items-center justify-between text-[10px] text-ink-muted mt-0.5">
        <span>{contract}</span>
        <span>composite <span className={tone === 'alarm' ? 'text-alarm' : tone === 'amber' ? 'text-amber' : 'text-signal'}>{composite.toFixed(2)}</span></span>
      </div>
      <div className="grid grid-cols-3 gap-2 mt-1 text-[10px] text-ink-dim">
        <span>Z {altmanZ.toFixed(1)}</span>
        <span>S {sentiment >= 0 ? '+' : ''}{sentiment.toFixed(2)}</span>
        <span>E {(exposure * 100).toFixed(0)}%</span>
      </div>
    </div>
  )
}

/* ─── §6.4.3 · Counterparty Risk SQL + mock ───────────────────────── */
const SQL_643 = `-- Composite counterparty score = 0.4·Altman-Z + 0.3·Sentiment + 0.3·(1-Exposure)
WITH news AS (
  SELECT  counterparty,
          SNOWFLAKE.CORTEX.SENTIMENT(headline || ' ' || body) AS sentiment
    FROM  marketplace.reuters_news.energy_oil_gas
   WHERE  ts >= DATEADD(day, -1, CURRENT_TIMESTAMP())
),
financials AS (
  SELECT  counterparty, altman_z, ttm_pnl_usd
    FROM  marketplace.sp_capital_iq.financials_latest
),
exposure AS (
  SELECT  c.counterparty,
          SUM(t.qty_kbbl * t.price) / NULLIF(f.ttm_pnl_usd, 0) AS exposure_ratio
    FROM  sirion.gold.contracts c
    JOIN  endur.gold.positions  t USING (counterparty)
    JOIN  financials            f USING (counterparty)
   GROUP BY 1, f.ttm_pnl_usd
)
SELECT  e.counterparty,
        0.40 * f.altman_z
      + 0.30 * AVG(n.sentiment)
      + 0.30 * (1 - LEAST(e.exposure_ratio, 1))               AS composite_score,
        CASE WHEN composite_score < 0.55 THEN 'ESCALATE'
             WHEN composite_score < 0.70 THEN 'WATCH'
             ELSE 'HEALTHY' END                                AS status
  FROM  exposure e
  JOIN  financials f USING (counterparty)
  LEFT JOIN news n USING (counterparty)
 GROUP BY e.counterparty, f.altman_z, e.exposure_ratio
 ORDER BY composite_score ASC;`
const MOCK_643 = {
  model: 'cortex.counterparty_v2',
  counterparties: 42,
  news_scanned_today: 5184,
  alerts_24h: 3,
  escalations_24h: 1,
  weights: { altman_z: 0.4, sentiment: 0.3, exposure: 0.3 },
  scorecards: [
    { name: 'Supplier-X',     contract: 'CON-789', composite: 0.78, status: 'HEALTHY'  },
    { name: 'Offtaker-Y',     contract: 'CON-790', composite: 0.61, status: 'WATCH'    },
    { name: 'Pipeline-Z',     contract: 'CON-791', composite: 0.84, status: 'HEALTHY'  },
    { name: 'Trader-K paper', contract: '—',       composite: 0.49, status: 'ESCALATE' },
  ],
  writeback: 'ENDUR.COUNTERPARTY.SCORE_TODAY',
}

/* ─── §6.4.3b · Marketplace ingest provenance ─────────────────────── */
const SQL_643B = `-- Zero-copy provenance: which Marketplace shares feed counterparty scoring
SELECT  share_name, provider, refresh_cadence, columns, mnpi_flag
  FROM  snowflake.marketplace.listings_subscribed
 WHERE  share_name IN (
          'SP_CAPITAL_IQ_PRO_FINANCIALS_V1',
          'MOODYS_CREDIT_RATINGS',
          'REUTERS_NEWS_ENERGY_V2',
          'CYBERSYN_MACRO_INDICATORS',
          'OFAC_SDN_LIST_DAILY'
        )
 ORDER BY share_name;`
const MOCK_643B = {
  shares: [
    { name: 'SP_CAPITAL_IQ_PRO_FINANCIALS_V1', refresh: 'daily', mnpi: false },
    { name: 'MOODYS_CREDIT_RATINGS',           refresh: 'daily', mnpi: false },
    { name: 'REUTERS_NEWS_ENERGY_V2',          refresh: 'real-time', mnpi: false },
    { name: 'CYBERSYN_MACRO_INDICATORS',       refresh: 'daily', mnpi: false },
    { name: 'OFAC_SDN_LIST_DAILY',             refresh: 'daily', mnpi: false },
  ],
  storage_cost_usd: 0,
  governed_by: 'horizon.classification.mnpi_auto',
}
