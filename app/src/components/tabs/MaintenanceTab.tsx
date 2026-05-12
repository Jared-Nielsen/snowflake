import { useMemo, useState } from 'react'
import { Panel, PanelHeader, Kpi, DataRow } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { SubToolkit } from '@/components/ui/SubToolkit'
import { FlowCanvas } from '@/components/FlowCanvas'
import { FlowInspector } from '@/components/FlowInspector'
import { QueryPanel } from '@/components/QueryPanel'
import { StreamChart } from '@/components/StreamChart'
import { PumpModel } from '@/components/three/PumpModel'
import {
  PumpPerformanceCurves,
  SystemCurveOverlay,
  PumpPID,
  PumpCrossSection,
  VibrationAnalysisDeck,
  PVIndicatorDiagram,
  HydraulicSchematic,
  KValueTable,
} from '@/components/diagrams/PumpDiagrams'
import { Tex } from '@/lib/katex'
import { formatUSD, formatUSDk, pct } from '@/lib/utils'
import { decorateNodes, decorateEdges } from '@/lib/flowDetails'
import type { Node, Edge } from '@xyflow/react'
import { useStreamStore } from '@/store/streamStore'

const nodes: Node[] = [
  { id: 'pump',    type: 'schematic', position: { x:   0, y:  80 }, data: { code: 'PUMP-401',  label: 'Charge Pump',              kind: 'source',  status: 'warn',  meta: 'vib · t · p · q' } },
  { id: 'cog',     type: 'schematic', position: { x: 240, y:  80 }, data: { code: 'COGNITE',   label: 'Industrial Graph',         kind: 'process', status: 'ok',    meta: 'zero-copy share' } },
  { id: 'snow',    type: 'schematic', position: { x: 480, y:  80 }, data: { code: 'SNOW · ANOM', label: 'Cortex Anomaly Detector', kind: 'ai',    status: 'alarm', meta: 'Hotelling T²'    } },
  { id: 'cortex',  type: 'schematic', position: { x: 720, y:   0 }, data: { code: 'CORTEX',    label: 'Failure Forecast',         kind: 'ai',      status: 'warn',  meta: 'P(fail) 14d'     } },
  { id: 'out',     type: 'schematic', position: { x: 720, y: 160 }, data: { code: 'OUT · MAX', label: 'SAP PM Work Order',        kind: 'output',  status: 'ok',    meta: 'auto-create · J. WHEELER' } },
]

const edges: Edge[] = [
  { id: 'e1', source: 'pump',  target: 'cog',    animated: true, style: { stroke: '#ffb627' } },
  { id: 'e2', source: 'cog',   target: 'snow',   animated: true, style: { stroke: '#4ee2f4' } },
  { id: 'e3', source: 'snow',  target: 'cortex', animated: true, style: { stroke: '#4ee2f4' } },
  { id: 'e4', source: 'snow',  target: 'out',    animated: true, style: { stroke: '#34d57b' } },
]

const sql = `-- Snowpark · Multivariate Anomaly Detection on PUMP-401
WITH win AS (
  SELECT ts, asset_id, sensor, value
    FROM cognite.silver.timeseries_1m
   WHERE asset_id = 'PUMP-401'
     AND ts >= DATEADD(day, -7, CURRENT_TIMESTAMP())
),
features AS (
  SELECT ts,
         MAX(CASE WHEN sensor = 'vibration'   THEN value END) AS vib,
         MAX(CASE WHEN sensor = 'temperature' THEN value END) AS t,
         MAX(CASE WHEN sensor = 'pressure'    THEN value END) AS p,
         MAX(CASE WHEN sensor = 'flow'        THEN value END) AS q
    FROM win
   GROUP BY ts
)
SELECT
  ts,
  vib, t, p, q,
  SNOWFLAKE.CORTEX.ANOMALY_DETECTION(
    INPUT_DATA  => ARRAY_CONSTRUCT(vib, t, p, q),
    MODEL       => 'hotelling_t2',
    SENSITIVITY => 0.97
  ) AS t2_score,
  SNOWFLAKE.CORTEX.FORECAST(
    INPUT_DATA => OBJECT_CONSTRUCT('vib', vib),
    HORIZON    => 14, UNIT => 'day'
  ) AS p_failure_14d
  FROM features
 ORDER BY ts DESC
 LIMIT 1;`

const cortexMock = {
  asset_id: 'PUMP-401',
  current_vib_mm_s: 7.8,
  baseline_mm_s: 4.2,
  z_score: 4.81,
  t2_statistic: 19.2,
  p_failure_14d: 0.36,
  recommendation: 'INSPECT BEARING · DEFER PLANNED OUTAGE WK-22',
  estimated_avoided_loss_usd: 1_240_000,
  work_order: 'WO-2026-04421',
}

type CortexMock = typeof cortexMock

const fmt = (raw: unknown) => {
  const m = raw as CortexMock
  return [
    `// Cortex.ANOMALY_DETECTION   model=hotelling_t2   sensitivity=0.97`,
    `// horizon=14d  paths=10000  warehouse=REFINERY_AI_XL`,
    ``,
    `asset_id              ${m.asset_id}`,
    `current_vib_mm_s      ${m.current_vib_mm_s.toFixed(2)}`,
    `baseline_mm_s         ${m.baseline_mm_s.toFixed(2)}`,
    `z_score               ${m.z_score.toFixed(2)}      ← > 3.0  ALARM`,
    `t2_statistic          ${m.t2_statistic.toFixed(2)}     ← > 11.3 ALARM (99% χ²₄)`,
    `p_failure_14d         ${pct(m.p_failure_14d, 1)}`,
    ``,
    `recommendation        ${m.recommendation}`,
    `est. avoided_loss     ${formatUSD(m.estimated_avoided_loss_usd)}`,
    `work_order            ${m.work_order}`,
    ``,
    `[push] writeback → COGNITE.PUMP_401.STATE = "BEARING_RISK" ✓`,
    `[push] writeback → SAP-PM.${m.work_order} (auto-created) ✓`,
    `[push] notify    → Reliability Eng · M. RIVERA, J. WHEELER ✓`,
  ].join('\n')
}

export function MaintenanceTab() {
  return (
    <div className="px-6 pb-8 space-y-4 animate-reveal-up">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <div className="tag">TOOLKIT · §6.2 PREDICTIVE MAINTENANCE &amp; ASSET RELIABILITY</div>
          <h1 className="font-display text-2xl font-bold tracking-tight mt-1">
            PUMP-401 · Multivariate anomaly · 14-day failure forecast
          </h1>
          <div className="tag mt-1 text-ink-muted">
            §6.2.1 Failure Prediction (above) · §6.2.2 Anomaly Detection · §6.2.3 Digital Twin What-If (below)
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Badge tone="amber">Hotelling T²</Badge>
          <Badge tone="cyan">CORTEX.ANOMALY</Badge>
          <Badge tone="signal">+$4–9M ARR</Badge>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <Kpi label="Active Anomalies"   value="2"        tone="amber"  delta="+1" />
        <Kpi label="MTBF (90d)"          value="148"   unit="hr" tone="cyan" delta="+6h" />
        <Kpi label="Avoided Outage"      value="$1.24M"   tone="signal" delta="+$420k" />
        <Kpi label="OEE Lift"            value="+3.1%"    tone="snow"   delta="+0.4%" />
      </div>

      <div className="grid grid-cols-[1fr_360px] gap-4 items-stretch">
        <Panel className="flex flex-col">
          <PanelHeader label="DATA FLOW · SENSOR → COGNITE → CORTEX → SAP-PM" hint="click nodes/edges to inspect">
            <Badge tone="cyan">animated · draggable</Badge>
          </PanelHeader>
          <div className="p-2 flex-1 min-h-0">
            <FlowCanvas
              flowKey="maintenance"
              nodes={decorateNodes('maintenance', nodes)}
              edges={decorateEdges('maintenance', edges)}
              height={300}
            />
          </div>
        </Panel>
        <FlowInspector />
      </div>

      <Panel>
        <PanelHeader label="HOTELLING T² · WEIBULL" hint="KaTeX" />
        <div className="p-4 space-y-3 grid grid-cols-[auto_1fr] gap-x-6 items-center">
          <Tex display tex={String.raw`T^{2} = (\mathbf{x} - \boldsymbol{\mu})^{\top}\, S^{-1}\, (\mathbf{x} - \boldsymbol{\mu})`} className="text-ink" />
          <div className="tag text-ink-muted">failure probability (Weibull survival)</div>
          <Tex display tex={String.raw`P_{\text{fail}}(t) = 1 - e^{-\left(t/\eta\right)^{\beta}}`} className="text-ink-dim" />
          <div className="tag">
            x feature vector (vib, t, p, q) · μ baseline mean · S covariance · η scale · β shape
          </div>
        </div>
      </Panel>

      <div className="grid grid-cols-2 gap-4">
        <Panel>
          <PanelHeader label="PUMP-401 · CENTRIFUGAL TWIN" hint="React Three Fiber">
            <Badge tone="copper">3D twin</Badge>
          </PanelHeader>
          <div className="h-[420px] relative">
            <PumpModel />
            <div className="absolute top-3 left-3 panel-elev px-3 py-2">
              <div className="tag">ORBIT · PAN · ZOOM</div>
            </div>
            <div className="absolute bottom-3 right-3 panel-elev px-3 py-2 font-mono text-[10px] text-ink-muted">
              <div><span className="text-cyan">RPM</span> 1740 · API 610</div>
              <div><span className="text-cyan">SUCT</span> 0.4 bar · <span className="text-cyan">DISCH</span> 8.2 bar</div>
            </div>
          </div>
        </Panel>
        <QueryPanel
          title="CORTEX · ANOMALY_DETECTION"
          sql={sql}
          cortex
          mock={cortexMock}
          rows={1}
          formatter={fmt}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Panel className="p-4">
          <StreamChart streamKey="PUMP-401:vibration" label="PUMP-401 · VIBRATION" unit="mm/s" warn={5} threshold={6} />
        </Panel>
        <Panel className="p-4">
          <StreamChart streamKey="PUMP-402:vibration" label="PUMP-402 · VIBRATION" unit="mm/s" warn={4.5} threshold={5} />
        </Panel>
      </div>

      <SubToolkitDeck />

      <EngineeringDiagramsDeck />
    </div>
  )
}

/* ─── PUMP-401 · canonical engineering diagrams ──────────────────── */

function EngineeringDiagramsDeck() {
  return (
    <>
      <div className="flex items-end justify-between mt-4">
        <div>
          <div className="tag text-snow">ENGINEERING DIAGRAMS · PUMP-401</div>
          <div className="font-cond text-[12px] text-ink-dim mt-0.5">
            8 canonical diagrams used by reliability engineers · sized, contextualized, instrumented and feature-store backed
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Badge tone="cyan">H-Q + SYSTEM</Badge>
          <Badge tone="snow">P&amp;ID</Badge>
          <Badge tone="copper">CUTAWAY</Badge>
          <Badge tone="flare">VIBRATION</Badge>
        </div>
      </div>

      {/* Row 1 — performance + system curves */}
      <div className="grid grid-cols-2 gap-4">
        <Panel>
          <PanelHeader label="01 · PUMP PERFORMANCE CURVES · H-Q · η · BHP · NPSHr" hint="manufacturer · API 610">
            <Badge tone="cyan">H-Q</Badge>
          </PanelHeader>
          <div className="p-3">
            <PumpPerformanceCurves operatingFlowGpm={1450} />
            <div className="mt-2 font-mono text-[10px] text-ink-muted leading-relaxed">
              Four overlaid curves — head, efficiency (peaks at BEP), brake horsepower and NPSHr — all referenced against the live operating point. Used for sizing, BEP checks and cavitation margin.
            </div>
          </div>
        </Panel>

        <Panel>
          <PanelHeader label="02 · SYSTEM CURVE × PUMP CURVE · operating point" hint="Bernoulli + minor losses">
            <Badge tone="signal">overlay</Badge>
          </PanelHeader>
          <div className="p-3">
            <SystemCurveOverlay operatingFlowGpm={1450} />
            <div className="mt-2 font-mono text-[10px] text-ink-muted leading-relaxed">
              System curve <Tex tex={String.raw`H_{sys} = H_{static} + K \cdot Q^{2}`} /> intersects the pump curve at the actual operating point. Throttle valve closing raises K; VFD speed changes shift the pump curve.
            </div>
          </div>
        </Panel>
      </div>

      {/* Row 2 — P&ID + cross-section */}
      <div className="grid grid-cols-2 gap-4">
        <Panel>
          <PanelHeader label="03 · P&ID · ISA-5.1 PROCESS &amp; INSTRUMENTATION" hint="control + safety">
            <Badge tone="snow">P&amp;ID</Badge>
          </PanelHeader>
          <div className="p-3">
            <PumpPID />
            <div className="mt-2 font-mono text-[10px] text-ink-muted leading-relaxed">
              The pump in full process context: gate + check valves, pressure transmitters PT-101/102, flow loop FIC-101 · FV-101, PSV-101 relief and the VT-401 vibration tag feeding Cortex anomaly.
            </div>
          </div>
        </Panel>

        <Panel>
          <PanelHeader label="04 · MECHANICAL CROSS-SECTION · GA DRAWING" hint="API-610 OH2">
            <Badge tone="copper">cutaway</Badge>
          </PanelHeader>
          <div className="p-3">
            <PumpCrossSection />
            <div className="mt-2 font-mono text-[10px] text-ink-muted leading-relaxed">
              Internal mechanical layout: TEFC motor, coupling, DE/NDE bearings, mechanical seal, impeller with wear ring, single-stage volute, suction and discharge nozzles with flanges.
            </div>
          </div>
        </Panel>
      </div>

      {/* Row 3 — vibration analysis */}
      <Panel>
        <PanelHeader label="05 · VIBRATION ANALYSIS · FFT · ORBIT · BODE · WATERFALL · CENTERLINE" hint="live · PUMP-401 stream">
          <Badge tone="flare">condition monitoring</Badge>
          <Badge tone="cyan">live</Badge>
        </PanelHeader>
        <div className="p-3">
          <VibrationAnalysisDeck />
          <div className="mt-2 font-mono text-[10px] text-ink-muted leading-relaxed">
            FFT shows the 1× / 2× harmonic content (1× peak amplifies in alarm) · orbit traces shaft motion at the DE proximity probes · Bode amplitude vs RPM identifies critical speeds · waterfall shows spectrum drift across the last six samples · shaft centerline plot tracks bearing-clearance drift.
          </div>
        </div>
      </Panel>

      {/* Row 4 — P-V + hydraulic schematic */}
      <div className="grid grid-cols-2 gap-4">
        <Panel>
          <PanelHeader label="06 · P-V INDICATOR DIAGRAM · representative" hint="reciprocating cycle">
            <Badge tone="amber">N/A · centrifugal</Badge>
          </PanelHeader>
          <div className="p-3">
            <PVIndicatorDiagram />
          </div>
        </Panel>
        <Panel>
          <PanelHeader label="07 · HYDRAULIC + ELECTRICAL SCHEMATIC" hint="ISO 1219 + single-line">
            <Badge tone="snow">schematic</Badge>
          </PanelHeader>
          <div className="p-3">
            <HydraulicSchematic />
            <div className="mt-2 font-mono text-[10px] text-ink-muted leading-relaxed">
              Source tank → strainer → centrifugal pump symbol → check valve → throttle → CDU-100 destination. VFD-driven 4 kV 3φ motor controls speed.
            </div>
          </div>
        </Panel>
      </div>

      {/* Row 5 — K-value table */}
      <Panel>
        <PanelHeader label="08 · K-VALUE COEFFICIENTS · CRANE TP-410 · feeds the system curve" hint="Cognite PI AF attributes">
          <Badge tone="cyan">static · ingest once</Badge>
        </PanelHeader>
        <div className="p-4">
          <KValueTable />
        </div>
      </Panel>
    </>
  )
}

/* ─── §6.2.2 / 6.2.3 sub-toolkit deck ──────────────────────────────── */

function isoScore(vib: number, baseline = 4.2): number {
  // Mocked Isolation-Forest style score in [0,1]: higher = more anomalous.
  const delta = Math.max(0, vib - baseline)
  return Math.min(0.99, 0.45 + delta * 0.11)
}

function SubToolkitDeck() {
  const vibArr = useStreamStore(s => s.streams['PUMP-401:vibration'] || [])
  const vibNow = vibArr[vibArr.length - 1]?.value ?? 4.8
  const aScore = useMemo(() => isoScore(vibNow), [vibNow])
  const [derate, setDerate] = useState(8) // percent
  const throughputBase = 220 // kbbl/d at CDU
  const throughputNew  = throughputBase * (1 - derate / 100)
  const marginDelta    = -1 * derate * 32_000 // ~$32k margin loss per pct derate
  const mtbfDelta      = derate * 2.8         // ~2.8 days MTBF gain per pct derate

  /* SQL · §6.2.2 anomaly stream */
  const sql622 = `-- CORTEX.ANOMALY_DETECTION on the full multivariate sensor stream
WITH win AS (
  SELECT  ts, asset_id, sensor, value
    FROM  cognite.silver.timeseries_1m
   WHERE  ts >= DATEADD(hour, -1, CURRENT_TIMESTAMP())
)
SELECT  asset_id, ts,
        SNOWFLAKE.CORTEX.ANOMALY_DETECTION(
          INPUT_DATA   => ARRAY_AGG(value),
          MODEL        => 'isolation_forest_seasonal',
          SENSITIVITY  => 0.97
        )                                                  AS score
  FROM  win
 GROUP BY asset_id, ts
HAVING score > 0.7
 ORDER BY score DESC LIMIT 50;`

  const mock622 = {
    asset_now:    'PUMP-401',
    score_now:    aScore,
    vib_mm_s:     vibNow,
    hx205_score:  0.68,
    pump402_score: 0.31,
    tags_monitored: 3142,
    fp_rate:      0.024,
    model:        'isolation_forest_seasonal',
  }

  /* SQL · §6.2.3 surrogate twin with the slider value substituted */
  const sql623 = `-- Snowpark surrogate digital twin · cascade derate through asset graph
WITH g AS (
  SELECT  child FROM cognite.gold.asset_graph WHERE parent='PUMP-401'
)
SELECT  refinery_ai.surrogate_twin(
          asset_id      => 'PUMP-401',
          derate_pct    => ${derate},
          asset_graph   => (SELECT ARRAY_AGG(child) FROM g),
          horizon_h     => 24
        )                                                  AS what_if;
-- returns: throughput_kbbl_d, contribution_margin_delta_usd_d,
--          mtbf_delta_days, downstream_units_affected[]`
  const mock623 = {
    derate_pct: derate,
    cdu_throughput_kbbl_d: Math.round(throughputNew),
    contribution_margin_delta_usd_d: marginDelta,
    mtbf_delta_days: Math.round(mtbfDelta),
    downstream_units: ['CDU-100', 'UNIT-FCC-01'],
    solve_time_s: 1.4,
    cortex_conf: 0.88,
  }

  /* SQL · §6.2.3b feature store */
  const sql623b = `-- Silver feature pipeline — one definition, three model consumers
CREATE OR REPLACE DYNAMIC TABLE silver.pump_features
  TARGET_LAG = '1 minute' WAREHOUSE = REFINERY_AI_M AS
SELECT  asset_id, ts,
        AVG(value)      OVER w60  AS vibration_rms_60s,
        KURTOSIS(value) OVER w300 AS vibration_kurt_300s,
        MAX(value)      OVER w60  AS bearing_temp_delta,
        ... -- 9 features total (see SRD §6.2.1 inventory)
        refinery_ai.hotelling_t2(ARRAY_AGG(value) WITHIN GROUP (ORDER BY ts) OVER w300) AS t2
  FROM  cognite.silver.timeseries_1m
  WHERE asset_id LIKE 'PUMP-%'
  WINDOW w60  AS (PARTITION BY asset_id ORDER BY ts ROWS BETWEEN 59  PRECEDING AND CURRENT ROW),
         w300 AS (PARTITION BY asset_id ORDER BY ts ROWS BETWEEN 299 PRECEDING AND CURRENT ROW);`
  const mock623b = {
    asset_id: 'PUMP-401',
    vibration_rms_60s: 4.81,
    vibration_kurt_300s: 3.92,
    bearing_temp_delta_c: 11.4,
    suction_pressure_bar: 0.41,
    discharge_pressure_bar: 8.18,
    power_kw: 612,
    lube_oil_index: 0.71,
    hours_since_seal: 1422,
    hotelling_t2: 14.2,
    consumed_by: ['failure_prob_48h', 'anomaly_score', 'derate_what_if'],
  }

  return (
    <>
      <div className="flex items-end justify-between mt-2">
        <div className="tag text-snow">SUB-TOOLKIT DECK · §6.2.2 → §6.2.3</div>
        <div className="tag text-ink-muted">PUMP-401 · UNIT-CD-01 · live</div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <SubToolkit
          id="§6.2.2"
          title="Anomaly Detection · Cortex"
          badge="CORTEX.ANOMALY"
          badgeTone="cyan"
          tagline="Snowflake's built-in Isolation-Forest variant with seasonality awareness, augmented with operator-labeled feedback. Anomaly score surfaces every 5 sec across 3,000+ Cognite tags."
          formula={
            <>
              <Tex display tex={String.raw`s(\mathbf{x}) = 2^{-\dfrac{E[h(\mathbf{x})]}{c(n)}}`} className="text-ink" />
              <div className="tag">h(x) path length in isolation tree · c(n) avg path length · alert if s &gt; 0.7</div>
            </>
          }
          readout={
            <div className="py-1">
              <DataRow label="PUMP-401 · live vib" value={`${vibNow.toFixed(2)} mm/s`} tone="amber" />
              <DataRow label="anomaly score" value={aScore.toFixed(2)} tone={aScore > 0.7 ? 'alarm' : aScore > 0.55 ? 'amber' : 'signal'} />
              <DataRow label="HX-205 score" value="0.68" tone="amber" />
              <DataRow label="PUMP-402 score" value="0.31" tone="signal" />
              <DataRow label="tags monitored" value="3,142" tone="cyan" />
              <DataRow label="model" value="isolation_forest_seasonal" tone="snow" />
              <DataRow label="false-positive rate" value="2.4 %" tone="signal" />
            </div>
          }
          sql={sql622}
          mock={mock622}
          rows={47}
          footer={`[push] writeback → COGNITE.PUMP-401.SCORE = ${aScore.toFixed(2)} ✓   ·   ROI band $1–2M / yr`}
        />

        <SubToolkit
          id="§6.2.3"
          title="Digital Twin · What-If"
          badge="SNOWPARK · SURROGATE"
          badgeTone="copper"
          tagline="Surrogate model trained on the first-principles simulator + Cognite asset graph. Slide PUMP-401 derate to see cascading impact on Crude Unit 1 throughput, FCC feed, and contribution margin in under 2 s."
          sql={sql623}
          mock={mock623}
          rows={1}
          minMs={900}
          maxMs={1700}
        >
          <div className="flex flex-col gap-2 font-mono text-[11px]">
            <div className="flex items-center justify-between">
              <span className="text-ink-muted">PUMP-401 derate</span>
              <span className="text-cyan tabular-nums">{derate}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={20}
              value={derate}
              onChange={(e) => setDerate(parseInt(e.target.value, 10))}
              className="w-full accent-cyan-500"
              aria-label="derate percent"
            />
            <div className="grid grid-cols-3 gap-1 text-[10px] text-ink-muted">
              <span>0%</span>
              <span className="text-center">10%</span>
              <span className="text-right">20%</span>
            </div>
          </div>
          <div className="py-1 mt-1">
            <DataRow label="CDU throughput" value={`${throughputNew.toFixed(0)} kbbl/d`} tone="amber" />
            <DataRow label="Δ vs nominal" value={`${(throughputNew - throughputBase).toFixed(0)} kbbl/d`} tone={derate > 0 ? 'amber' : 'signal'} />
            <DataRow label="Δ contribution margin" value={formatUSD(marginDelta) + ' / day'} tone={marginDelta < 0 ? 'alarm' : 'signal'} />
            <DataRow label="Δ MTBF (Weibull)" value={`+${mtbfDelta.toFixed(0)} days`} tone="signal" />
            <DataRow label="solve time" value="1.4 s" tone="snow" />
          </div>
        </SubToolkit>

        <SubToolkit
          id="§6.2.3b"
          title="Feature Store · PUMP-401"
          badge="ML FEATURE STORE"
          badgeTone="snow"
          tagline="The same feature pipeline serves §6.2.1 / 6.2.2 / 6.2.3 — one Silver dynamic table, three downstream consumers, governed by Horizon Catalog."
          readout={
            <div className="py-1">
              <DataRow label="vibration_rms_60s" value="4.81 mm/s" tone="amber" />
              <DataRow label="vibration_kurt_300s" value="3.92" tone="amber" />
              <DataRow label="bearing_temp_delta" value="+11.4 °C" tone="amber" />
              <DataRow label="suction_pressure" value="0.41 bar" tone="snow" />
              <DataRow label="discharge_pressure" value="8.18 bar" tone="snow" />
              <DataRow label="power_kw" value="612 kW · 102% rated" tone="amber" />
              <DataRow label="lube_oil_index" value="0.71" tone="amber" />
              <DataRow label="hours_since_seal" value="1,422 h" tone="cyan" />
              <DataRow label="hotelling_t2" value="14.2" tone="alarm" />
            </div>
          }
          sql={sql623b}
          mock={mock623b}
          rows={9}
          cortex={false}
          minMs={300}
          maxMs={900}
          footer="serves: failure_prob_48h · anomaly_score · derate_what_if   ·   reused × 3"
        />
      </div>
    </>
  )
}

