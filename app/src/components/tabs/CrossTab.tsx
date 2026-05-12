import { useState } from 'react'
import { Panel, PanelHeader, Kpi, DataRow } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { SubToolkit } from '@/components/ui/SubToolkit'
import { FlowCanvas } from '@/components/FlowCanvas'
import { FlowInspector } from '@/components/FlowInspector'
import { QueryPanel } from '@/components/QueryPanel'
import { AuditGraph } from '@/components/three/AuditGraph'
import { Tex } from '@/lib/katex'
import { pct } from '@/lib/utils'
import { decorateNodes, decorateEdges } from '@/lib/flowDetails'
import type { Node, Edge } from '@xyflow/react'

// ---------- React Flow graph: operator NL → Cortex Analyst → Snowflake+Horizon → answer + audit
const nodes: Node[] = [
  {
    id: 'op',
    type: 'schematic',
    position: { x: 0, y: 90 },
    data: {
      code: 'OPERATOR',
      label: 'Natural-language ask',
      kind: 'source',
      status: 'ok',
      meta: '"yields last 24h?"',
    },
  },
  {
    id: 'cortex',
    type: 'schematic',
    position: { x: 260, y: 90 },
    data: { code: 'CORTEX · ANALYST', label: 'Cortex Analyst', kind: 'ai', status: 'ai', meta: 'NL→SQL · semantic' },
  },
  {
    id: 'gov',
    type: 'schematic',
    position: { x: 520, y: 20 },
    data: { code: 'SNOW · GOV', label: 'Snowflake + Horizon', kind: 'process', status: 'ok', meta: 'RBAC · masking' },
  },
  {
    id: 'horizon',
    type: 'schematic',
    position: { x: 780, y: 20 },
    data: { code: 'HORIZON', label: 'Lineage Catalog', kind: 'process', status: 'ok', meta: '13k columns' },
  },
  {
    id: 'answer',
    type: 'schematic',
    position: { x: 780, y: 140 },
    data: { code: 'OUT · ANSWER', label: 'Answer + Citation', kind: 'output', status: 'ok', meta: '<1.5s · row-level' },
  },
  {
    id: 'audit',
    type: 'schematic',
    position: { x: 520, y: 200 },
    data: {
      code: 'AUDIT · REPLAY',
      label: 'Audit Replay Log',
      kind: 'sink',
      status: 'ok',
      meta: 'immutable · 7y retention',
    },
  },
]

const edges: Edge[] = [
  { id: 'e1', source: 'op', target: 'cortex', animated: true },
  { id: 'e2', source: 'cortex', target: 'gov', animated: true },
  { id: 'e3', source: 'gov', target: 'horizon', animated: true },
  { id: 'e4', source: 'gov', target: 'answer', animated: true },
  { id: 'e5', source: 'cortex', target: 'audit', animated: true },
]

// ---------- Cortex Analyst transcript mock
const cortexMock = {
  user_query: 'Show me crude yield variance vs LP target for the last 24 hours by unit',
  generated_sql:
    'SELECT unit, AVG(yield_actual - yield_target) AS variance_pct FROM cognite.gold.cdu_yields_15m WHERE ts > DATEADD(hour, -24, CURRENT_TIMESTAMP()) GROUP BY 1 ORDER BY 2 DESC',
  rows_returned: 4,
  top_unit: 'CDU-100',
  variance_pct: 0.018,
  lineage_columns_touched: 12,
  latency_ms: 1280,
  audit_event_id: 'AE-2026-05-12-9874',
}

const sql = `-- Cortex Analyst: natural-language → governed SQL on the semantic layer.
-- Operator typed:  "Show me crude yield variance vs LP target for the last 24h by unit"
SELECT  SNOWFLAKE.CORTEX.ANALYST(
          QUESTION     => 'Show me crude yield variance vs LP target for the last 24 hours by unit',
          SEMANTIC_MODEL => 'REFINERY_AI.SEMANTIC.OPS_V3',
          ROW_LEVEL_POLICY => 'plant_ops',
          CITATIONS    => TRUE
        ) AS response;
-- Generated under the hood (lineage tracked in Horizon):
SELECT  unit,
        AVG(yield_actual - yield_target) AS variance_pct
FROM    cognite.gold.cdu_yields_15m
WHERE   ts > DATEADD(hour, -24, CURRENT_TIMESTAMP())
GROUP BY 1
ORDER BY 2 DESC;`

function fmt(m: unknown) {
  const x = m as typeof cortexMock
  return [
    `// Snowflake · REFINERY_AI_XL · Cortex Analyst (NL→SQL)`,
    `// Semantic model: REFINERY_AI.SEMANTIC.OPS_V3   ·   policy: row-level / plant_ops`,
    ``,
    `[nl_question]`,
    `  > ${x.user_query}`,
    ``,
    `[generated_sql]`,
    ...x.generated_sql.match(/.{1,86}(\s|$)/g)!.map(s => `  ${s.trim()}`),
    ``,
    `[result_summary]`,
    `  rows_returned .............. ${x.rows_returned}`,
    `  top_unit ................... ${x.top_unit}`,
    `  variance ................... ${pct(x.variance_pct)} (vs LP target)`,
    `  lineage_columns_touched .... ${x.lineage_columns_touched}`,
    `  latency .................... ${x.latency_ms} ms`,
    ``,
    `[audit] HORIZON event logged · ${x.audit_event_id}`,
  ].join('\n')
}

const recentNl: string[] = [
  '> what is current margin vs LP plan?',
  '> show me anomalies on PUMP-401 today',
  '> which contracts roll off next quarter and what is total TCV at risk?',
  '> compare Scope 1 emissions this week to last week',
  '> rank tankers by demurrage risk over the next 48 hours',
]

const auditEvents = [
  { ts: '17:54:02', user: 'J.WHEELER', action: 'cortex_analyst.query',   status: 'OK' },
  { ts: '17:53:41', user: 'S.ORTIZ',   action: 'snowflake.copy_into',    status: 'OK' },
  { ts: '17:51:18', user: 'system',    action: 'zero_copy.share_refresh', status: 'OK' },
  { ts: '17:48:09', user: 'J.WHEELER', action: 'cortex.predict',         status: 'OK' },
]

export function CrossTab() {
  return (
    <div className="px-6 pb-8 space-y-4 animate-reveal-up">
      {/* 1. Section header */}
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <div className="tag">TOOLKIT · §6.7 CROSS-CUTTING · WORKFORCE + AUDIT + COPILOT</div>
          <h1 className="font-display text-2xl font-bold tracking-tight mt-1">
            Cortex Analyst (NL→SQL) · Horizon Catalog lineage · audit replay
          </h1>
          <div className="tag mt-1 text-ink-muted">
            §6.7.1 Cortex Analyst (above) · §6.7.2 Audit &amp; Compliance (above) · §6.7.3 Operator Copilot · Cortex Agents (below)
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Badge tone="cyan">Cortex Analyst</Badge>
          <Badge tone="amber">Horizon Catalog</Badge>
          <Badge tone="copper">Platform</Badge>
        </div>
      </div>

      {/* 2. KPI strip */}
      <div className="grid grid-cols-4 gap-3">
        <Kpi label="SELF-SERVE QUERIES (WEEK)" value="428" tone="snow" delta="+62%" />
        <Kpi label="AVG TIME-TO-INSIGHT" value="44" unit="sec" tone="signal" />
        <Kpi label="CATALOG COVERAGE" value="97" unit="%" tone="cyan" />
        <Kpi label="AUDIT REPLAY (EVENTS)" value="1.2M" tone="amber" />
      </div>

      {/* 3. Flow + Inspector */}
      <div className="grid grid-cols-[1fr_360px] gap-4">
        <Panel>
          <PanelHeader label="DATA FLOW · NL → CORTEX ANALYST → GOVERNED ANSWER + AUDIT" hint="click nodes/edges to inspect">
            <Badge tone="cyan">animated · draggable</Badge>
          </PanelHeader>
          <div className="p-2">
            <FlowCanvas
              flowKey="cross"
              nodes={decorateNodes('cross', nodes)}
              edges={decorateEdges('cross', edges)}
              height={300}
            />
          </div>
        </Panel>
        <FlowInspector />
      </div>

      <Panel>
        <PanelHeader label="LINEAGE + RBAC ENTROPY" hint="KaTeX" />
        <div className="p-4 space-y-3 grid grid-cols-[auto_1fr] gap-x-6 items-center">
          <Tex
            display
            tex={String.raw`\text{Coverage} = \dfrac{|C_{\text{catalogued}}|}{|C_{\text{total}}|}`}
            className="text-ink"
          />
          <div className="tag text-ink-muted">access entropy across RBAC</div>
          <Tex
            display
            tex={String.raw`H = -\sum_{i} p_i \log p_i`}
            className="text-ink-dim"
          />
          <div className="tag">
            C = columns indexed by Horizon · H = access entropy across RBAC roles
          </div>
        </div>
      </Panel>

      {/* 4. 3D scene + Query */}
      <div className="grid grid-cols-2 gap-4">
        <Panel>
          <PanelHeader label="HORIZON LINEAGE GRAPH · DATASET ↔ COLUMN" hint="click nodes / connectors to inspect">
            <Badge tone="cyan">interactive</Badge>
            <Badge tone="copper">3D twin</Badge>
          </PanelHeader>
          <div className="h-[420px] relative">
            <AuditGraph />
            <div className="absolute top-3 left-3 panel-elev px-3 py-2">
              <div className="tag">ORBIT · PAN · ZOOM · CLICK</div>
            </div>
            <div className="absolute top-3 right-3 panel-elev px-3 py-2">
              <div className="tag">13,402 COLUMNS · 247 DATASETS · 9 SYSTEMS</div>
            </div>
          </div>
        </Panel>

        <QueryPanel
          title="CORTEX ANALYST · NL→SQL TRANSCRIPT"
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
          <PanelHeader label="RECENT NL QUERIES" hint="cortex_analyst · last 60s">
            <Badge tone="cyan">live</Badge>
          </PanelHeader>
          <ul className="p-3 space-y-1.5 font-mono text-[11px] text-cyan/90">
            {recentNl.map((q, i) => (
              <li key={i} className="border-b border-edge-subtle/60 pb-1.5 last:border-b-0">
                {q}
              </li>
            ))}
          </ul>
        </Panel>

        <Panel>
          <PanelHeader label="GOVERNANCE POSTURE" hint="horizon · iam · byok">
            <Badge tone="signal">healthy</Badge>
          </PanelHeader>
          <div className="py-1">
            <DataRow label="RBAC roles"          value="27"                tone="cyan" />
            <DataRow label="Masking policies"    value="14"                tone="cyan" />
            <DataRow label="Row-access policies" value="8"                 tone="cyan" />
            <DataRow label="BYOK regions"        value="us-east-2, us-west-2" tone="snow" />
            <DataRow label="Federated IdP"       value="Okta · SCIM"       tone="snow" />
            <DataRow label="Tag-based discovery" value="enabled"           tone="signal" />
          </div>
        </Panel>

        <Panel>
          <PanelHeader label="AUDIT REPLAY" hint="immutable · 7y retention">
            <Badge tone="amber">stream</Badge>
          </PanelHeader>
          <ul className="p-3 space-y-1 font-mono text-[11px]">
            {auditEvents.map((e, i) => (
              <li key={i} className="flex items-center gap-2 border-b border-edge-subtle/60 last:border-b-0 py-1">
                <span className="text-ink-muted">{e.ts}</span>
                <span className="text-cyan">{e.user}</span>
                <span className="text-ink-dim">·</span>
                <span className="text-ink">{e.action}</span>
                <span className="text-signal ml-auto">{e.status}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      {/* ─── §6.7.3 Operator Copilot · Cortex Agents ────────────────── */}
      <div className="flex items-end justify-between mt-2">
        <div className="tag text-snow">SUB-TOOLKIT · §6.7.3 OPERATOR COPILOT</div>
        <div className="tag text-ink-muted">cortex agents · multi-step</div>
      </div>

      <div className="grid grid-cols-[1.2fr_1fr] gap-4">
        <OperatorCopilot />
        <SubToolkit
          id="§6.7.3"
          title="Cortex Agents · Multi-Step"
          badge="CORTEX.AGENTS"
          badgeTone="cyan"
          tagline="Type 'Diagnose PUMP-401' — the agent orchestrates four tools in under four seconds: Cortex Search over historical events, Cortex Analyst for current state, Snowpark Weibull, and templated work-order generation."
          formula={
            <div className="font-mono text-[10px] leading-relaxed text-ink-dim space-y-0.5">
              <div><span className="text-cyan">1.</span> CORTEX.SEARCH(history · "PUMP-401 bearing")</div>
              <div><span className="text-cyan">2.</span> CORTEX.ANALYST(current state · semantic model)</div>
              <div><span className="text-cyan">3.</span> SNOWPARK.pump_failure_prob(48h)</div>
              <div><span className="text-cyan">4.</span> CORTEX.COMPLETE(work-order draft · CON-789 ctx)</div>
            </div>
          }
          readout={
            <div className="py-1">
              <DataRow label="avg steps / run"   value="4.2"                  tone="snow" />
              <DataRow label="avg latency"       value="3.9 s"                tone="signal" />
              <DataRow label="acceptance rate"   value="86 %"                 tone="signal" />
              <DataRow label="runs / mo"         value="~200"                 tone="cyan" />
              <DataRow label="analyst hrs saved" value="~3 / run · ~600 / mo" tone="signal" />
              <DataRow label="confidence floor"  value="0.80 (else escalate)" tone="amber" />
            </div>
          }
          sql={SQL_673}
          mock={MOCK_673}
          rows={12}
          minMs={1200}
          maxMs={3200}
          footer="folded ROI: $0.5–1M / yr (within §6.7.1 envelope)"
        />
      </div>
    </div>
  )
}

/* ─── §6.7.3 inline copilot scaffolding ────────────────────────────── */

interface AgentStep {
  tool: string
  input: string
  output: string
  status: 'ok' | 'running'
}

const SCRIPT: Record<string, { steps: AgentStep[]; summary: string }> = {
  'diagnose PUMP-401': {
    steps: [
      { tool: 'CORTEX.SEARCH',  input: 'PUMP-401 bearing seal events · 2023-2025',  output: '3 similar events found · 2024-08-14, 2024-11-22, 2025-03-04 · all preceded by vib > 4.5 mm/s for ≥ 48h', status: 'ok' },
      { tool: 'CORTEX.ANALYST', input: 'current PUMP-401 features',                  output: 'T² = 14.2 · vib_rms_60s = 4.81 · bearing_temp_Δ = +11.4°C · hours_since_seal = 1,422', status: 'ok' },
      { tool: 'SNOWPARK',       input: 'pump_failure_prob(PUMP-401, horizon=48h)',   output: 'P(fail|T²) = 0.42 · η=2,140h · β=2.1 · Weibull conditional', status: 'ok' },
      { tool: 'CORTEX.COMPLETE', input: 'draft work-order · honor CON-789 minimum',  output: 'WO-31742 · "Inspect mechanical seal, derate to 92% until OUTAGE-WK22, CON-789 minimum protected via sweet-crude shift +15 kbbl"', status: 'ok' },
    ],
    summary: 'P(fail 48h) = 0.42 · WO-31742 drafted · CON-789 protected · est. avoided loss $1.24M',
  },
  'what is current margin vs LP plan?': {
    steps: [
      { tool: 'CORTEX.ANALYST', input: 'margin actual vs LP target last 24h', output: 'avg $8.42/bbl actual · $8.18/bbl LP target · +$0.24/bbl uplift', status: 'ok' },
      { tool: 'SNOWPARK',       input: 'attribution by unit',                  output: 'CDU-100 +$0.18 · FCC +$0.04 · diesel hydro +$0.02', status: 'ok' },
    ],
    summary: '+$0.24/bbl vs LP · primary contributor CDU-100 sweet-crude shift',
  },
  'rank tankers by demurrage risk over the next 48 hours': {
    steps: [
      { tool: 'CORTEX.ANALYST', input: 'tanker ETA + berth schedule',           output: '11 tankers · 3 collide with maintenance window', status: 'ok' },
      { tool: 'SNOWPARK',       input: 'vrp.demurrage_score(48h)',              output: 'top risk: HARRIS-37 ($48K) · COLE-12 ($31K) · MARTIN-04 ($22K)', status: 'ok' },
      { tool: 'CORTEX.COMPLETE', input: 'draft re-routing recommendation',      output: 'Re-route HARRIS-37 to Berth 2, swap with COLE-12 window', status: 'ok' },
    ],
    summary: 'Top-3 demurrage risk identified · $101K avoidable · re-routing draft ready',
  },
}

function OperatorCopilot() {
  const [query, setQuery] = useState('diagnose PUMP-401')
  const [run, setRun] = useState<{ steps: AgentStep[]; summary: string } | null>(null)
  const [running, setRunning] = useState(false)

  async function trigger() {
    setRunning(true)
    setRun(null)
    const key = query.toLowerCase().trim()
    const script = SCRIPT[key] ?? SCRIPT['diagnose PUMP-401']
    const built: AgentStep[] = []
    for (const s of script.steps) {
      await new Promise(r => setTimeout(r, 650))
      built.push(s)
      setRun({ steps: [...built], summary: '' })
    }
    setRun({ steps: built, summary: script.summary })
    setRunning(false)
  }

  return (
    <Panel className="flex flex-col">
      <PanelHeader label="§6.7.3 · CORTEX AGENT · OPERATOR COPILOT" hint="multi-step">
        <Badge tone="cyan">CORTEX.AGENTS</Badge>
        <Badge tone={running ? 'amber' : 'snow'}>{running ? 'RUNNING…' : 'IDLE'}</Badge>
      </PanelHeader>

      <div className="p-4 flex flex-col gap-3">
        <div className="flex gap-2 items-center">
          <span className="text-cyan font-mono text-sm">{'>'}</span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={running}
            className="flex-1 bg-bg-base/80 border border-edge-subtle px-3 py-1.5 text-[12px] font-mono text-ink placeholder:text-ink-muted focus:outline-none focus:border-cyan"
            placeholder="ask the copilot…"
            list="copilot-suggestions"
          />
          <datalist id="copilot-suggestions">
            <option value="diagnose PUMP-401" />
            <option value="what is current margin vs LP plan?" />
            <option value="rank tankers by demurrage risk over the next 48 hours" />
          </datalist>
          <button
            onClick={trigger}
            disabled={running}
            className="px-3 py-1.5 text-[11px] font-mono uppercase tracking-wider border border-cyan/40 bg-cyan/10 text-cyan hover:bg-cyan/20 disabled:opacity-50"
          >
            {running ? '…' : 'RUN'}
          </button>
        </div>

        <div className="bg-bg-base/90 border border-edge-subtle p-3 min-h-[260px] font-mono text-[11px] space-y-2">
          {!run && !running && (
            <div className="text-ink-muted">
              {'// Cortex Agent ready · model=cortex.agents.refinery_v1'}
              <br />
              {'// type a question above or pick a suggestion · press RUN'}
            </div>
          )}
          {run?.steps.map((step, i) => (
            <div key={i} className="border-l-2 border-cyan/60 pl-3">
              <div className="flex items-center gap-2 text-[10px]">
                <span className="text-amber">step {i + 1}</span>
                <span className="text-cyan">{step.tool}</span>
                <span className="text-signal ml-auto">{step.status === 'ok' ? '✓' : '…'}</span>
              </div>
              <div className="text-ink-muted text-[10.5px]">input: <span className="text-ink-dim">{step.input}</span></div>
              <div className="text-ink text-[10.5px]">→ {step.output}</div>
            </div>
          ))}
          {running && (
            <div className="flex items-center gap-2 text-amber text-[10px] animate-pulse">
              <span className="led led-amber" />
              <span>orchestrating next tool…</span>
            </div>
          )}
          {run?.summary && (
            <div className="border-t border-edge-subtle/60 pt-2 mt-2">
              <div className="text-[10px] text-ink-muted">SUMMARY</div>
              <div className="text-signal text-[11px]">{run.summary}</div>
            </div>
          )}
        </div>
      </div>
    </Panel>
  )
}

/* ─── §6.7.3 · Cortex Agent backend SQL + mock ────────────────────── */
const SQL_673 = `-- Cortex Agent · multi-step orchestration for 'Diagnose PUMP-401'
CALL SNOWFLAKE.CORTEX.AGENT_RUN(
  AGENT_NAME   => 'refinery_ops_copilot_v1',
  USER_INPUT   => :user_input,
  TOOLS        => ARRAY_CONSTRUCT(
                    'cortex.search.history',
                    'cortex.analyst.semantic_ops_v3',
                    'snowpark.pump_failure_prob',
                    'cortex.complete.work_order_draft'
                  ),
  MAX_STEPS    => 6,
  CONFIDENCE_FLOOR => 0.80,
  CITATIONS    => TRUE,
  LINEAGE      => TRUE
);
-- → returns each step's tool, input, output, confidence + final summary
-- → Horizon Catalog stamps a lineage hash per run for audit replay`
const MOCK_673 = {
  agent: 'refinery_ops_copilot_v1',
  example_user_input: 'Diagnose PUMP-401',
  steps_typical: 4.2,
  steps_max: 6,
  avg_latency_s: 3.9,
  acceptance_rate: 0.86,
  runs_per_month: 200,
  analyst_hours_saved_per_run: 3,
  confidence_floor: 0.80,
  tool_registry: [
    'cortex.search.history',
    'cortex.analyst.semantic_ops_v3',
    'snowpark.pump_failure_prob',
    'cortex.complete.work_order_draft',
  ],
  lineage_hash_example: 'hzn_d11b3c8f9e2a7b4',
}
