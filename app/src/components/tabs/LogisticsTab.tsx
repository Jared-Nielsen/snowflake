import { Panel, PanelHeader, Kpi, DataRow } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { FlowCanvas } from '@/components/FlowCanvas'
import { FlowInspector } from '@/components/FlowInspector'
import { QueryPanel } from '@/components/QueryPanel'
import { StreamChart } from '@/components/StreamChart'
import { TankerScene } from '@/components/three/TankerScene'
import { Tex } from '@/lib/katex'
import { formatUSD, formatUSDk, pct } from '@/lib/utils'
import { decorateNodes, decorateEdges } from '@/lib/flowDetails'
import type { Node, Edge } from '@xyflow/react'

// ---------- React Flow graph: AIS + flows + demand-forecast → VRP → berth/dispatch
const nodes: Node[] = [
  {
    id: 'eta',
    type: 'schematic',
    position: { x: 0, y: 0 },
    data: { code: 'ETA · TANKERS', label: 'Tanker AIS', kind: 'source', status: 'ok', meta: '12 active' },
  },
  {
    id: 'quorum',
    type: 'schematic',
    position: { x: 0, y: 110 },
    data: { code: 'QUORUM · FLOWS', label: 'Product Flows', kind: 'source', status: 'ok', meta: 'FLOW-001 · 120 kbbl' },
  },
  {
    id: 'fcst',
    type: 'schematic',
    position: { x: 0, y: 220 },
    data: { code: 'FCST · DEMAND', label: 'Cortex Demand Forecast', kind: 'ai', status: 'ai', meta: '14d horizon' },
  },
  {
    id: 'vrp',
    type: 'schematic',
    position: { x: 320, y: 110 },
    data: { code: 'SNOW · VRP', label: 'Vehicle Routing · Snowpark', kind: 'ai', status: 'ai', meta: 'OR-Tools' },
  },
  {
    id: 'berth',
    type: 'schematic',
    position: { x: 640, y: 40 },
    data: { code: 'OUT · BERTH', label: 'Berth Schedule', kind: 'output', status: 'ok', meta: 'auto-publish' },
  },
  {
    id: 'disp',
    type: 'schematic',
    position: { x: 640, y: 180 },
    data: { code: 'OUT · DISP', label: 'Dispatch Ticket', kind: 'output', status: 'ok', meta: 'writeback → Quorum' },
  },
]

const edges: Edge[] = [
  { id: 'e1', source: 'eta', target: 'vrp', animated: true },
  { id: 'e2', source: 'quorum', target: 'vrp', animated: true },
  { id: 'e3', source: 'fcst', target: 'vrp', animated: true },
  { id: 'e4', source: 'vrp', target: 'berth', animated: true },
  { id: 'e5', source: 'vrp', target: 'disp', animated: true },
]

// ---------- Cortex / OR-Tools mock
const cortexMock = {
  tankers_inbound: 3,
  berths_open_next_24h: 2,
  demurrage_risk_usd: 92_400,
  recommended_dispatch: [
    { tanker: 'MT POSEIDON',  port: 'CORPUS',    eta: '2026-05-13 02:40Z', cargo_kbbl: 320 },
    { tanker: 'MT MERIDIAN',  port: 'GALVESTON', eta: '2026-05-13 11:15Z', cargo_kbbl: 220 },
  ],
  demand_forecast_pct: 0.064,
  ot_lifts_30d_pct: 0.942,
  vrp_cost_saved_usd_mo: 184_000,
}

const sql = `-- Tanker ETA + product flows joined with Cortex 14-day demand forecast,
-- then routed through a Snowpark VRP (OR-Tools) to produce berth + dispatch.
WITH inbound AS (
  SELECT  t.tanker_id,
          t.imo,
          t.eta_utc,
          t.cargo_kbbl,
          t.dest_port,
          t.lat, t.lon, t.speed_kn
  FROM    cognite.gold.tanker_eta t
  WHERE   t.eta_utc BETWEEN CURRENT_TIMESTAMP()
                        AND DATEADD(day, 3, CURRENT_TIMESTAMP())
),
flows AS (
  SELECT  q.product, SUM(q.kbbl) AS open_kbbl
  FROM    quorum.gold.flows q
  WHERE   q.ts > DATEADD(day, -7, CURRENT_TIMESTAMP())
  GROUP BY 1
),
demand AS (
  SELECT  product, ts, forecast_kbbl
  FROM    TABLE(SNOWFLAKE.CORTEX.FORECAST(
            INPUT_DATA => 'gold.demand_signal_7d',
            HORIZON    => 14, FREQUENCY => 'DAY'
          ))
)
SELECT  i.*,
        f.open_kbbl,
        d.forecast_kbbl,
        CORTEX_AI.SOLVE_VRP(
          tankers      => i,
          flows        => f,
          demand       => d,
          objective    => 'min_demurrage_plus_freight'
        ) AS plan
FROM    inbound i
LEFT JOIN flows  f ON 1=1
LEFT JOIN demand d ON d.product = f.product;`

function fmt(m: unknown) {
  const x = m as typeof cortexMock
  return [
    `// Snowflake · REFINERY_AI_XL · Snowpark VRP (OR-Tools)`,
    `// Tanker AIS feed: cognite.gold.tanker_eta   ·   Flows: quorum.gold.flows`,
    ``,
    `[berth_window]   24h horizon`,
    `  inbound_tankers ............ ${x.tankers_inbound}`,
    `  berths_open ................ ${x.berths_open_next_24h}`,
    `  demurrage_risk ............. ${formatUSD(x.demurrage_risk_usd)}`,
    ``,
    `[recommended_dispatch]`,
    ...x.recommended_dispatch.map(
      r => `  · ${r.tanker.padEnd(14)} → ${r.port.padEnd(10)} ETA ${r.eta}   ${r.cargo_kbbl} kbbl`,
    ),
    ``,
    `[demand]   horizon=14d   freq=DAY`,
    `  forecast_uplift ............ ${pct(x.demand_forecast_pct)}`,
    `  ot_lifts_30d ............... ${pct(x.ot_lifts_30d_pct)}`,
    `  vrp_cost_saved ............. ${formatUSDk(x.vrp_cost_saved_usd_mo)} / mo`,
    ``,
    `[push] writeback → Quorum.DISPATCH · berth schedule auto-published ✓`,
  ].join('\n')
}

// Hardcoded 4-row tanker board for the bottom-left mini table
const tankerBoard = [
  { tanker: 'MT POSEIDON',   port: 'CORPUS',     eta: '05-13 02:40Z', tone: 'signal' as const },
  { tanker: 'MT MERIDIAN',   port: 'GALVESTON',  eta: '05-13 11:15Z', tone: 'signal' as const },
  { tanker: 'MT CALYPSO',    port: 'BEAUMONT',   eta: '05-13 19:02Z', tone: 'cyan'   as const },
  { tanker: 'MT ATLAS REX',  port: 'HOUSTON',    eta: '05-14 04:30Z', tone: 'amber'  as const },
]

export function LogisticsTab() {
  return (
    <div className="px-6 pb-8 space-y-4 animate-reveal-up">
      {/* 1. Section header */}
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <div className="tag">TOOLKIT · §6.6 DEMAND FORECASTING &amp; LOGISTICS</div>
          <h1 className="font-display text-2xl font-bold tracking-tight mt-1">
            Tanker routing · berth allocation · feedstock logistics · 14-day forecast
          </h1>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Badge tone="snow">OR-Tools VRP</Badge>
          <Badge tone="amber">CORTEX.FORECAST</Badge>
          <Badge tone="signal">+$1–3M Logistics</Badge>
        </div>
      </div>

      {/* 2. KPI strip */}
      <div className="grid grid-cols-4 gap-3">
        <Kpi label="BERTH UTILIZATION" value="78" unit="%" tone="cyan" />
        <Kpi label="DEMURRAGE RISK" value="$92k" tone="amber" />
        <Kpi label="ON-TIME LIFTS (30d)" value="94.2" unit="%" tone="signal" />
        <Kpi label="FORECAST DEMAND (7d)" value="+6.4" unit="%" tone="snow" />
      </div>

      {/* 3. Flow + Inspector */}
      <div className="grid grid-cols-[1fr_360px] gap-4 items-stretch">
        <Panel className="flex flex-col">
          <PanelHeader label="DATA FLOW · AIS + FLOWS + FORECAST → VRP → BERTH/DISPATCH" hint="click nodes/edges to inspect">
            <Badge tone="cyan">animated · draggable</Badge>
          </PanelHeader>
          <div className="p-2 flex-1 min-h-0">
            <FlowCanvas
              flowKey="logistics"
              nodes={decorateNodes('logistics', nodes)}
              edges={decorateEdges('logistics', edges)}
              height={300}
            />
          </div>
        </Panel>
        <FlowInspector />
      </div>

      <Panel>
        <PanelHeader label="VRP + ERLANG-B" hint="KaTeX" />
        <div className="p-4 space-y-3 grid grid-cols-[auto_1fr] gap-x-6 items-center">
          <Tex
            display
            tex={String.raw`\min \sum_{(i,j) \in A} c_{ij}\, x_{ij}`}
            className="text-ink"
          />
          <div className="tag text-ink-muted">berth blocking probability</div>
          <Tex
            display
            tex={String.raw`B(c,\lambda) = \dfrac{(\lambda/\mu)^{c}/c!}{\sum_{k=0}^{c}(\lambda/\mu)^{k}/k!}`}
            className="text-ink-dim"
          />
          <div className="tag">
            c = berths · λ = arrival rate · μ = service rate · x = route arc
          </div>
        </div>
      </Panel>

      {/* 4. 3D scene + Query */}
      <div className="grid grid-cols-2 gap-4">
        <Panel>
          <PanelHeader label="GULF TANKER NETWORK · LIVE AIS" hint="React Three Fiber">
            <Badge tone="copper">3D twin</Badge>
          </PanelHeader>
          <div className="h-[420px] relative">
            <TankerScene />
            <div className="absolute top-3 left-3 panel-elev px-3 py-2">
              <div className="tag">ORBIT · PAN · ZOOM</div>
            </div>
            <div className="absolute top-3 right-3 panel-elev px-3 py-2">
              <div className="tag">GULF · 4 PORTS · 3 IN TRANSIT</div>
            </div>
          </div>
        </Panel>

        <QueryPanel
          title="VRP · DEMAND-AWARE TANKER DISPATCH"
          sql={sql}
          cortex
          mock={cortexMock}
          rows={6}
          formatter={fmt}
        />
      </div>

      {/* 5. Bottom row */}
      <div className="grid grid-cols-3 gap-4">
        <Panel>
          <PanelHeader label="TANKER DISPATCH BOARD" hint="cognite.gold.tanker_eta">
            <Badge tone="cyan">4 inbound</Badge>
          </PanelHeader>
          <div className="p-3">
            <table className="w-full font-mono text-[11px]">
              <thead>
                <tr className="border-b border-edge-strong">
                  <th className="text-left py-1.5"><span className="tag">TANKER</span></th>
                  <th className="text-left py-1.5"><span className="tag">PORT</span></th>
                  <th className="text-right py-1.5"><span className="tag">ETA</span></th>
                </tr>
              </thead>
              <tbody>
                {tankerBoard.map(r => (
                  <tr key={r.tanker} className="border-b border-edge-subtle/60 last:border-b-0">
                    <td className={`py-1.5 text-${r.tone}`}>{r.tanker}</td>
                    <td className="py-1.5 text-ink">{r.port}</td>
                    <td className="py-1.5 text-right text-ink-dim tabular-nums">{r.eta}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel>
          <PanelHeader label="FEEDSTOCK FLOW · COMP-301" hint="ws://opc-ua · 1s">
            <Badge tone="signal">live</Badge>
          </PanelHeader>
          <div className="p-3">
            <StreamChart
              streamKey="COMP-301:flow"
              label="FEEDSTOCK FLOW"
              unit="kbbl/d"
              warn={152}
              height={130}
              compact
            />
          </div>
        </Panel>

        <Panel>
          <PanelHeader label="FORECAST ACCURACY LADDER" hint="cortex.forecast">
            <Badge tone="amber">MAPE</Badge>
          </PanelHeader>
          <div className="py-1">
            <DataRow label="7d horizon"  value="3.2%"  tone="signal" />
            <DataRow label="14d horizon" value="5.8%"  tone="signal" />
            <DataRow label="30d horizon" value="9.1%"  tone="cyan" />
            <DataRow label="90d horizon" value="14.4%" tone="amber" />
            <DataRow label="benchmark (Brent demand)" value="±1.4 pp" tone="snow" />
          </div>
        </Panel>
      </div>
    </div>
  )
}
