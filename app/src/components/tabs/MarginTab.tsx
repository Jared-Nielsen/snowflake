import { Panel, PanelHeader, Kpi, DataRow } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { SubToolkit } from '@/components/ui/SubToolkit'
import { FlowCanvas } from '@/components/FlowCanvas'
import { FlowInspector } from '@/components/FlowInspector'
import { QueryPanel } from '@/components/QueryPanel'
import { StreamChart } from '@/components/StreamChart'
import { CDUColumn } from '@/components/three/CDUColumn'
import { Tex } from '@/lib/katex'
import { formatUSD, formatInt, formatUSDk, pct } from '@/lib/utils'
import { decorateNodes, decorateEdges } from '@/lib/flowDetails'
import type { Node, Edge } from '@xyflow/react'

const nodes: Node[] = [
  { id: 'wti',   type: 'schematic', position: { x:   0, y:   0 }, data: { code: 'SRC · WTI',    label: 'Sweet Crude · Cushing',   kind: 'source',  status: 'ok',    meta: '128 kbbl @ $74.30' } },
  { id: 'maya',  type: 'schematic', position: { x:   0, y: 130 }, data: { code: 'SRC · MAYA',   label: 'Sour Crude · Maya',       kind: 'source',  status: 'ok',    meta: '92 kbbl @ $68.10'  } },
  { id: 'tk',    type: 'schematic', position: { x: 240, y:  65 }, data: { code: 'TK-501',       label: 'Crude Tank Farm',         kind: 'process', status: 'ok',    meta: '18.2m / 24m'        } },
  { id: 'cdu',   type: 'schematic', position: { x: 480, y:  65 }, data: { code: 'CDU-100',      label: 'Distillation 100',        kind: 'process', status: 'ok',    meta: '358°C · 1.2 bar'    } },
  { id: 'snow',  type: 'schematic', position: { x: 720, y:  65 }, data: { code: 'SNOW · LP',    label: 'Snowpark · PuLP',         kind: 'ai',      status: 'ai',    meta: '15 min cadence'     } },
  { id: 'out',   type: 'schematic', position: { x: 960, y:  65 }, data: { code: 'OUT · BLEND',  label: 'Optimal Blend Spec',      kind: 'output',  status: 'ok',    meta: '+1.2% margin'       } },
]

const edges: Edge[] = [
  { id: 'e1', source: 'wti',  target: 'tk',   animated: true, style: { stroke: '#c79a4a' } },
  { id: 'e2', source: 'maya', target: 'tk',   animated: true, style: { stroke: '#c79a4a' } },
  { id: 'e3', source: 'tk',   target: 'cdu',  animated: true, style: { stroke: '#4ee2f4' } },
  { id: 'e4', source: 'cdu',  target: 'snow', animated: true, style: { stroke: '#4ee2f4' } },
  { id: 'e5', source: 'snow', target: 'out',  animated: true, style: { stroke: '#34d57b' } },
]

const sql = `-- Snowpark · LP blend optimizer (15-min cadence)
WITH crude_lots AS (
  SELECT lot_id, grade, kbbl, api_gravity, sulfur_pct, price_usd_bbl
    FROM cognite.gold.crude_lots_v
   WHERE arrival_ts >= DATEADD(hour, -48, CURRENT_TIMESTAMP())
),
cdu_yields AS (
  SELECT crude_grade, cut, yield_pct, margin_usd_bbl
    FROM cognite.gold.cdu_yields_15m
   WHERE window_end = (SELECT MAX(window_end) FROM cognite.gold.cdu_yields_15m)
)
SELECT
  refinery_ai.solve_blend_lp(
    ARRAY_AGG(OBJECT_CONSTRUCT('lot_id', l.lot_id, 'kbbl', l.kbbl,
                               'sulfur', l.sulfur_pct, 'api', l.api_gravity,
                               'cost', l.price_usd_bbl)),
    ARRAY_AGG(OBJECT_CONSTRUCT('grade', y.crude_grade, 'cut', y.cut,
                               'yield', y.yield_pct, 'margin', y.margin_usd_bbl)),
    target_volume_kbbl => 220,
    max_sulfur_pct     => 1.10
  ) AS plan
  FROM crude_lots l
  JOIN cdu_yields y ON y.crude_grade = l.grade;`

const cortexMock = {
  recommendation: 'BLEND-A',
  inputs: { sweet_kbbl: 142, sour_kbbl: 78 },
  yields: { LPG: 0.04, NAPHTHA: 0.21, JET: 0.18, DIESEL: 0.29, AGO: 0.12, RESID: 0.16 },
  margin_uplift_pct: 0.0124,
  margin_uplift_usd_day: 312_400,
  cortex_conf: 0.91,
}

type CortexMock = typeof cortexMock

const fmt = (raw: unknown) => {
  const m = raw as CortexMock
  return [
    `// Snowpark.LP   solver=PuLP / CBC   horizon=15min   conf=${pct(m.cortex_conf, 1)}`,
    `// model=refinery_ai.solve_blend_lp   warehouse=REFINERY_AI_XL`,
    ``,
    `recommendation        ${m.recommendation}`,
    `inputs.sweet_kbbl     ${formatInt(m.inputs.sweet_kbbl)}`,
    `inputs.sour_kbbl      ${formatInt(m.inputs.sour_kbbl)}`,
    ``,
    `yields:`,
    `  LPG       ${pct(m.yields.LPG, 1)}`,
    `  NAPHTHA   ${pct(m.yields.NAPHTHA, 1)}`,
    `  JET       ${pct(m.yields.JET, 1)}`,
    `  DIESEL    ${pct(m.yields.DIESEL, 1)}`,
    `  AGO       ${pct(m.yields.AGO, 1)}`,
    `  RESID     ${pct(m.yields.RESID, 1)}`,
    ``,
    `margin_uplift_pct     ${pct(m.margin_uplift_pct, 2)}`,
    `margin_uplift_usd_day ${formatUSD(m.margin_uplift_usd_day)}`,
    `annualized_usd        ${formatUSD(m.margin_uplift_usd_day * 365)}`,
    ``,
    `[push] writeback → Cognite.OPTIM_BLEND (zero-copy) ✓`,
    `[push] writeback → SAP.PLAN_BLEND_A (governed) ✓`,
    `[push] notify    → Operations Manager · J. WHEELER ✓`,
  ].join('\n')
}

export function MarginTab() {
  return (
    <div className="px-6 pb-8 space-y-4 animate-reveal-up">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <div className="tag">TOOLKIT · §6.1 MARGIN &amp; YIELD OPTIMIZATION</div>
          <h1 className="font-display text-2xl font-bold tracking-tight mt-1">
            Crude Blending · Yield · Energy · Slate · 15-min cadence
          </h1>
          <div className="tag mt-1 text-ink-muted">
            §6.1.1 Crude Blending (above) · §6.1.2 Yield Opt · §6.1.3 Heat Integration · §6.1.4 Slate (below)
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Badge tone="snow">PuLP / Snowpark</Badge>
          <Badge tone="amber">CORTEX.PREDICT</Badge>
          <Badge tone="signal">+$6–12M ARR</Badge>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <Kpi label="Current Margin"   value="$8.42"   unit="/bbl" tone="signal" delta="+0.18" />
        <Kpi label="LP Uplift"        value="+1.24"   unit="%"    tone="cyan"   delta="+0.21" />
        <Kpi label="Daily Gain"       value="$312k"               tone="cyan"   delta="+$48k" />
        <Kpi label="Annualized"       value="$11.4M"              tone="snow"   delta="+$1.8M" />
      </div>

      <div className="grid grid-cols-[1fr_360px] gap-4 items-stretch">
        <Panel className="flex flex-col">
          <PanelHeader label="DATA FLOW · CRUDE → CDU → LP → BLEND" hint="click nodes/edges to inspect">
            <Badge tone="cyan">animated · draggable</Badge>
          </PanelHeader>
          <div className="p-2 flex-1 min-h-0">
            <FlowCanvas
              flowKey="margin"
              nodes={decorateNodes('margin', nodes)}
              edges={decorateEdges('margin', edges)}
              height={300}
            />
          </div>
        </Panel>
        <FlowInspector />
      </div>

      <Panel>
        <PanelHeader label="LP OBJECTIVE · BLEND" hint="KaTeX" />
        <div className="p-4 space-y-3 grid grid-cols-[auto_1fr] gap-x-6 items-center">
          <Tex display tex={String.raw`\max_{x_i \geq 0} \sum_{i} (R_i - C_i)\, x_i`} className="text-ink" />
          <div className="tag text-ink-muted">subject to</div>
          <Tex display tex={String.raw`\sum_{i} a_{ji}\, x_i \leq b_j \quad \forall j`} className="text-ink-dim" />
          <div className="tag text-ink-muted">mass balance</div>
          <Tex display tex={String.raw`\sum_{i} \rho_i\, x_i = \rho^{*}\, V`} className="text-ink-dim" />
          <div className="tag">
            x<span className="lowercase">i</span> kbbl of crude i · R revenue · C cost · a sulfur/API rows · b spec caps · ρ density
          </div>
        </div>
      </Panel>

      <div className="grid grid-cols-2 gap-4">
        <Panel>
          <PanelHeader label="CDU-100 · ATMOSPHERIC COLUMN" hint="React Three Fiber">
            <Badge tone="copper">3D twin</Badge>
          </PanelHeader>
          <div className="h-[420px] relative">
            <CDUColumn />
            <div className="absolute top-3 left-3 panel-elev px-3 py-2">
              <div className="tag">ORBIT · PAN · ZOOM</div>
            </div>
            <div className="absolute bottom-3 right-3 panel-elev px-3 py-2 font-mono text-[10px] text-ink-muted">
              <div><span className="text-cyan">T</span> 358°C · <span className="text-cyan">P</span> 1.2 bar</div>
              <div>throughput 220 kbbl/d</div>
            </div>
          </div>
        </Panel>
        <QueryPanel
          title="SNOWPARK · solve_blend_lp"
          sql={sql}
          cortex
          mock={cortexMock}
          rows={1}
          formatter={fmt}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Panel className="p-4">
          <StreamChart streamKey="CDU-100:temperature" label="CDU-100 · TEMP" unit="°C" warn={365} threshold={372} />
        </Panel>
        <Panel className="p-4">
          <StreamChart streamKey="HX-205:pressure" label="HX-205 · PRESSURE" unit="bar" warn={7} threshold={7.4} />
        </Panel>
        <Panel className="p-4">
          <StreamChart streamKey="COMP-301:flow" label="COMP-301 · FLOW" unit="kbbl/d" warn={152} threshold={158} />
        </Panel>
      </div>

      {/* ─── §6.1.2 / 6.1.3 / 6.1.4 sub-toolkit deck ─────────────────── */}
      <div className="flex items-end justify-between mt-2">
        <div className="tag text-snow">SUB-TOOLKIT DECK · §6.1.2 → §6.1.4</div>
        <div className="tag text-ink-muted">FCC · UNIT-FCC-01 · BATCH-20260512-001</div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <SubToolkit
          id="§6.1.2"
          title="Real-Time Yield Optimization"
          badge="CORTEX.PREDICT"
          badgeTone="cyan"
          tagline="Gradient-boosted regression on the FCC riser. Predicts next-hour cut split given feed, T, P, LHSV, catalyst age — and returns the bounded-BFGS setpoint that maximizes contribution margin."
          formula={
            <>
              <Tex display tex={String.raw`\hat{y}_{j,t+1} = f_j(\mathbf{x}_t) + \varepsilon_j`} className="text-ink" />
              <Tex display tex={String.raw`\mathbf{x}^{*} = \arg\max_{\mathbf{x}\in\mathcal{X}}\ \sum_j p_j\, f_j(\mathbf{x})`} className="text-ink-dim" />
              <div className="tag">x = (API, Tᵣ, P, LHSV, catalyst age) · p = product price</div>
            </>
          }
          readout={
            <div className="py-1">
              <DataRow label="unit"                value="UNIT-FCC-01"          tone="cyan" />
              <DataRow label="model"               value="yield_xgb_v7"          tone="amber" />
              <DataRow label="reactor T (now)"     value="538 °C"                tone="snow" />
              <DataRow label="suggested T"         value="542 °C  (+4 °C)"       tone="signal" />
              <DataRow label="Δ gasoline yield"    value="+0.4 %"                tone="signal" />
              <DataRow label="confidence"          value="0.89"                  tone="cyan" />
              <DataRow label="est. uplift / yr"    value={formatUSDk(2_900_000)} tone="signal" />
            </div>
          }
          sql={SQL_612}
          mock={MOCK_612}
          rows={96}
          footer="[push] writeback → COGNITE.UNIT_FCC_01.SETPOINT_REC ✓   ·   ROI band $2–4M / yr"
        />

        <SubToolkit
          id="§6.1.3"
          title="Energy Optimization · Heat Integration"
          badge="SNOWPARK UDF"
          badgeTone="amber"
          tagline="Pinch analysis + MILP for utility dispatch. Live fouling resistance on HX-205 from heat-duty residuals — schedule a clean when the energy penalty crosses the cost of the clean."
          formula={
            <>
              <Tex display tex={String.raw`Q = U A \cdot \text{LMTD}`} className="text-ink" />
              <Tex display tex={String.raw`R_f(t) = \dfrac{1}{U(t)} - \dfrac{1}{U_{\text{clean}}}\quad \text{clean if } R_f \ge R_f^{*}`} className="text-ink-dim" />
              <div className="tag">U overall heat-transfer coeff · LMTD log-mean Δ · R_f fouling resistance</div>
            </>
          }
          readout={
            <div className="py-1">
              <DataRow label="asset"               value="HX-205"                tone="cyan" />
              <DataRow label="U (now)"             value="612 W/m²K"             tone="snow" />
              <DataRow label="U (clean baseline)"  value="850 W/m²K"             tone="snow" />
              <DataRow label="R_f"                 value="4.6×10⁻⁴"              tone="amber" />
              <DataRow label="threshold"           value="4.0×10⁻⁴" />
              <DataRow label="clean window"        value="WK-22 outage"          tone="signal" />
              <DataRow label="avoided fuel gas"    value={formatUSDk(90_000) + ' / qtr'} tone="signal" />
            </div>
          }
          sql={SQL_613}
          mock={MOCK_613}
          rows={42}
          footer="[push] writeback → SAP-PM.HX-205.CLEAN_RECOMMENDED ✓   ·   ROI band $1–2M / yr"
        />

        <SubToolkit
          id="§6.1.4"
          title="Product Slate Optimization"
          badge="PuLP · MILP"
          badgeTone="copper"
          tagline="Mixed-integer mode selector tied to the Endur paper book. Given the long crack on TRADE-001 and gasoline forward strength, the solver picks max-gasoline mode locked in for the next 24h."
          formula={
            <>
              <Tex display tex={String.raw`\max_{z_m\in\{0,1\},\,x}\ \sum_m z_m \cdot \pi_m(x)`} className="text-ink" />
              <Tex display tex={String.raw`\text{s.t.}\quad \sum_m z_m = 1`} className="text-ink-dim" />
              <div className="tag">z_m binary mode select · π_m mode-specific contribution margin</div>
            </>
          }
          readout={
            <div className="py-1">
              <DataRow label="batch"               value="BATCH-20260512-001"    tone="cyan" />
              <DataRow label="signal · ENDUR"      value="TRADE-001 long crack"  tone="cyan" />
              <DataRow label="mode selected"       value="MAX_GASOLINE"          tone="signal" />
              <DataRow label="locked window"       value="24 h"                  tone="snow" />
              <DataRow label="vs balanced mode"    value="+0.6 % cont. margin"   tone="signal" />
              <DataRow label="solve time"          value="11.4 s"                tone="snow" />
              <DataRow label="est. uplift / yr"    value={formatUSDk(1_500_000)} tone="signal" />
            </div>
          }
          sql={SQL_614}
          mock={MOCK_614}
          rows={4}
          footer="[push] writeback → QUORUM.DISPATCH.SLATE_MODE = MAX_GASOLINE ✓   ·   ROI band $1–2M / yr"
        />
      </div>
    </div>
  )
}

/* ─── §6.1.2 · Yield Optimization SQL + mock ──────────────────────── */
const SQL_612 = `-- Cortex regression: next-hour FCC riser yields → bounded-BFGS setpoint
WITH state AS (
  SELECT  ts, asset_id,
          MAX(CASE WHEN sensor='reactor_temp' THEN value END) AS t_reactor,
          MAX(CASE WHEN sensor='reactor_p'    THEN value END) AS p,
          MAX(CASE WHEN sensor='lhsv'         THEN value END) AS lhsv,
          MAX(CASE WHEN sensor='cat_age_h'    THEN value END) AS cat_age
    FROM cognite.silver.timeseries_1m
   WHERE asset_id = 'UNIT-FCC-01'
     AND ts >= DATEADD(hour, -1, CURRENT_TIMESTAMP())
   GROUP BY ts, asset_id
)
SELECT  asset_id, ts,
        SNOWFLAKE.CORTEX.PREDICT(
          MODEL  => 'yield_xgb_v7',
          INPUT  => OBJECT_CONSTRUCT('t', t_reactor, 'p', p, 'lhsv', lhsv, 'cat', cat_age)
        )                                              AS y_hat,
        refinery_ai.bounded_bfgs_setpoint(y_hat, price_curve)  AS x_star
  FROM  state s
  JOIN  gold.product_prices_latest USING (asset_id)
 ORDER BY ts DESC LIMIT 1;`
const MOCK_612 = {
  asset_id: 'UNIT-FCC-01',
  reactor_t_now_c: 538, reactor_t_suggested_c: 542, delta_c: 4,
  gasoline_yield_delta_pct: 0.004, diesel_yield_delta_pct: -0.001,
  cortex_conf: 0.89, model: 'yield_xgb_v7',
  est_uplift_usd_yr: 2_900_000,
  writeback: 'COGNITE.UNIT_FCC_01.SETPOINT_REC',
}

/* ─── §6.1.3 · Energy / Heat Integration SQL + mock ───────────────── */
const SQL_613 = `-- Snowpark UDF: live fouling resistance on HX-205 + clean economics
WITH duty AS (
  SELECT  ts,
          AVG(t_hot_in)  AS t_hi, AVG(t_hot_out)  AS t_ho,
          AVG(t_cold_in) AS t_ci, AVG(t_cold_out) AS t_co,
          AVG(q_kw)      AS q
    FROM  cognite.silver.hx_timeseries_1m
   WHERE  asset_id = 'HX-205'
     AND  ts >= DATEADD(day, -7, CURRENT_TIMESTAMP())
   GROUP BY ts
)
SELECT  ts,
        refinery_ai.lmtd(t_hi, t_ho, t_ci, t_co)              AS lmtd,
        q / (refinery_ai.lmtd(t_hi, t_ho, t_ci, t_co) * 248)  AS u_now,
        refinery_ai.fouling_resistance(u_now, 850)            AS r_f,
        CASE WHEN r_f >= 4.0e-4 THEN 'CLEAN_RECOMMENDED' ELSE 'OK' END  AS action,
        refinery_ai.clean_economics(r_f, q, 90_000)           AS payback_usd
  FROM  duty ORDER BY ts DESC LIMIT 1;`
const MOCK_613 = {
  asset_id: 'HX-205',
  u_now_wm2k: 612, u_clean_wm2k: 850,
  r_f: 4.6e-4, r_f_threshold: 4.0e-4,
  action: 'CLEAN_RECOMMENDED',
  clean_window: 'OUTAGE-WK22',
  avoided_fuel_usd_qtr: 90_000,
  cortex_conf: 0.93,
}

/* ─── §6.1.4 · Slate Optimization SQL + mock ──────────────────────── */
const SQL_614 = `-- PuLP MILP: pick discrete operating mode honoring Endur paper exposure
WITH endur AS (
  SELECT  SUM(qty_kbbl * CASE WHEN side='buy' THEN 1 ELSE -1 END) AS crack_net_kbbl
    FROM  endur.gold.positions
   WHERE  commodity = 'crack_321'
)
SELECT  refinery_ai.solve_slate_milp(
          modes      => ['MAX_GASOLINE','BALANCED','MAX_DIESEL','PETCHEM_SWING'],
          crack_pos  => (SELECT crack_net_kbbl FROM endur),
          forwards   => ARRAY_AGG(OBJECT_CONSTRUCT('p', product, 'f', f_curve)),
          horizon_h  => 24
        ) AS plan
  FROM  gold.product_forward_curves
 WHERE  business_date = CURRENT_DATE();`
const MOCK_614 = {
  batch: 'BATCH-20260512-001',
  endur_signal: 'TRADE-001 long crack +80 kbbl',
  mode_selected: 'MAX_GASOLINE',
  vs_balanced_pct: 0.006,
  locked_window_h: 24,
  solve_time_s: 11.4,
  est_uplift_usd_yr: 1_500_000,
  writeback: 'QUORUM.DISPATCH.SLATE_MODE',
}
