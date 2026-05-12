import { Panel, PanelHeader, Kpi, DataRow } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { FlowCanvas } from '@/components/FlowCanvas'
import { FlowInspector } from '@/components/FlowInspector'
import { QueryPanel } from '@/components/QueryPanel'
import { StreamChart } from '@/components/StreamChart'
import { Smokestack } from '@/components/three/Smokestack'
import { Tex } from '@/lib/katex'
import { formatUSDk, pct } from '@/lib/utils'
import { decorateNodes, decorateEdges } from '@/lib/flowDetails'
import type { Node, Edge } from '@xyflow/react'

// ---------- React Flow graph: CEMS → Snowpark GHG calc → Cortex leak → ESG report → CDP
const nodes: Node[] = [
  {
    id: 'stack',
    type: 'schematic',
    position: { x: 0, y: 0 },
    data: { code: 'STACK-3', label: 'FCC Smokestack', kind: 'source', status: 'warn', meta: 'CEMS · 1Hz' },
  },
  {
    id: 'fuel',
    type: 'schematic',
    position: { x: 0, y: 110 },
    data: { code: 'FUEL-TS', label: 'Fuel-gas / steam', kind: 'source', status: 'ok', meta: 'OPC-UA' },
  },
  {
    id: 'calc',
    type: 'schematic',
    position: { x: 260, y: 55 },
    data: { code: 'SNOW · CALC', label: 'Snowpark · GHG calc', kind: 'process', status: 'ok', meta: 'EPA AP-42' },
  },
  {
    id: 'leak',
    type: 'schematic',
    position: { x: 520, y: 55 },
    data: { code: 'CORTEX · LEAK', label: 'Methane Leak Detect', kind: 'ai', status: 'ai', meta: 'CV+telemetry' },
  },
  {
    id: 'esg',
    type: 'schematic',
    position: { x: 780, y: 55 },
    data: { code: 'OUT · ESG', label: 'ESG Report (CSRD/IFRS)', kind: 'output', status: 'ok', meta: 't+0 auto-gen' },
  },
  {
    id: 'cdp',
    type: 'schematic',
    position: { x: 1040, y: 55 },
    data: { code: 'REG · CDP', label: 'CDP / TCFD Disclosure', kind: 'sink', status: 'ok', meta: 'zero-copy share' },
  },
]

const edges: Edge[] = [
  { id: 'e1', source: 'stack', target: 'calc', animated: true },
  { id: 'e2', source: 'fuel', target: 'calc', animated: true },
  { id: 'e3', source: 'calc', target: 'leak', animated: true },
  { id: 'e4', source: 'leak', target: 'esg', animated: true },
  { id: 'e5', source: 'esg', target: 'cdp', animated: true },
]

// ---------- Cortex / Snowpark mock result
const cortexMock = {
  scope1_today_t: 1.42,
  scope2_today_t: 0.84,
  scope3_today_t: 2.18,
  intensity_kg_per_bbl: 31.2,
  baseline_intensity_kg_per_bbl: 32.5,
  methane_leaks_detected: 2,
  leak_locations: ['FLR-2 valve', 'PIPE-N-04'],
  avoided_cost_carbon_usd_yr: 1_840_000,
  forecast_2030_reduction_pct: 0.31,
  esg_score_current: 'B+',
  esg_score_forecast: 'A−',
}

const sql = `-- Scope 1/2/3 emissions across the gold tier + 12-month Cortex forecast
WITH scope1 AS (
  SELECT  DATE_TRUNC('hour', ts)               AS hr,
          SUM(co2_mass_kg) / 1000               AS co2_t,
          SUM(ch4_mass_kg) / 1000 * 28          AS ch4_co2e_t   -- GWP-100
  FROM    cognite.gold.cems_1s
  WHERE   stack_id IN ('STACK-3','STACK-4')
    AND   ts > DATEADD(hour, -1, CURRENT_TIMESTAMP())
  GROUP BY 1
),
scope2 AS (
  SELECT  hr, grid_kwh * grid_ef_kg_per_kwh / 1000 AS co2_t
  FROM    sap.gold.fuel_use
  WHERE   hr > DATEADD(hour, -1, CURRENT_TIMESTAMP())
),
intensity AS (
  SELECT  (SUM(s1.co2_t + s1.ch4_co2e_t) + SUM(s2.co2_t)) * 1000
          / NULLIF(SUM(q.bbl_throughput), 0)      AS kg_per_bbl
  FROM    scope1 s1 JOIN scope2 s2 USING (hr)
                  JOIN quorum.gold.throughput_1h q USING (hr)
)
SELECT  i.kg_per_bbl                                          AS intensity,
        SNOWFLAKE.CORTEX.FORECAST(
          INPUT_DATA => (SELECT ARRAY_AGG(co2_t) FROM scope1),
          HORIZON    => 12, FREQUENCY => 'MONTH'
        )                                                     AS fcst_12m,
        CORTEX_AI.LEAK_DETECT(stack_id => 'STACK-3')          AS leak
FROM    intensity i;`

function fmt(m: unknown) {
  const x = m as typeof cortexMock
  return [
    `// Snowflake · REFINERY_AI_XL · zero-copy + Cortex`,
    `// CEMS feed: cognite.gold.cems_1s   ·   Fuel feed: sap.gold.fuel_use`,
    ``,
    `[scope_today]`,
    `  scope_1_t/hr ............... ${x.scope1_today_t}`,
    `  scope_2_t/hr ............... ${x.scope2_today_t}`,
    `  scope_3_t/hr ............... ${x.scope3_today_t}`,
    `  intensity .................. ${x.intensity_kg_per_bbl} kg/bbl`,
    `  baseline ................... ${x.baseline_intensity_kg_per_bbl} kg/bbl   (−${(((x.baseline_intensity_kg_per_bbl - x.intensity_kg_per_bbl) / x.baseline_intensity_kg_per_bbl) * 100).toFixed(1)}%)`,
    ``,
    `[cortex.leak_detect]   model=fugitive-v3`,
    `  leaks_detected ............. ${x.methane_leaks_detected}`,
    `  locations .................. ${x.leak_locations.join(', ')}`,
    ``,
    `[forecast]   horizon=12mo · freq=MONTH`,
    `  2030_reduction ............. ${pct(x.forecast_2030_reduction_pct)}`,
    `  esg_score .................. ${x.esg_score_current}  →  ${x.esg_score_forecast}`,
    `  carbon_cost_avoided ........ ${formatUSDk(x.avoided_cost_carbon_usd_yr)} / yr`,
    ``,
    `[push] writeback → Cognite.STACK_3.LEAK_FLAG · auto-MOC ticketed ✓`,
  ].join('\n')
}

export function SustainabilityTab() {
  return (
    <div className="px-6 pb-8 space-y-4 animate-reveal-up">
      {/* 1. Section header */}
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <div className="tag">TOOLKIT · §6.5 SUSTAINABILITY &amp; REPORTING</div>
          <h1 className="font-display text-2xl font-bold tracking-tight mt-1">
            Scope 1/2/3 emissions · Methane leak detection · ESG pipeline
          </h1>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Badge tone="signal">GHG Protocol</Badge>
          <Badge tone="amber">CORTEX.FORECAST</Badge>
          <Badge tone="snow">+$1–3M ESG</Badge>
        </div>
      </div>

      {/* 2. KPI strip */}
      <div className="grid grid-cols-4 gap-3">
        <Kpi label="CO₂ INTENSITY" value="31.2" unit="kg/bbl" tone="signal" delta="−4.1%" />
        <Kpi label="SCOPE 1 (TODAY)" value="1.42" unit="t/hr" tone="amber" />
        <Kpi label="METHANE LEAKS (24h)" value="2" tone="alarm" />
        <Kpi label="ESG SCORE" value="B+" unit="→ A−" tone="snow" delta="ramp" />
      </div>

      {/* 3. Flow + Inspector */}
      <div className="grid grid-cols-[1fr_360px] gap-4 items-stretch">
        <Panel className="flex flex-col">
          <PanelHeader label="DATA FLOW · CEMS → GHG ENGINE → ESG DISCLOSURE" hint="click nodes/edges to inspect">
            <Badge tone="cyan">animated · draggable</Badge>
          </PanelHeader>
          <div className="p-2 flex-1 min-h-0">
            <FlowCanvas
              flowKey="sustainability"
              nodes={decorateNodes('sustainability', nodes)}
              edges={decorateEdges('sustainability', edges)}
              height={300}
            />
          </div>
        </Panel>
        <FlowInspector />
      </div>

      <Panel>
        <PanelHeader label="GHG ACCOUNTING" hint="KaTeX" />
        <div className="p-4 space-y-3 grid grid-cols-[auto_1fr] gap-x-6 items-center">
          <Tex
            display
            tex={String.raw`E_{\text{Scope 1}} = \sum_{i} A_i \cdot EF_i \cdot GWP_i`}
            className="text-ink"
          />
          <div className="tag text-ink-muted">carbon intensity</div>
          <Tex
            display
            tex={String.raw`I = \dfrac{E_{\text{Scope 1}} + E_{\text{Scope 2}} + E_{\text{Scope 3}}}{Q_{\text{product}}}`}
            className="text-ink-dim"
          />
          <div className="tag">
            A = activity · EF = emission factor (EPA AP-42) · GWP-100 · Q = bbl throughput
          </div>
        </div>
      </Panel>

      {/* 4. 3D scene + Query */}
      <div className="grid grid-cols-2 gap-4">
        <Panel>
          <PanelHeader label="STACK-3 · FCC SMOKESTACK · CEMS TWIN" hint="React Three Fiber">
            <Badge tone="copper">3D twin</Badge>
          </PanelHeader>
          <div className="h-[420px] relative">
            <Smokestack />
            <div className="absolute top-3 left-3 panel-elev px-3 py-2">
              <div className="tag">ORBIT · PAN · ZOOM</div>
            </div>
            <div className="absolute top-3 right-3 panel-elev px-3 py-2">
              <div className="tag">CEMS · 1Hz · GHG TELEMETRY</div>
            </div>
          </div>
        </Panel>

        <QueryPanel
          title="GHG · SCOPE 1/2/3 + CORTEX.FORECAST(12mo)"
          sql={sql}
          cortex
          mock={cortexMock}
          rows={4}
          formatter={fmt}
        />
      </div>

      {/* 5. Bottom row */}
      <div className="grid grid-cols-3 gap-4">
        <Panel>
          <PanelHeader label="HX-205 · STACK TEMP" hint="ws://opc-ua · 1s">
            <Badge tone="signal">live</Badge>
          </PanelHeader>
          <div className="p-3">
            <StreamChart
              streamKey="HX-205:temperature"
              label="HX-205 STACK TEMP"
              unit="°C"
              height={130}
              compact
            />
          </div>
        </Panel>

        <Panel>
          <PanelHeader label="METHANE LEAK ALARMS" hint="cortex.leak_detect">
            <Badge tone="alarm">2 OPEN</Badge>
          </PanelHeader>
          <ul className="p-3 space-y-2 font-mono text-[11px]">
            <li className="flex items-center gap-3 border-b border-edge-subtle/60 pb-2">
              <span className="led led-red animate-pulse-soft" />
              <span className="text-alarm">FLR-2 valve</span>
              <span className="text-ink-muted ml-auto">17:42:08Z</span>
            </li>
            <li className="flex items-center gap-3 border-b border-edge-subtle/60 pb-2">
              <span className="led led-red animate-pulse-soft" />
              <span className="text-alarm">PIPE-N-04</span>
              <span className="text-ink-muted ml-auto">16:09:41Z</span>
            </li>
            <li className="flex items-center gap-3 opacity-50">
              <span className="led led-off" />
              <span className="text-ink-dim">FCC-RISER (cleared)</span>
              <span className="text-ink-muted ml-auto">11:22:03Z</span>
            </li>
            <li className="flex items-center gap-3 opacity-50">
              <span className="led led-off" />
              <span className="text-ink-dim">TK-501 vent (cleared)</span>
              <span className="text-ink-muted ml-auto">09:14:55Z</span>
            </li>
          </ul>
        </Panel>

        <Panel>
          <PanelHeader label="ESG ROADMAP" hint="board-approved targets">
            <Badge tone="snow">v2026</Badge>
          </PanelHeader>
          <div className="py-1">
            <DataRow label="2030 · Scope 1 reduction" value="−31%" tone="signal" />
            <DataRow label="2030 · methane intensity" value="0.05%" tone="signal" />
            <DataRow label="2040 · net-zero Scope 1+2" value="committed" tone="cyan" />
            <DataRow label="2040 · renewable diesel" value="40% blend" tone="cyan" />
            <DataRow label="2050 · net-zero Scope 3" value="aspirational" tone="snow" />
            <DataRow label="2050 · CCUS capacity" value="1.4 Mt/yr" tone="snow" />
          </div>
        </Panel>
      </div>
    </div>
  )
}
