/**
 * flowDetails.ts
 *
 * Centralized inspector payloads for every node + edge across every tab's
 * React Flow diagram. Tabs reference this map by `flowKey` so the diagram
 * declarations stay lean.
 *
 * Keep this file purely declarative — no React, no runtime side-effects.
 */

import type { NodeInspectorDetails, EdgeInspectorDetails } from '@/store/inspectorStore'

type NodeMap = Record<string, NodeInspectorDetails>
type EdgeMap = Record<string, EdgeInspectorDetails>

interface FlowDetailBundle {
  nodes: NodeMap
  edges: EdgeMap
}

export const FLOW_DETAILS: Record<string, FlowDetailBundle> = {
  /* ───────────────────────── MARGIN TAB ───────────────────────── */
  margin: {
    nodes: {
      wti: {
        subsystem: 'CRUDE SOURCE · SWEET',
        summary: 'Cushing hub WTI delivery. 128 kbbl available for the next blend window.',
        toolkit: '§6.1.1',
        kpis: [
          { label: 'kbbl avail',   value: '128',   tone: 'cyan' },
          { label: 'API gravity',  value: '38.4',  tone: 'snow' },
          { label: 'sulfur',       value: '0.24 %', tone: 'signal' },
          { label: 'price · $/bbl', value: '$74.30', tone: 'amber' },
        ],
        columns: [
          { name: 'lot_id',        type: 'string',  example: 'LOT-CRD-20260512-WTI-A' },
          { name: 'grade',         type: 'string',  example: 'WTI_SWEET' },
          { name: 'kbbl',          type: 'numeric', example: '128' },
          { name: 'api_gravity',   type: 'numeric', example: '38.4' },
          { name: 'sulfur_pct',    type: 'numeric', example: '0.24' },
          { name: 'price_usd_bbl', type: 'numeric', example: '74.30' },
        ],
        lineage: {
          source: 'pipeline.cushing.feeds_hourly',
          target: 'cognite.gold.crude_lots_v',
          refresh: '15 m',
          hash: 'hzn_lot_wti_2026_05_12',
        },
        analysis:
          'Sweet WTI is the preferred LP input when crack spreads favor gasoline and CON-789 sweet-crude minimum is below pace.',
      },
      maya: {
        subsystem: 'CRUDE SOURCE · SOUR',
        summary: 'Maya heavy sour from Cantarell. 92 kbbl in tankage TK-501. API 22, sulfur 3.4%.',
        toolkit: '§6.1.1',
        kpis: [
          { label: 'kbbl avail',    value: '92',     tone: 'cyan' },
          { label: 'API gravity',   value: '22.1',   tone: 'snow' },
          { label: 'sulfur',        value: '3.4 %',  tone: 'amber' },
          { label: 'price · $/bbl', value: '$68.10', tone: 'amber' },
        ],
        columns: [
          { name: 'lot_id',        type: 'string',  example: 'LOT-CRD-20260512-MAYA-B' },
          { name: 'grade',         type: 'string',  example: 'MAYA_SOUR' },
          { name: 'kbbl',          type: 'numeric', example: '92' },
          { name: 'api_gravity',   type: 'numeric', example: '22.1' },
          { name: 'sulfur_pct',    type: 'numeric', example: '3.40' },
        ],
        lineage: {
          source: 'tk-501.level_gauge + lab_assays',
          target: 'cognite.gold.crude_lots_v',
          refresh: '5 m',
        },
        analysis:
          'Heavy sour requires hydrotreater capacity — blend share capped by spec on resid sulfur and coker feed quality.',
      },
      tk: {
        subsystem: 'TANK FARM',
        summary: 'Crude charge tank TK-501 holding 18.2 m / 24 m. Mixing volume for next CDU run.',
        streamKey: 'TK-501:level',
        streamUnit: 'm',
        streamWarn: 21,
        streamThreshold: 23,
        toolkit: '§6.1.1',
        kpis: [
          { label: 'level · m',  value: '18.2 / 24', tone: 'cyan' },
          { label: 'utilization', value: '76 %',    tone: 'snow' },
        ],
        lineage: {
          source: 'cognite.silver.tank_telemetry_1m',
          target: 'cognite.gold.tank_state_v',
          refresh: 'stream',
        },
        analysis: 'Tank level is the binding capacity constraint when sweet lots arrive faster than CDU pull.',
      },
      cdu: {
        subsystem: 'PROCESS UNIT · CDU',
        summary: 'Crude distillation unit CDU-100 running at 358 °C / 1.2 bar. Throughput 220 kbbl/d.',
        streamKey: 'CDU-100:temperature',
        streamUnit: '°C',
        streamWarn: 365,
        streamThreshold: 372,
        toolkit: '§6.1.1',
        kpis: [
          { label: 'temperature',  value: '358 °C',     tone: 'cyan' },
          { label: 'pressure',     value: '1.2 bar',    tone: 'snow' },
          { label: 'throughput',   value: '220 kbbl/d', tone: 'signal' },
          { label: 'yield · gaso', value: '51.2 %',     tone: 'signal' },
        ],
        lineage: {
          source: 'cognite.silver.cdu_yields_15m',
          target: 'cognite.gold.cdu_yields_15m',
          refresh: '15 m',
        },
      },
      snow: {
        subsystem: 'CORTEX · SNOWPARK SOLVER',
        summary: 'PuLP/CBC LP solver running on Snowpark Container Services. Re-fires every 15 minutes.',
        toolkit: '§6.1.1',
        cortex: { model: 'refinery_ai.solve_blend_lp', confidence: 0.91, tokens: 1812, latency_ms: 1416 },
        kpis: [
          { label: 'cadence',     value: '15 m',  tone: 'cyan' },
          { label: 'variables',   value: '184',   tone: 'snow' },
          { label: 'constraints', value: '37',    tone: 'snow' },
          { label: 'solve time',  value: '11.4 s', tone: 'signal' },
        ],
        lineage: {
          source: 'cognite.gold.crude_lots_v + cdu_yields_15m + product_prices',
          target: 'snow.recommendations.blend_plan',
          refresh: '15 m',
          hash: 'hzn_lp_blend_2026_05_12_1758',
        },
        analysis: 'Linear program maximizes contribution margin subject to sulfur, API, contract minimums and unit capacity. Output is a ranked blend plan for the next operating window.',
      },
      out: {
        subsystem: 'RECOMMENDATION · OUTPUT',
        summary: 'Optimal blend spec, pushed back to Cognite as a recommended operating point.',
        toolkit: '§6.1.1',
        kpis: [
          { label: 'recommendation', value: 'BLEND-A',  tone: 'signal' },
          { label: 'margin · $/bbl', value: '+$0.18',   tone: 'signal' },
          { label: 'margin · /day',  value: '+$312k',   tone: 'signal' },
          { label: 'annualized',     value: '+$11.4M',  tone: 'snow' },
        ],
        writeback: 'COGNITE.OPTIM_BLEND (zero-copy) + SAP.PLAN_BLEND_A',
      },
    },
    edges: {
      e1: { subsystem: 'CRUDE FEED', contract: 'WTI sweet crude → Tank Farm', format: 'gauge + lab assay', latency: '5 m', throughput: '128 kbbl / window',
            analysis: 'Pipeline-fed sweet crude with hourly density + S% assays merged into the lot record.' },
      e2: { subsystem: 'CRUDE FEED', contract: 'Maya sour crude → Tank Farm', format: 'gauge + lab assay', latency: '5 m', throughput: '92 kbbl / window' },
      e3: { subsystem: 'PROCESS FEED', contract: 'Tank Farm → CDU-100', format: 'real-time meter', latency: 'stream', throughput: '220 kbbl/d',
            analysis: 'Charge pumps move crude from TK-501 to CDU-100 at controlled API blend.' },
      e4: { subsystem: 'TELEMETRY → MODEL', contract: 'CDU yields → LP solver', format: 'silver dynamic table', latency: '15 m', throughput: '4 cuts',
            analysis: 'Yield estimates feed the LP at each 15-minute boundary.' },
      e5: { subsystem: 'RECOMMENDATION', contract: 'LP solver → Operator UI + Cognite writeback', format: 'governed share', latency: '< 30 s', throughput: '1 plan / cycle' },
    },
  },

  /* ───────────────────── MAINTENANCE TAB ──────────────────────── */
  maintenance: {
    nodes: {
      pump: {
        subsystem: 'ROTATING EQUIPMENT · PUMP',
        summary: 'Centrifugal charge pump PUMP-401. Live multivariate sensor stream.',
        streamKey: 'PUMP-401:vibration',
        streamUnit: 'mm/s',
        streamWarn: 5,
        streamThreshold: 6,
        toolkit: '§6.2.1',
        kpis: [
          { label: 'vibration',      value: '4.81 mm/s', tone: 'amber' },
          { label: 'bearing Δ',      value: '+11.4 °C',  tone: 'amber' },
          { label: 'power · % rated', value: '102 %',     tone: 'amber' },
          { label: 'criticality',     value: 'A',         tone: 'alarm' },
        ],
        columns: [
          { name: 'asset_id',       type: 'string',    example: 'PUMP-401' },
          { name: 'ts',             type: 'timestamp', example: '2026-05-12T17:55:00Z' },
          { name: 'vibration',      type: 'numeric',   example: '4.81' },
          { name: 'bearing_temp',   type: 'numeric',   example: '78.4' },
          { name: 'discharge_p',    type: 'numeric',   example: '8.18' },
          { name: 'suction_p',      type: 'numeric',   example: '0.41' },
        ],
        lineage: {
          source: 'cognite.silver.timeseries_1m',
          target: 'silver.pump_features',
          refresh: 'stream',
          hash: 'hzn_pump_401_features',
        },
        writeback: 'COGNITE.PUMP_401.STATE = "BEARING_RISK"',
        analysis: 'Vibration kurtosis and bearing-temperature delta have trended together for 36 hours — classic seal-wear precursor.',
      },
      cog: {
        subsystem: 'INDUSTRIAL GRAPH · ZERO-COPY',
        summary: 'Cognite Data Fusion asset graph. PUMP-401 hierarchy: UNIT-CD-01 → CDU-100 → PUMP-401.',
        toolkit: '§6.2.1',
        kpis: [
          { label: 'assets',       value: '13,402', tone: 'cyan' },
          { label: 'relationships', value: '47,109', tone: 'snow' },
          { label: 'tags / asset',  value: '~84',     tone: 'snow' },
          { label: 'share latency', value: '< 60 s', tone: 'signal' },
        ],
        lineage: {
          source: 'cognite.fusion.assets',
          target: 'cognite.silver.assets_v + timeseries_v',
          refresh: 'zero-copy',
        },
      },
      snow: {
        subsystem: 'CORTEX · ANOMALY ENGINE',
        summary: 'Multivariate anomaly detector on the live sensor stream. Hotelling T² + isolation forest.',
        toolkit: '§6.2.2',
        cortex: { model: 'isolation_forest_seasonal', confidence: 0.93, tokens: 248, latency_ms: 612 },
        kpis: [
          { label: 'T² statistic', value: '14.2',  tone: 'alarm' },
          { label: 'z-score',      value: '4.81',  tone: 'alarm' },
          { label: 'anomaly score', value: '0.91', tone: 'alarm' },
          { label: 'FPR',          value: '2.4 %', tone: 'signal' },
        ],
        writeback: 'COGNITE.PUMP_401.SCORE = 0.91',
      },
      cortex: {
        subsystem: 'CORTEX · FORECAST',
        summary: 'Weibull survival model conditioned on T² > threshold. 48-hour failure window.',
        toolkit: '§6.2.1',
        cortex: { model: 'cortex.forecast.weibull_2p', confidence: 0.88, tokens: 412 },
        kpis: [
          { label: 'P(fail · 48h)', value: '42 %',  tone: 'alarm' },
          { label: 'P(fail · 14d)', value: '36 %',  tone: 'amber' },
          { label: 'η (scale)',      value: '2,140 h', tone: 'snow' },
          { label: 'β (shape)',      value: '2.1',     tone: 'snow' },
        ],
        analysis: 'A β > 1 indicates wear-out failure mode. Combined with T² > 11.3 the conditional probability of failure in 48 hours sits at 0.42.',
      },
      out: {
        subsystem: 'WORK ORDER · OUTPUT',
        summary: 'SAP-PM work order WO-2026-04421 auto-created. Reliability engineer accepted at 17:56 UTC.',
        toolkit: '§6.2.1',
        kpis: [
          { label: 'work order',     value: 'WO-2026-04421', tone: 'signal' },
          { label: 'avoided loss',   value: '$1.24M',        tone: 'signal' },
          { label: 'planned outage', value: 'WK-22',          tone: 'cyan' },
        ],
        writeback: 'SAP-PM.WO-2026-04421 (auto-create + accept)',
      },
    },
    edges: {
      e1: { subsystem: 'OT TELEMETRY', contract: 'PUMP-401 sensors → Cognite graph', format: 'OPC-UA → Cognite Functions', latency: '< 1 s', throughput: '8 tags @ 1 Hz' },
      e2: { subsystem: 'ZERO-COPY SHARE', contract: 'Cognite → Snowflake (Bronze)', format: 'Snowflake Secure Share', latency: '< 60 s', throughput: '0 ETL',
            analysis: 'No data duplication. Snowflake reads a governed view of the Cognite Bronze table.' },
      e3: { subsystem: 'INFERENCE', contract: 'Anomaly score → Weibull forecast', format: 'gold dynamic table', latency: '5 m', throughput: '1 row / asset' },
      e4: { subsystem: 'WRITEBACK', contract: 'Cortex recommendation → SAP-PM', format: 'external function REST', latency: '< 5 s', throughput: '1 WO / event' },
    },
  },

  /* ─────────────────────── CONTRACT TAB ───────────────────────── */
  contract: {
    nodes: {
      quorum: {
        subsystem: 'PHYSICAL FLOWS',
        summary: 'Quorum hydrocarbon flow tickets for BATCH-20260512-001. 120 kbbl gasoline at 5,200 bbl/h.',
        toolkit: '§6.3.1',
        kpis: [
          { label: 'flow',       value: 'FLOW-001',    tone: 'cyan' },
          { label: 'product',    value: 'Gasoline',    tone: 'snow' },
          { label: 'volume',     value: '120 kbbl',    tone: 'snow' },
          { label: 'rate',       value: '5,200 bbl/h', tone: 'signal' },
        ],
        columns: [
          { name: 'flow_id',     type: 'string',    example: 'FLOW-001' },
          { name: 'batch_id',    type: 'string',    example: 'BATCH-20260512-001' },
          { name: 'product',     type: 'string',    example: 'gasoline' },
          { name: 'kbbl',        type: 'numeric',   example: '120' },
          { name: 'ts',          type: 'timestamp', example: '2026-05-12T18:00:00Z' },
        ],
        lineage: {
          source: 'kafka.quorum.flows.v1',
          target: 'quorum.gold.flows',
          refresh: '< 60 s',
        },
      },
      sirion: {
        subsystem: 'CONTRACTS',
        summary: 'Sirion master agreements. CON-789 (sweet crude, 500 kbbl min) and CON-790 (gasoline offtake, 250 kbbl min) active.',
        toolkit: '§6.3.2',
        kpis: [
          { label: 'active contracts', value: '24',  tone: 'cyan' },
          { label: 'API spec',         value: '> 32', tone: 'snow' },
          { label: 'CON-789 fulfill',  value: '67 %', tone: 'signal' },
          { label: 'CON-790 fulfill',  value: '88 %', tone: 'signal' },
        ],
        columns: [
          { name: 'contract_id',  type: 'string',  example: 'CON-789' },
          { name: 'counterparty', type: 'string',  example: 'Supplier-X' },
          { name: 'volume_min',   type: 'numeric', example: '500000' },
          { name: 'price',        type: 'numeric', example: '78.50' },
          { name: 'expiry',       type: 'date',    example: '2026-12-31' },
        ],
      },
      sap: {
        subsystem: 'FINANCIAL · CASH',
        summary: 'SAP postings for BATCH-20260512-001. FIN-001 landed crude cost $1.85M cleared.',
        toolkit: '§6.3.1',
        kpis: [
          { label: 'transaction', value: 'FIN-001',  tone: 'cyan' },
          { label: 'amount',      value: '$1.85M',   tone: 'amber' },
          { label: 'cost type',   value: 'Landed',   tone: 'snow' },
          { label: 'cleared at',  value: '17:00 UTC', tone: 'signal' },
        ],
      },
      snow: {
        subsystem: 'CORTEX · RECONCILE',
        summary: 'Snowpark reconciliation against a 1-hour rolling window. Three-way Quorum × SAP × Sirion.',
        toolkit: '§6.3.1',
        cortex: { model: 'snowpark.reconcile_c2c', confidence: 0.94 },
        kpis: [
          { label: 'variance',    value: '0.1 %', tone: 'signal' },
          { label: 'open Δ',      value: '$84k',  tone: 'amber' },
          { label: 'disputes',    value: '3',     tone: 'amber' },
          { label: 'DSO target',  value: '24 d',  tone: 'signal' },
        ],
      },
      ledger: {
        subsystem: 'RECONCILED LEDGER',
        summary: 'Gold ledger artifact published with column-level lineage to source systems.',
        toolkit: '§6.3.1',
        writeback: 'finance.gold.ledger_reconciled (T+0s surfacing)',
      },
      cash: {
        subsystem: 'AUTO-CLEAR · CASH',
        summary: 'Auto-cleared cash applications. AP, AR, intercompany flowing T+0.',
        toolkit: '§6.3.1',
      },
    },
    edges: {
      e1: { subsystem: 'FLOW INGEST',     contract: 'Quorum → Snowpark Reconcile', format: 'Snowpipe Streaming',  latency: '< 60 s', throughput: '~5k events/s' },
      e2: { subsystem: 'CONTRACT INGEST', contract: 'Sirion → Snowpark Reconcile', format: 'Snowpipe (S3)',        latency: '< 5 m',  throughput: '~100 contracts/min' },
      e3: { subsystem: 'FINANCE INGEST',  contract: 'SAP → Snowpark Reconcile',    format: 'SAP zero-copy',        latency: '< 5 s',  throughput: '0 ETL' },
      e4: { subsystem: 'LEDGER · WRITE',  contract: 'Snowpark → Ledger',           format: 'gold dynamic table',   latency: 'T+0s' },
      e5: { subsystem: 'CASH · APPLY',    contract: 'Ledger → Cash Application',   format: 'external function',    latency: 'T+0s' },
    },
  },

  /* ───────────────────────── TRADING TAB ──────────────────────── */
  trading: {
    nodes: {
      endur: {
        subsystem: 'PAPER TRADES',
        summary: 'Endur trade blotter. TRADE-001 long crack spread booked at 17:45 UTC.',
        toolkit: '§6.4.1',
        kpis: [
          { label: 'trade',        value: 'TRADE-001',   tone: 'cyan' },
          { label: 'instrument',   value: 'Crack 3-2-1', tone: 'snow' },
          { label: 'qty',          value: '80 kbbl',     tone: 'snow' },
          { label: 'price',        value: '$12.40',      tone: 'amber' },
        ],
        columns: [
          { name: 'trade_id',    type: 'string',    example: 'TRADE-001' },
          { name: 'instrument',  type: 'string',    example: 'crack_321' },
          { name: 'side',        type: 'string',    example: 'buy' },
          { name: 'qty_kbbl',    type: 'numeric',   example: '80' },
          { name: 'price',       type: 'numeric',   example: '12.40' },
          { name: 'ts',          type: 'timestamp', example: '2026-05-12T17:45:00Z' },
        ],
      },
      quorum: {
        subsystem: 'PHYSICAL FLOWS',
        summary: 'Quorum reconciliation source: BATCH-20260512-001 has 120 kbbl gasoline.',
        toolkit: '§6.4.1',
        kpis: [
          { label: 'gasoline phys.', value: '120 kbbl', tone: 'cyan' },
          { label: 'diesel phys.',   value: '85 kbbl',  tone: 'snow' },
          { label: 'jet phys.',      value: '32 kbbl',  tone: 'snow' },
        ],
      },
      recon: {
        subsystem: 'SNOWPARK · RECON',
        summary: 'Continuous reconciliation: Endur paper vs Quorum physical, mismatch detected at trader desk in real time.',
        toolkit: '§6.4.1',
        cortex: { model: 'snowpark.reconcile_positions', confidence: 0.96 },
        kpis: [
          { label: 'mismatch',    value: '40 kbbl', tone: 'amber' },
          { label: 'window',      value: '30 d',    tone: 'snow' },
          { label: 'cadence',     value: '< 1 m',   tone: 'signal' },
        ],
        writeback: 'ENDUR.HEDGE_TICKET (auto-draft)',
        analysis: 'Trader is currently 40 kbbl over-hedged on gasoline. Recommend sizing down before close.',
      },
      var: {
        subsystem: 'CORTEX · VaR',
        summary: 'Monte-Carlo VaR (99% / 1d) over the combined paper + physical book. 10,000 paths.',
        toolkit: '§6.4.2',
        cortex: { model: 'snowpark.monte_carlo_var', confidence: 0.92, tokens: 612 },
        kpis: [
          { label: 'VaR · 1d99',    value: '$184k',  tone: 'amber' },
          { label: 'stress 3σ',     value: '$612k',  tone: 'flare' },
          { label: 'hedge effect',  value: '92.4 %', tone: 'signal' },
          { label: 'paths',         value: '10,000', tone: 'snow' },
        ],
      },
      hedge: {
        subsystem: 'HEDGE · OUTPUT',
        summary: 'Recommended hedge adjustment posted as an Endur draft ticket for trader approval.',
        toolkit: '§6.4.2',
        kpis: [
          { label: 'action',  value: 'BUY 12 WTI Z26', tone: 'signal' },
          { label: 'notional', value: '$915k',          tone: 'snow' },
        ],
        writeback: 'ENDUR.HEDGE_TICKET (draft)',
      },
      risk: {
        subsystem: 'COUNTERPARTY · STRESS',
        summary: 'Composite counterparty risk score. Supplier-X healthy; Offtaker-Y on watch; Trader-K escalated.',
        toolkit: '§6.4.3',
        cortex: { model: 'cortex.counterparty_v2', confidence: 0.87 },
        kpis: [
          { label: 'composite',     value: '0.78',  tone: 'signal' },
          { label: 'altman-Z',      value: '3.4',   tone: 'snow' },
          { label: 'news sentiment', value: '+0.42', tone: 'signal' },
          { label: 'exposure',      value: '18 %',  tone: 'cyan' },
        ],
      },
    },
    edges: {
      e1: { subsystem: 'PAPER',     contract: 'Endur → Snowpark Recon',   format: 'Snowpipe Streaming', latency: '< 30 s', throughput: '~5k trades/s' },
      e2: { subsystem: 'PHYSICAL',  contract: 'Quorum → Snowpark Recon',  format: 'Snowpipe Streaming', latency: '< 60 s', throughput: '~5k flows/s' },
      e3: { subsystem: 'RISK',      contract: 'Recon → VaR engine',       format: 'gold dynamic table', latency: '< 30 s' },
      e4: { subsystem: 'STRESS',    contract: 'Recon → Counterparty risk', format: 'gold dynamic table', latency: 'daily' },
      e5: { subsystem: 'EXECUTE',   contract: 'VaR → Hedge ticket',       format: 'external function',  latency: '< 5 s' },
      e6: { subsystem: 'STRESS',    contract: 'Risk → Hedge ticket',      format: 'external function',  latency: '< 5 s' },
    },
  },

  /* ───────────────────── SUSTAINABILITY TAB ───────────────────── */
  sustainability: {
    nodes: {
      stack: {
        subsystem: 'CEMS · FCC STACK',
        summary: 'Continuous emissions monitoring at the FCC smokestack. 1 Hz CO₂, NOₓ, CH₄, opacity.',
        streamKey: 'HX-205:temperature',
        streamUnit: '°C',
        toolkit: '§6.5.1',
        kpis: [
          { label: 'CO₂ · t/hr',  value: '1.42', tone: 'amber' },
          { label: 'NOₓ · ppm',   value: '38',   tone: 'snow' },
          { label: 'CH₄ flags',   value: '2',    tone: 'alarm' },
          { label: 'opacity',     value: '4.1 %', tone: 'snow' },
        ],
        columns: [
          { name: 'stack_id',   type: 'string',    example: 'STACK-3' },
          { name: 'co2_mass_kg', type: 'numeric',  example: '1420' },
          { name: 'ch4_mass_kg', type: 'numeric',  example: '12.4' },
          { name: 'ts',          type: 'timestamp', example: '2026-05-12T17:55:00Z' },
        ],
      },
      fuel: {
        subsystem: 'OPC-UA · FUEL / STEAM',
        summary: 'Process-side fuel-gas and steam consumption. Used for Scope 1 + 2 accounting.',
        toolkit: '§6.5.1',
        kpis: [
          { label: 'fuel-gas', value: '38.4 MMSCFD', tone: 'snow' },
          { label: 'steam',    value: '142 t/h',     tone: 'snow' },
        ],
      },
      calc: {
        subsystem: 'SNOWPARK · GHG ENGINE',
        summary: 'Activity × emission-factor with EPA AP-42 + IPCC GWP-100. Per-batch CI in kg/bbl.',
        toolkit: '§6.5.1',
        cortex: { model: 'snowpark.ghg_calc_v2', confidence: 0.97 },
        kpis: [
          { label: 'intensity', value: '31.2 kg/bbl', tone: 'signal' },
          { label: 'baseline',  value: '32.5 kg/bbl', tone: 'snow' },
          { label: 'delta',     value: '−4.1 %',      tone: 'signal' },
        ],
      },
      leak: {
        subsystem: 'CORTEX · LEAK DETECT',
        summary: 'Computer vision + telemetry fusion. Two active methane leak events.',
        toolkit: '§6.5.2',
        cortex: { model: 'cortex.fugitive_v3', confidence: 0.92 },
        kpis: [
          { label: 'leaks open',   value: '2',           tone: 'alarm' },
          { label: 'top location', value: 'FLR-2 valve', tone: 'alarm' },
          { label: 'P(leak)',      value: '0.92',        tone: 'alarm' },
        ],
      },
      esg: {
        subsystem: 'ESG REPORT · OUTPUT',
        summary: 'CSRD / IFRS S2 disclosure artifact. Signed with Horizon lineage hash.',
        toolkit: '§6.5.3',
        kpis: [
          { label: 'score',        value: 'B+ → A−', tone: 'signal' },
          { label: '2030 target',  value: '−31 %',    tone: 'signal' },
          { label: 'cost avoided', value: '$1.84M/yr', tone: 'signal' },
        ],
      },
      cdp: {
        subsystem: 'REG · DISCLOSURE',
        summary: 'CDP / TCFD published via zero-copy share. Auditor reads the same artifact.',
        toolkit: '§6.5.3',
        writeback: 'cdp.disclosures.csrd_e1_2026',
      },
    },
    edges: {
      e1: { subsystem: 'CEMS',       contract: 'Stack CEMS → Snowpark calc',  format: 'OPC-UA → Snowpipe',  latency: '< 5 s',  throughput: '1 Hz × 4 channels' },
      e2: { subsystem: 'PROCESS',    contract: 'Fuel/steam → Snowpark calc',  format: 'OPC-UA → Snowpipe',  latency: '< 5 s' },
      e3: { subsystem: 'GHG → LEAK', contract: 'Calc → Cortex leak detect',   format: 'gold view',          latency: '< 1 m' },
      e4: { subsystem: 'REPORT',     contract: 'Cortex → ESG artifact',       format: 'CSRD/IFRS gold view', latency: 'T+0' },
      e5: { subsystem: 'DISCLOSE',   contract: 'ESG → CDP / TCFD share',      format: 'zero-copy outbound', latency: 'T+0' },
    },
  },

  /* ─────────────────────── LOGISTICS TAB ──────────────────────── */
  logistics: {
    nodes: {
      eta: {
        subsystem: 'TANKER · AIS',
        summary: 'Live AIS feed for inbound tankers. 12 active vessels in the Gulf network.',
        toolkit: '§6.6.2',
        kpis: [
          { label: 'inbound · 24h', value: '3',   tone: 'cyan' },
          { label: 'avg speed',     value: '12.8 kn', tone: 'snow' },
          { label: 'demurrage risk', value: '$92.4k', tone: 'amber' },
        ],
        columns: [
          { name: 'tanker_id', type: 'string',    example: 'MT POSEIDON' },
          { name: 'imo',       type: 'string',    example: '9234567' },
          { name: 'eta_utc',   type: 'timestamp', example: '2026-05-13T02:40Z' },
          { name: 'cargo_kbbl', type: 'numeric',  example: '320' },
        ],
      },
      quorum: {
        subsystem: 'PRODUCT FLOWS',
        summary: 'Quorum flow tickets. FLOW-001 currently moving 120 kbbl gasoline through the bay.',
        toolkit: '§6.6.3',
      },
      fcst: {
        subsystem: 'CORTEX · FORECAST',
        summary: '14-day demand forecast per terminal. Weather + holiday + price exogenous regressors.',
        toolkit: '§6.6.1',
        cortex: { model: 'cortex.forecast.transformer_demand', confidence: 0.89 },
        kpis: [
          { label: '7d demand',       value: '+6.4 %', tone: 'signal' },
          { label: 'MAPE backtest',   value: '4.2 %',  tone: 'signal' },
          { label: 'memorial day Δ',  value: '+18 %',  tone: 'amber' },
        ],
      },
      vrp: {
        subsystem: 'SNOWPARK · VRP',
        summary: 'Vehicle routing problem solved on Snowpark Container Services using OR-Tools.',
        toolkit: '§6.6.2',
        cortex: { model: 'snowpark.vrp_or_tools', confidence: 0.91 },
        kpis: [
          { label: 'cost saved · /mo', value: '$184k', tone: 'signal' },
          { label: 'OT lifts · 30d',    value: '94.2 %', tone: 'signal' },
        ],
      },
      berth: {
        subsystem: 'OUTPUT · BERTH',
        summary: 'Auto-published berth schedule, refreshed every 5 min.',
        toolkit: '§6.6.2',
        writeback: 'logistics.gold.berth_schedule',
      },
      disp: {
        subsystem: 'OUTPUT · DISPATCH',
        summary: 'Dispatch ticket written back to Quorum for terminal/operator action.',
        toolkit: '§6.6.2',
        writeback: 'QUORUM.dispatch_tickets',
      },
    },
    edges: {
      e1: { subsystem: 'AIS', contract: 'Tanker ETA → VRP', format: 'kafka → Snowpipe', latency: '< 30 s' },
      e2: { subsystem: 'FLOWS', contract: 'Quorum flows → VRP', format: 'Snowpipe Streaming', latency: '< 60 s' },
      e3: { subsystem: 'FORECAST', contract: 'Cortex demand → VRP', format: 'gold dynamic table', latency: '1 h' },
      e4: { subsystem: 'BERTH', contract: 'VRP → Berth schedule', format: 'gold artifact', latency: '5 m' },
      e5: { subsystem: 'DISPATCH', contract: 'VRP → Dispatch ticket', format: 'external function', latency: '< 5 s' },
    },
  },

  /* ───────────────────────── CROSS TAB ────────────────────────── */
  cross: {
    nodes: {
      op: {
        subsystem: 'OPERATOR · INPUT',
        summary: 'Natural-language ask from console operator. Cortex Analyst translates into governed SQL.',
        toolkit: '§6.7.1',
        kpis: [
          { label: 'self-service / wk', value: '428',  tone: 'signal' },
          { label: 'avg time · insight', value: '44 s', tone: 'signal' },
        ],
      },
      cortex: {
        subsystem: 'CORTEX · ANALYST',
        summary: 'NL → SQL grounded in the semantic model REFINERY_AI.SEMANTIC.OPS_V3.',
        toolkit: '§6.7.1',
        cortex: { model: 'cortex.analyst.refinery_ops_v3', confidence: 0.95, tokens: 1280 },
        kpis: [
          { label: 'coverage',       value: '97 %', tone: 'signal' },
          { label: 'response · p95', value: '1.3 s', tone: 'signal' },
        ],
      },
      gov: {
        subsystem: 'GOVERNANCE · RBAC',
        summary: 'Snowflake RBAC + dynamic masking + row-access policies enforce who-sees-what at query time.',
        toolkit: '§6.7.2',
        kpis: [
          { label: 'roles',         value: '27',         tone: 'cyan' },
          { label: 'masking',       value: '14 policies', tone: 'snow' },
          { label: 'row access',    value: '8 policies',  tone: 'snow' },
        ],
      },
      horizon: {
        subsystem: 'HORIZON CATALOG',
        summary: 'Lineage catalog. Every column and dataset traced from source to recommendation.',
        toolkit: '§6.7.2',
        kpis: [
          { label: 'columns',  value: '13,402', tone: 'cyan' },
          { label: 'datasets', value: '247',    tone: 'snow' },
          { label: 'systems',  value: '9',      tone: 'snow' },
        ],
      },
      answer: {
        subsystem: 'ANSWER · OUTPUT',
        summary: 'Answer + citation to the operator. Row-level audit log entry written.',
        toolkit: '§6.7.1',
        writeback: 'audit.log.cortex_analyst_query',
      },
      audit: {
        subsystem: 'AUDIT · REPLAY',
        summary: 'Immutable 7-year audit log. Every query, every recommendation, every writeback.',
        toolkit: '§6.7.2',
        kpis: [
          { label: 'events',     value: '1.2M',   tone: 'cyan' },
          { label: 'retention',  value: '7 yr',   tone: 'snow' },
          { label: 'replay-able', value: 'T+0 → today', tone: 'signal' },
        ],
      },
    },
    edges: {
      e1: { subsystem: 'NL', contract: 'Operator → Cortex Analyst', format: 'cortex agent', latency: '< 3 s' },
      e2: { subsystem: 'GOVERN', contract: 'Cortex → Snowflake + governance', format: 'governed query', latency: '< 1 s' },
      e3: { subsystem: 'LINEAGE', contract: 'Snowflake → Horizon Catalog', format: 'metadata graph', latency: 'T+0' },
      e4: { subsystem: 'ANSWER', contract: 'Snowflake → Operator answer', format: 'JSON + citation', latency: '< 1 s' },
      e5: { subsystem: 'AUDIT', contract: 'Cortex → Audit log', format: 'append-only stream', latency: 'T+0' },
    },
  },
}

/**
 * Decorate a list of nodes with inspector details for a given flowKey.
 * Returns a new array — never mutates the input.
 */
export function decorateNodes<N extends { id: string; data: Record<string, unknown> }>(
  flowKey: string,
  nodes: N[],
): N[] {
  const bundle = FLOW_DETAILS[flowKey]
  if (!bundle) return nodes
  return nodes.map((n) => {
    const details = bundle.nodes[n.id]
    if (!details) return n
    return { ...n, data: { ...n.data, details } }
  })
}

/**
 * Decorate a list of edges with inspector details for a given flowKey.
 */
export function decorateEdges<E extends { id: string; data?: Record<string, unknown> }>(
  flowKey: string,
  edges: E[],
): E[] {
  const bundle = FLOW_DETAILS[flowKey]
  if (!bundle) return edges
  return edges.map((e) => {
    const details = bundle.edges[e.id]
    if (!details) return e
    return { ...e, data: { ...(e.data ?? {}), details } }
  })
}
