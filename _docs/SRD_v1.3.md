# Snowflake AI Data Cloud — Solution Requirements Document v1.3.1
# Decision Support Engine for Texas Refining Value Chain Optimization
# Date: 2026-05-12 · Client: Texas Refining · Classification: Confidential

> Prepared by: Snowflake Sales Architect, Energy & Manufacturing Practice
> Version 1.3.1 supersedes v1.2 (May 12, 2026). All Section 6 and Section 8 placeholders ("full toolkits as previously detailed", "full list from previous version") are expanded to delivery-grade depth. Sections 1.0–4.0 reflect the canonical client-approved language. Section 8 incorporates the client NFR/Governance/TCO/PoV addendum (April 2026).

---

## 0.0 Presentation Tab — 8–12 Minute Interactive Sales Pitch

**Audience:** Texas Refining C-suite, VP Operations, VP Trading, VP Digital, Head of Reliability.
**Format:** Front-loaded narrative anchored to the live React Flow + R3F demo in Section 7.0.
**Voice cues:** All ElevenLabs clips are pre-rendered (Adam = professional male, Rachel = professional female). File index in §10.4.
**Interaction marks:** ★ = pause and ask the room.

### Slide 1 — Title
**"Texas Refining: From Siloed Systems to AI-Driven Margin Leadership in 90 Days"**

> **ElevenLabs Voice — Adam (00:00–00:35):**
> "Good morning. Today I'm showing you how Snowflake turns your Cognite operational data, your SAP financials, your Quorum hydrocarbon flows, your Sirion contracts, and your Endur trading book into a single real-time decision engine. One governed AI Data Cloud. Zero data movement. And a path to thirteen to twenty-eight million dollars of recoverable margin in your first year. Let's begin."

### Slide 2 — The Problem
- Five operational systems, five integration projects, five truths.
- Crude blend decisions made every shift instead of every fifteen minutes.
- Trading book and physical position reconciled T+1 at best.
- Reliability events seen in Cognite hours before SAP financial impact is quantified.

★ **Ask the room:** "On a scale of one to ten, how painful is reconciling physical flows with trading positions today?"

### Slide 3 — The Snowflake Solution
- Zero-copy from Cognite (OT contextualization) and SAP (financials).
- Snowpipe / Kafka for Quorum, Sirion, Endur.
- Cortex AI for forecasting, anomaly detection, semantic search, natural language to SQL.
- Snowpark Container Services for Python optimization workloads (PuLP, scikit-learn, custom Weibull).
- Bidirectional zero-copy writeback to Cognite and Quorum.

**Live demo (2 minutes):** Open Snowflake trial → show zero-copy view of `COGNITE_TIME_SERIES` → run Cortex Analyst query `"Which pumps are likely to fail in the next 48 hours and what is the margin impact?"` → demonstrate alert pushed back to Cognite asset graph.

> **ElevenLabs Voice — Adam (00:00–00:42):**
> "Imagine your refinery making an optimal crude blend decision every fifteen minutes instead of every shift. With Snowflake's native zero-copy integration to Cognite and SAP, every sensor reading, every cost ledger entry, every Quorum flow ticket, every Sirion clause, and every Endur position appears instantly in one governed AI Data Cloud. No duplication. No ETL latency. Real-time margin, reliability, and risk insights that flow straight back to your operators and traders. This is the decision support engine Texas Refining needs to capture an extra thirteen to twenty-eight million dollars in the first twelve months."

### Slide 4 — Value at a Glance
| Pillar | First-Year Range | Payback |
|---|---|---|
| Margin & Yield Optimization | $6–12M | 3–5 months |
| Predictive Maintenance & Reliability | $4–9M | 5–7 months |
| Contract-to-Cash & Risk | $2–4M | 4–6 months |
| Sustainability & Logistics | $1–3M | 6–8 months |
| **Total** | **$13–28M** | **4–8 months** |

★ **Ask the room:** "Which of these excites you most: crude blending, predictive maintenance, or real-time hedging?"

### Slide 5 — Interactive Demo & Next Step
Launch the React Flow + React Three Fiber UI Demo (Section 7.0). Seven tabs, each backed by the exact sample rows in Section 3.0 (PUMP-401, HX-205, BATCH-20260512-001, FIN-001, FLOW-001, CON-789, TRADE-001).

> **ElevenLabs Voice — Rachel (00:00–00:35):**
> "The interactive demo on your screen is fully live. It mocks every Snowflake call — zero-copy reads, Cortex inference, Snowpark optimization — using your actual sample data. You can click any node, run any query, and watch the recommendation propagate back to Cognite in real time. When you're ready, scan the QR code to schedule the paid proof of value."

**QR code:** Calendly + Voice Library + GitHub repo for the demo app.

---

## 1.0 Executive Summary & Objectives

This SRD defines the Snowflake **Decision Support Engine** — a governed AI Data Cloud that unifies **Cognite** (zero-copy OT contextualization), **SAP** (zero-copy finance), **Quorum** (flows and billing), **Sirion** (contracts), and **Endur** (trading) systems into real-time, actionable intelligence.

**Projected First-Year ROI** (200–300 kbpd refinery benchmark): **$13–28M with payback in 4–8 months**, broken down as:

- Margin & Yield: **$6–12M**
- Predictive Maintenance: **$4–9M**
- Contract-to-Cash & Risk: **$2–4M**
- Sustainability & Logistics: **$1–3M**

The engine uses **medallion architecture**, **Cortex AI**, **Snowpark**, and **bidirectional zero-copy sharing**. Cognite remains essential and complementary — it stays the industrial knowledge graph; Snowflake becomes the cross-domain reasoning surface.

### 1.1 The Business Problem in One Paragraph
Texas Refining today operates five excellent point systems that do not talk to each other in the cadence that modern refining margins demand. Cognite holds the operational truth of every pump, exchanger, column, and analyzer — but the truth is locked inside an OT context that finance, trading, and commercial cannot directly consume. SAP holds the financial truth — landed crude cost on FIN-001 at $1.85M for BATCH-20260512-001 — but it knows nothing about the vibration spike on PUMP-401 at 17:55 UTC that will compress the gasoline cut on that exact batch. Quorum knows the physical flow on FLOW-001 (120 kbbl gasoline, 5,200 bbl/h) but cannot tell you whether that flow honors the API>32 spec in CON-789 with Supplier-X. Sirion knows the clause language. Endur knows the paper position on TRADE-001 (80 kbbl Crack Spread long at $12.40). The first plant engineer who can stitch these five truths together every fifteen minutes wins between $13 million and $28 million of margin in year one. That stitching is the Snowflake Decision Support Engine.

### 1.2 The Snowflake Answer in One Paragraph
Snowflake's AI Data Cloud removes the integration tax. Cognite and SAP arrive as **zero-copy shares** — no pipelines to build, no daily extracts to maintain, no schema drift to fight. Quorum, Sirion, and Endur arrive over **Snowpipe Streaming** at sub-minute latency. A **medallion architecture** (Bronze → Silver → Gold) refines this into a semantic refinery ontology. **Cortex AI** functions (`FORECAST`, `ANOMALY_DETECTION`, `SENTIMENT`, `SEARCH`, plus Cortex Analyst for NL→SQL and Cortex Agents for multi-step workflows) make every operator and trader a self-service consumer. **Snowpark Container Services** run the heavy lifting — PuLP linear programs, Weibull survival fits, vehicle-routing optimizations — inside the Snowflake security boundary so no data ever egresses. **Horizon Catalog** keeps every recommendation auditable end-to-end. Recommendations flow back to Cognite as events and to Quorum as work orders via reverse zero-copy share and external functions. The result: a closed-loop decision engine that compresses crude-blend decisions from shift cadence to fifteen-minute cadence, catches PUMP-401-class failures forty-eight hours before they occur, and reconciles Endur paper to Quorum physical inside the trading day.

### 1.3 Why Now
Three industry pressures make 2026 the moment to act:
1. **Margin compression.** Crack spreads have narrowed by approximately 18% versus the 2024 peak, leaving thinner room for shift-level inefficiency.
2. **ESG mandates.** SEC Climate disclosure rules and CSRD's first reporting cycles require auditable Scope 1/2/3 numbers calculated on the same data plane as operations — not a separate annual exercise.
3. **AI maturity.** Cortex AI functions, especially Cortex Analyst and Cortex Agents, have matured to the point where a typical console operator can ask "Which pumps will fail in the next 48 hours and what is the margin impact?" and receive a chart, a SQL audit trail, and a recommended work order in under five seconds.

### 1.4 Key Deliverables (this engagement)
1. Complete data source schemas + sample data (2026-05-12 18:00 UTC snapshot) — §3.
2. Real-time end-to-end data flow examples — §4.
3. Exhaustive toolkits for every value use case category and sub-item — algorithms, formulas, code, flows, ROI, ElevenLabs voice explainers — §6.
4. Interactive frontend-only React Flow + React Three Fiber demo that mocks Snowflake using the live sample data — §7.
5. Non-functional, governance, and commercial considerations the buyer should be asking — §8.
6. Phased implementation roadmap with explicit Phase 0 → Phase 3 milestones — §9.

### 1.5 Strategic Objectives
- **Decision latency:** reduce from shift-level (8h) to micro-batch (5–15 min) for blend, hedge, and maintenance decisions.
- **Single source of truth:** eliminate the three-way reconciliation between Quorum (physical), Endur (paper), and SAP (financial).
- **Operator empowerment:** make every console operator and trader a self-service Cortex Analyst user.
- **Audit defensibility:** Horizon Catalog lineage from sensor reading to journal entry.
- **Sustainability:** Scope 1/2/3 emissions calculated on the same data plane as margin, not in a separate annual exercise.
- **Counterparty resilience:** real-time credit and exposure scoring on every Sirion counterparty so the desk can flex positions before the news cycle turns adverse.
- **Carbon-aware blending:** carbon intensity (kgCO2e/bbl) included as a constraint in every blend LP so Texas Refining can qualify the BATCH-20260512-001-class runs for premium low-CI offtakes.

### 1.6 What "Done" Looks Like Twelve Months from Now
At the end of year one, a Texas Refining console operator on Crude Unit 1 starts their shift by glancing at the Snowflake-powered operator copilot. The copilot has already digested overnight runs of every Cortex anomaly model, every Snowpark blend LP, and every reconciliation across Quorum, SAP, and Endur. The operator sees a prioritized stack of recommendations — "Derate PUMP-401 by 8%, expected margin impact +$148K," "Shift 15 kbbl into sweet crude before 18:30 UTC to honor CON-789," "Reduce CDU feed temperature 4 °C to ease HX-205 fouling pressure." Each recommendation links to a Horizon lineage hash that shows the exact data state behind it. The operator accepts or rejects with a single click; the choice flows back into the model as a label. The trader two floors up sees the same data plane: Endur paper position, Quorum physical reconciliation, VaR, hedge effectiveness. The Treasury team sees the 90-day cash forecast that incorporates today's blend and trading decisions. The ESG team sees Scope 1/2/3 emissions for every batch, including BATCH-20260512-001 at 38.4 kgCO2e/bbl. The auditor — three months from quarter-end — opens a single SQL query with `AT(TIMESTAMP => …)` and replays the exact state behind the May 12 margin number. None of this happens through five integration projects. All of it happens because Cognite and SAP arrive as zero-copy shares, Quorum/Sirion/Endur arrive over Snowpipe Streaming, and Cortex AI plus Snowpark turn the unified data plane into action.

### 1.7 Success Metrics (Year-One Targets)
| KPI | Baseline | Year-1 Target |
|---|---|---|
| Crude blend decision cycle time | 8 h | 15 min |
| Unplanned trip count (PUMP-class) | 6 / yr | 2–3 / yr |
| Three-way reconciliation lag | 4 days | 5 min |
| Operator self-service NL queries / day | <10 | >300 |
| Scope 1+2 emissions disclosed lag | 30 days | T+1 day |
| Margin uplift attributed to the engine | — | $13–28M |

---

## 2.0 System Overview — Decision Support Engine

### 2.1 Medallion Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                       SNOWFLAKE AI DATA CLOUD                     │
│                                                                   │
│  BRONZE (Raw)        SILVER (Staging)        GOLD (Curated)      │
│  ┌────────────┐      ┌────────────┐         ┌────────────┐       │
│  │Cognite ZC  │─────▶│ Cleaned    │────────▶│ Refinery   │       │
│  │SAP ZC      │      │ Harmonized │         │ Ontology   │       │
│  │Snowpipe    │      │ Lineage    │         │ Features   │       │
│  │ Quorum     │      │ tagged     │         │ Semantic   │       │
│  │ Sirion     │      │            │         │ Layer      │       │
│  │ Endur      │      │            │         │            │       │
│  └────────────┘      └────────────┘         └────────────┘       │
│                                                                   │
│  AI LAYER: Cortex Analyst · Cortex Forecast · Anomaly · Search   │
│            Snowpark ML · Container Services · Model Registry     │
│                                                                   │
│  CONSUMPTION: Operator UIs · Trader dashboards · Alerts          │
│               Zero-copy writeback to Cognite + Quorum            │
└──────────────────────────────────────────────────────────────────┘
```

- **Bronze (Raw):** Zero-copy shares (Cognite/SAP) + Snowpipe/Kafka streams.
- **Silver (Staging):** Cleaned, harmonized with column-level lineage.
- **Gold (Curated):** Semantic refinery ontology, feature stores for ML, dynamic tables for incremental refresh.
- **AI Layer:** Cortex Analyst (NL→SQL), Cortex AI functions, Snowpark ML feature store + model registry.
- **Consumption:** Real-time alerts, dashboards, zero-copy feedback loops to source systems.

### 2.2 Decision Support Features
- Recommendations refreshed every **5–15 minutes** for blend, yield, and dispatch decisions.
- **What-if simulations** run interactively in Snowpark Container Services.
- **Automated alerts** pushed back to source systems (Cognite events, Quorum tickets, Endur P&L attributions).
- **Closed-loop governance**: every recommendation carries a Horizon lineage hash so the operator can replay the exact data state that produced it.

### 2.3 Why Cognite + Snowflake (Not Cognite Alone)
| Capability | Cognite Strength | Snowflake Strength |
|---|---|---|
| Asset graph & OT contextualization | ✓ Native | Consumed via zero-copy |
| Cross-domain SQL/analytics | Limited | ✓ Native |
| Generative AI on enterprise data | Limited | ✓ Cortex |
| Financial & trading joins | Indirect | ✓ Native |
| Marketplace data (weather, prices, ESG) | Manual | ✓ One-click |
| Governance & lineage across domains | OT-scoped | ✓ Horizon enterprise-wide |

### 2.4 Logical Component Inventory
The Decision Support Engine consists of seven logical layers. Each is independently scalable and independently governed.

1. **Source Connectors.** Zero-copy connectors for Cognite Data Fusion and SAP S/4HANA via SAP Datasphere; Snowpipe Streaming for Quorum, Sirion, and Endur; Marketplace subscriptions for weather, forwards, and ESG factors.
2. **Bronze Storage.** Raw landing zone, append-only, partitioned by ingest date. Snowflake Time Travel keeps 90 days of point-in-time recovery.
3. **Silver Transformation.** Streams + Tasks + Dynamic Tables turn raw events into cleaned, deduplicated, harmonized records. Column-level lineage in Horizon Catalog.
4. **Gold Semantic Layer.** Refinery ontology — `UNIT_STATE_LATEST`, `BATCH_MARGINS`, `PUMP_FEATURES`, `CONTRACT_DELIVERY_BY_BATCH`, `TRADING_POSITIONS`, `EMISSIONS_MONTHLY`. Every Gold object is documented in the Cortex Analyst semantic model.
5. **AI / ML Layer.** Cortex functions for forecasting, anomaly detection, sentiment, search; Snowpark Container Services for PuLP, scikit-learn, statsmodels, custom Weibull and VRP solvers; Snowflake ML feature store and model registry; Cortex Agents for multi-step autonomous workflows.
6. **Governance & Security.** Horizon Catalog, RBAC roles, dynamic data masking, row-access policies, federated identity, PrivateLink network isolation, BYOK via Tri-Secret Secure.
7. **Consumption.** Operator UI (React Flow + R3F demo in §7), trader desk (existing Endur UI augmented with embedded Snowflake views), CFO/Treasury dashboards (Tableau / Sigma / native Streamlit), auditor view (Horizon lineage browser).

### 2.5 Closed-Loop Decision Pattern
Every recommendation produced by the engine follows the same six-step closed loop:

1. **Observe.** A stream fires when new data arrives (`COGNITE_TIME_SERIES`, `QUORUM_FLOWS`, `ENDUR_TRADES`).
2. **Contextualize.** A Snowflake Task or Dynamic Table joins the new event with the Gold semantic layer.
3. **Score.** A Cortex function or Snowpark Container Service produces a probabilistic recommendation with a confidence band.
4. **Govern.** Horizon Catalog stamps the recommendation with a lineage hash so the data state is replayable.
5. **Act.** Reverse zero-copy share (to Cognite) or external function (to Quorum / Endur) propagates the recommendation back to the system of action.
6. **Learn.** Operator/trader acceptance or rejection is captured back into Snowflake and used as a label for the next Cortex retraining cycle.

---

## 3.0 Data Sources, Schemas & Sample Data (Snapshot: 2026-05-12 18:00 UTC)

**Shared keys** (foreign-key contract used throughout the demo and toolkits):
- `batch_id` — joins SAP, Quorum, Endur.
- `asset_id` — joins Cognite assets ↔ Cognite time series ↔ Quorum unit attribution.
- `contract_id` — joins Sirion ↔ Quorum ↔ Endur.
- `trade_id` — joins Endur ↔ SAP settlement.

### 3.1 Cognite (Zero-Copy)

#### `COGNITE_ASSETS`
| asset_id | name | type | parent_asset | location | contextual_tags |
|---|---|---|---|---|---|
| PUMP-401 | Centrifugal Pump 401 | Pump | UNIT-CD-01 | Crude Unit 1 | vibration_high, seal_risk |
| HX-205 | Heat Exchanger 205 | Exchanger | UNIT-FCC-01 | FCC Unit | fouling_risk |
| UNIT-CD-01 | Crude Distillation Unit 1 | Unit | PLANT-TX-01 | Plant TX | feed_swing_capable |
| UNIT-FCC-01 | Fluid Catalytic Cracker 1 | Unit | PLANT-TX-01 | Plant TX | catalyst_aged |

#### `COGNITE_TIME_SERIES`
| timestamp | asset_id | sensor_type | value | unit | contextual_tag |
|---|---|---|---|---|---|
| 2026-05-12 17:45:00 | PUMP-401 | vibration | 3.1 | mm/s | normal |
| 2026-05-12 17:50:00 | PUMP-401 | vibration | 3.9 | mm/s | elevated |
| 2026-05-12 17:55:00 | PUMP-401 | vibration | 4.8 | mm/s | anomaly_detected |
| 2026-05-12 17:55:00 | HX-205 | dP | 1.42 | bar | fouling_trend |

### 3.2 SAP (Zero-Copy)

#### `SAP_FINANCIALS`
| transaction_id | batch_id | cost_type | amount_usd | timestamp |
|---|---|---|---|---|
| FIN-001 | BATCH-20260512-001 | Crude landed | 1,850,000 | 2026-05-12 17:00:00 |
| FIN-002 | BATCH-20260512-001 | Energy | 92,400 | 2026-05-12 17:30:00 |
| FIN-003 | BATCH-20260512-001 | Catalyst | 18,250 | 2026-05-12 17:30:00 |

### 3.3 Quorum

#### `QUORUM_FLOWS`
| flow_id | batch_id | product | volume_bbl | flow_rate_bbl_h | timestamp |
|---|---|---|---|---|---|
| FLOW-001 | BATCH-20260512-001 | Gasoline | 120,000 | 5,200 | 2026-05-12 18:00:00 |
| FLOW-002 | BATCH-20260512-001 | Diesel | 85,000 | 3,700 | 2026-05-12 18:00:00 |
| FLOW-003 | BATCH-20260512-001 | Jet | 32,000 | 1,400 | 2026-05-12 18:00:00 |

### 3.4 Sirion

#### `SIRION_CONTRACTS`
| contract_id | counterparty | type | volume_min_bbl | price_usd_bbl | expiry | quality_spec |
|---|---|---|---|---|---|---|
| CON-789 | Supplier-X | Crude Supply | 500,000 | 78.50 | 2026-12-31 | API>32 |
| CON-790 | Offtaker-Y | Gasoline Sale | 250,000 | 102.40 | 2026-09-30 | RVP<9 |
| CON-791 | Pipeline-Z | Transport | 1,000,000 | 1.85 | 2027-06-30 | BS&W<0.5 |

### 3.5 Endur

#### `ENDUR_TRADES`
| trade_id | batch_id | instrument | volume_bbl | price_usd_bbl | direction | timestamp |
|---|---|---|---|---|---|---|
| TRADE-001 | BATCH-20260512-001 | Crack Spread | 80,000 | 12.40 | Buy | 2026-05-12 17:45:00 |
| TRADE-002 | BATCH-20260512-001 | WTI Futures | 100,000 | 76.20 | Sell | 2026-05-12 17:45:00 |

### 3.6 Shared Keys & Lineage

```
SIRION_CONTRACTS.contract_id ──┐
                               ├─▶ QUORUM_FLOWS.batch_id ◀─── SAP_FINANCIALS.batch_id
                               │                          ◀─── ENDUR_TRADES.batch_id
COGNITE_ASSETS.asset_id ──▶ COGNITE_TIME_SERIES.asset_id
COGNITE_ASSETS.asset_id ──▶ QUORUM_FLOWS.unit_attribution (derived)
ENDUR_TRADES.trade_id ──▶ SAP_FINANCIALS.settlement_ref (derived)
```

Every join is captured in Horizon Catalog with column-level lineage. The demo in §7 renders these edges as animated React Flow links.

---

## 4.0 Real-Time Data Integration & Flows

### 4.1 End-to-End Scenario Walkthrough — 17:45 to 18:00 UTC, 2026-05-12

This is the **canonical 15-minute scenario** that every toolkit in §6 will reference.

```
17:45 UTC ── Endur books TRADE-001 (Crack Spread, 80 kbbl, Buy @ $12.40)
             │
             ▼  (Snowpipe streaming ingest, <30 s latency)
17:45:30 ── Snowflake Bronze.ENDUR_TRADES has TRADE-001
             │
             ▼  (Dynamic Table refresh, 1-min lag)
17:46 ── Silver.TRADING_POSITIONS reconciles trade with batch BATCH-20260512-001
             │
17:55 ── Cognite zero-copy view surfaces PUMP-401 vibration = 4.8 mm/s
         tagged anomaly_detected by CORTEX.ANOMALY_DETECTION
             │
             ▼  (Stream + Task fires every 5 min)
17:56 ── Cortex model joins:
            • SAP_FINANCIALS (landed crude cost $1.85M for BATCH-20260512-001)
            • QUORUM_FLOWS (current yield: 50% gasoline, 35% diesel, 13% jet)
            • SIRION_CONTRACTS (CON-789 minimum 500 kbbl by Dec-31, API>32)
            • ENDUR_TRADES (TRADE-001 long crack)
             │
             ▼
17:58 ── Snowpark PuLP LP solver returns:
            "Shift 15 kbbl to sweet crude blend; reduce PUMP-401 load 8%;
             expected margin +$148K this batch; expected MTBF extension 22 days"
             │
             ▼  (Reverse share / external function)
17:59 ── Recommendation written back as Cognite event on PUMP-401
         and Quorum dispatch ticket on FLOW-001
             │
18:00 ── Operator console + trader desk receive identical recommendation,
         linked to the same Horizon lineage hash.
```

This is the exact narrative the React UI in §7 animates.

### 4.2 Snowpipe / Kafka Ingestion Patterns

| Source | Latency target | Pattern | Throughput |
|---|---|---|---|
| Cognite | <5 s | **Zero-copy share** (no ingest) | N/A — live view |
| SAP S/4HANA | <5 s | **Zero-copy share** via SAP Datasphere → Snowflake | N/A |
| Quorum | <60 s | **Snowpipe Streaming** from Kafka topic `quorum.flows.v1` | 10k events/s |
| Sirion | <5 min | **Snowpipe** on S3 (Sirion exports JSON) | 100 contracts/min |
| Endur | <30 s | **Snowpipe Streaming** from Kafka topic `endur.trades.v1` | 5k events/s |

```sql
-- Snowpipe Streaming source for Endur
CREATE OR REPLACE PIPE BRONZE.ENDUR_TRADES_PIPE
  AUTO_INGEST = TRUE
AS
COPY INTO BRONZE.ENDUR_TRADES
FROM @kafka_stage/endur/trades/
FILE_FORMAT = (TYPE = AVRO)
MATCH_BY_COLUMN_NAME = CASE_INSENSITIVE;
```

### 4.3 Zero-Copy Share Topology

```
┌────────────┐     ZC Outbound (Cognite)
│  Cognite   │─────────────────────────┐
│ Data Fusion│◀────────────────────────┤
└────────────┘     ZC Writeback        │
                                       ▼
┌────────────┐                  ┌──────────────┐                ┌────────────┐
│  SAP S/4   │── ZC Outbound ──▶│  SNOWFLAKE   │── Reverse ETL ▶│   Quorum   │
│ Datasphere │                  │  AI Data     │                │   (writes) │
└────────────┘                  │  Cloud       │                └────────────┘
                                │              │
┌────────────┐                  │              │
│   Quorum   │── Snowpipe ─────▶│              │
└────────────┘                  │              │
┌────────────┐                  │              │
│   Sirion   │── Snowpipe ─────▶│              │
└────────────┘                  │              │
┌────────────┐                  │              │
│   Endur    │── Snowpipe ─────▶│              │
└────────────┘                  └──────────────┘
```

### 4.4 Writeback / Feedback Loops

- **To Cognite:** Cortex anomaly classifications written as Cognite events with severity and recommended action. Implemented via Cognite outbound zero-copy share + Cognite Functions consumer.
- **To Quorum:** dispatch and blend recommendations posted as Quorum work orders via REST external function `EXT_QUORUM_POST_RECOMMENDATION()`.
- **To Endur:** hedge adjustment suggestions appear as draft tickets the trader confirms or rejects; the confirmation is captured back in Snowflake and feeds the next Cortex retraining cycle (closed-loop learning).

### 4.5 Latency Budget — End to End
The total wall-clock latency from sensor event to operator-visible recommendation in the scenario above is dissected below. The aggregate of approximately 4 minutes is well inside the 5–15 minute recommendation cadence required by §1.5.

| Stage | Best Case | Typical | Worst Case |
|---|---|---|---|
| Cognite zero-copy surfaced in Snowflake | <1 s | 2 s | 5 s |
| Stream + Task fires | 5 s | 15 s | 60 s |
| Silver dynamic table refresh | 5 s | 30 s | 60 s |
| Gold join (`BATCH_MARGINS`, `PUMP_FEATURES`) | 0.5 s | 1.5 s | 3 s |
| Cortex anomaly scoring | 0.3 s | 0.8 s | 2 s |
| Snowpark PuLP LP solve | 4 s | 12 s | 30 s |
| Horizon lineage stamp | 0.05 s | 0.1 s | 0.2 s |
| Reverse share to Cognite | 1 s | 3 s | 5 s |
| External function to Quorum | 0.4 s | 0.8 s | 2 s |
| **Total** | **~12 s** | **~65 s** | **~167 s** |

### 4.6 Ingestion Guardrails
- **Schema evolution.** All Snowpipe streams use `MATCH_BY_COLUMN_NAME = CASE_INSENSITIVE` so additive schema changes do not break the pipeline.
- **Idempotency.** Every Bronze table has a `(source_id, source_timestamp)` uniqueness constraint enforced by a deduplication CTE in the Silver dynamic table.
- **Backpressure.** Snowpipe Streaming auto-scales; bursts of up to 50× steady-state are absorbed without operator intervention.
- **Failure isolation.** A failure in the Endur Kafka topic does not block Quorum ingestion; each stream has its own dynamic-table dependency tree.

---

## 5.0 Cross-Cutting Technical Capabilities

### 5.1 Cortex AI
| Function | Use in Texas Refining |
|---|---|
| `CORTEX.FORECAST` | Demand forecasting (gasoline, diesel, jet), cash-flow forecasting, feedstock pricing |
| `CORTEX.ANOMALY_DETECTION` | PUMP-401 vibration spikes, HX-205 fouling, off-spec product runs |
| `CORTEX.SENTIMENT` | Counterparty news, weather/operational reports, regulator filings |
| `CORTEX.SEARCH` | Sirion contract clause retrieval ("show me all force majeure clauses with API > 32 spec") |
| **Cortex Analyst** | NL→SQL for operators and traders, grounded in the semantic model |
| **Cortex Agents** | Multi-step autonomous workflows (e.g., "diagnose PUMP-401 and draft a work order") |

### 5.2 Snowpark Python
- UDFs for unit conversions (bbl ↔ m³, bbl ↔ tonne by API).
- Stored Procedures orchestrating LP/MILP solves with PuLP and HiGHS.
- **Snowpark Container Services** for heavy optimization workloads — runs PuLP, scikit-learn, statsmodels, and custom Weibull fitters inside the Snowflake security boundary, no data egress.

### 5.3 Snowflake ML
- **Feature Store** — features for `PUMP-401` (rolling-window vibration mean, kurtosis, Hotelling T²) reused across multiple models.
- **Model Registry** — every model versioned with the exact Snowflake query hash that produced its training set.
- **Observability** — drift detection on input features and prediction distributions.

### 5.4 Horizon Catalog
- **Lineage** — column-level lineage from Bronze to Gold to Cortex output to writeback.
- **Classification** — PII, MNPI, ITAR auto-tagged.
- **Masking** — dynamic data masking policies on trader names, counterparty terms, and personal identifiers.

### 5.5 Streams, Tasks, Dynamic Tables
- **Streams** — change capture on `BRONZE.QUORUM_FLOWS` and `BRONZE.ENDUR_TRADES`.
- **Tasks** — 5-min cadence for blend recomputation, 1-min cadence for anomaly scoring.
- **Dynamic Tables** — declarative incremental refresh for `SILVER.TRADING_POSITIONS` and `GOLD.UNIT_MARGINS`.

### 5.6 Security
- **RBAC** roles: `OPERATOR_RO`, `TRADER_RO`, `TRADER_RW`, `RELIABILITY_ENG`, `FINANCE_RO`, `ESG_RO`, `PLATFORM_ADMIN`.
- **Dynamic data masking** — counterparty name masked for non-trading roles.
- **Row-access policies** — operators see only their unit's assets.
- **Federated identity** — SCIM provisioning from Azure Entra ID; SSO via SAML.
- **Network isolation** — PrivateLink to Texas Refining AWS VPC.

### 5.7 Cortex AI Function Catalog (Texas Refining usage)
| Function | Toolkit usage | Approx volume/mo | Approx credit cost |
|---|---|---|---|
| `CORTEX.FORECAST` | 6.3.3, 6.6.1 | ~250 model runs | 30 |
| `CORTEX.ANOMALY_DETECTION` | 6.2.2, 6.5.2 | ~3,000 tags continuous | 110 |
| `CORTEX.SENTIMENT` | 6.4.3 | ~5k news items/day | 25 |
| `CORTEX.SEARCH` | 6.3.2, operator copilot | ~2k searches/day | 20 |
| Cortex Analyst | 6.7.1 | ~5,000 NL queries/mo | 85 |
| Cortex Agents | 6.2.3, 6.7.1 | ~200 multi-step runs | 40 |

### 5.8 Snowpark Container Services — Container Catalog
| Container Image | Toolkit | Primary libraries | Avg run-time |
|---|---|---|---|
| `blend-opt:1.4` | 6.1.1, 6.1.4 | PuLP, HiGHS | 12 s |
| `pump-health:2.1` | 6.2.1 | reliability, numpy, scipy | 4 s |
| `methane-cluster:1.0` | 6.5.2 | scikit-learn, geopandas | 8 s |
| `vrp-route:1.2` | 6.6.2 | vrpy, networkx | 22 s |
| `fouling-udf:1.0` | 6.1.3 | numpy | <1 s |

### 5.9 Snowflake Marketplace Subscriptions (Recommended)
- **AccuWeather** — terminal-level temperature, precipitation, hurricane forecasts (feeds 6.6.1 demand model).
- **Crackers Index / Argus / OPIS** — forward curves and spot prices (feeds 6.1.4 slate optimization).
- **IPCC / EPA Emission Factors** — refreshed annually (feeds 6.5.1 GHG).
- **S&P Capital IQ Pro / Moody's** — counterparty financials and Altman-Z (feeds 6.4.3 counterparty risk).
- **Cybersyn Economic Data** — macro indicators for demand modeling.

---

## 6.0 Exhaustive Value Use Case Toolkits

Each toolkit below follows the same shape:
**Objective · Algorithm · Math (KaTeX) · Snowflake/Snowpark Code · Real-Time Flow · ROI · Voice Script · UI Reference.**

---

### 6.1 Margin & Yield Optimization — $6–12M / year

#### 6.1.1 Crude Blending (LP / PuLP)

**Objective.** Choose the crude slate and rundown ratios that maximize net margin subject to unit, quality, and contract constraints, refreshed every 15 minutes.

**Algorithm.** Linear Programming. Decision variables = volumes of each crude into CDU. Constraints = capacity, sulfur/API/Conradson carbon spec, contract minimums (CON-789), unit availability (PUMP-401 derate).

**Math.**

$$
\max_{x_i} \; Z = \sum_{j} p_j \cdot y_j(x) - \sum_{i} c_i \cdot x_i - E(x)
$$

subject to

$$
\sum_i x_i \le C_{\text{CDU}}, \quad
\sum_i a_{ki} x_i \le b_k \;\;\forall k \in \text{quality specs}, \quad
\sum_i x_i^{(s)} \ge V_{\text{CON-789}}, \quad
x_i \ge 0.
$$

Where $p_j$ = product price, $y_j(x)$ = yield function (linearized around current operating point), $c_i$ = crude cost, $E(x)$ = energy cost.

**Code.**

```python
# Snowpark Container Service — PuLP LP solve
import pulp
from snowflake.snowpark import Session

def solve_blend(session: Session, batch_id: str) -> dict:
    crudes = session.table("GOLD.CRUDE_AVAILABILITY").filter(f"batch_id='{batch_id}'").to_pandas()
    specs  = session.table("GOLD.UNIT_SPECS").to_pandas()
    prices = session.table("GOLD.PRODUCT_PRICES_LATEST").to_pandas()

    prob = pulp.LpProblem("BlendOpt", pulp.LpMaximize)
    x = {c: pulp.LpVariable(f"x_{c}", lowBound=0) for c in crudes.crude_id}

    # Objective: gross margin
    prob += pulp.lpSum(prices.loc[p, "price"] * crudes.yield_factor[c][p] * x[c]
                      for c in x for p in prices.index) \
            - pulp.lpSum(crudes.loc[c, "cost"] * x[c] for c in x)

    # Capacity
    prob += pulp.lpSum(x[c] for c in x) <= 280_000  # bbl/day CDU
    # Sulfur spec
    prob += pulp.lpSum(crudes.loc[c, "sulfur"] * x[c] for c in x) \
            <= 0.4 * pulp.lpSum(x[c] for c in x)
    # CON-789 minimum sweet crude
    prob += pulp.lpSum(x[c] for c in x if crudes.loc[c, "api"] > 32) >= 500_000/30

    prob.solve(pulp.HiGHS_CMD(msg=False))
    return {c: x[c].value() for c in x}
```

**Flow.** At 17:58 UTC the solver returns: shift **15 kbbl into sweet crude** (honoring CON-789), derate PUMP-401 by 8% (per Cognite anomaly), and lift gasoline yield from 50% to 51.2% on `BATCH-20260512-001`. Expected uplift: **+$148K on this batch alone**.

**ROI.** 96 batches/month × $40–110K average uplift = **$4–10M/year** in blending alone.

> **ElevenLabs Voice — Adam (Crude Blending, 35 sec):**
> "Every fifteen minutes, Snowflake's Snowpark linear programming solver looks at your live crude availability, current product prices, unit constraints, and Sirion contract minimums — and tells your blender exactly how to mix the next slate. On batch BATCH-20260512-001 at 17:58 UTC, it recommended shifting fifteen thousand barrels into sweet crude, derating Pump 401 by eight percent, and lifting your gasoline cut to 51.2 percent. Expected uplift: one hundred forty-eight thousand dollars on that single batch."

**UI ref.** Tab `MARGIN` → React Flow nodes `Cognite → SAP → Quorum → Cortex → Recommendation` with animated edge; R3F shows a CDU column with yield bars updating live.

**Edge cases handled by the solver.**
- **Infeasible spec window.** If the sulfur or API constraint cannot be met from available crudes, the solver returns the closest feasible point and a list of relaxation candidates (e.g., "relax CON-789 minimum by 8 kbbl to recover feasibility").
- **PUMP-401 trip during a solve.** A Snowpark Task subscribes to Cognite anomaly events; on a critical event mid-solve, the current solve is aborted and a new solve issued with the derated capacity.
- **Stale price data.** If `GOLD.PRODUCT_PRICES_LATEST` is older than 30 minutes, the solver flags low confidence and the recommendation surfaces with a yellow badge in the operator UI.

---

#### 6.1.2 Real-Time Yield Optimization (Cortex Regression)

**Objective.** Predict next-hour yield distribution for each unit given current feed, energy, and catalyst state, and recommend setpoint changes.

**Algorithm.** Gradient-boosted regression (XGBoost via Snowpark) for each yield fraction, conditioned on feed quality, unit temperatures, and reactor pressures.

**Math.**

$$
\hat{y}_{j,t+1} = f_j\!\left(\mathbf{x}_t\right) + \varepsilon_j, \quad \mathbf{x}_t = [\text{API}_t, T_t, P_t, \text{LHSV}_t, \text{catalyst\_age}_t]
$$

Optimal setpoint:

$$
\mathbf{x}^{*} = \arg\max_{\mathbf{x}\in\mathcal{X}} \sum_j p_j \, f_j(\mathbf{x})
$$

solved with bounded BFGS inside Snowpark.

**Code.**

```sql
-- Cortex regression call against the feature store
SELECT
  asset_id,
  CORTEX.PREDICT(
    'yield_xgb_v7',
    OBJECT_CONSTRUCT('api', api, 'cdu_temp', cdu_temp, 'lhsv', lhsv,
                     'catalyst_age', catalyst_age)
  ) AS yield_forecast
FROM GOLD.UNIT_STATE_LATEST
WHERE asset_id = 'UNIT-FCC-01';
```

**Flow.** Stream on `COGNITE_TIME_SERIES` for UNIT-FCC-01 fires the task; new setpoints written back to Cognite as a recommended event.

**ROI.** 0.3–0.6% yield uplift on 280 kbpd × $90/bbl × 350 days = **$2–4M/year**.

> **ElevenLabs Voice — Rachel (Yield Optimization, 32 sec):**
> "Yield optimization runs as a Cortex regression model trained on three years of your historian data. It predicts, every hour, exactly how much gasoline, diesel, and jet each unit will produce given current feed and operating conditions, and it tells the operator the setpoint change that maximizes contribution margin. On the FCC at 17:55, it suggested raising reactor temperature by four degrees Celsius for a 0.4 percent yield gain. That alone is worth two to four million dollars a year."

**UI ref.** Tab `MARGIN` sub-view "Yield" → R3F shows FCC riser with animated yield split.

---

#### 6.1.3 Energy Optimization (Heat Integration)

**Objective.** Minimize fuel gas and steam consumption while respecting heat-exchanger network constraints. Detect when HX-205 fouling justifies a clean.

**Algorithm.** Pinch analysis + MILP for utility dispatch. Fouling factor estimated from heat duty residuals.

**Math.** Overall HX heat duty:

$$
Q = U A \cdot \text{LMTD}, \quad
\text{LMTD} = \frac{(T_{h,i}-T_{c,o}) - (T_{h,o}-T_{c,i})}{\ln\!\left(\dfrac{T_{h,i}-T_{c,o}}{T_{h,o}-T_{c,i}}\right)}
$$

Fouling resistance:

$$
R_f(t) = \frac{1}{U(t)} - \frac{1}{U_{\text{clean}}}, \quad
\text{clean threshold:} \; R_f(t) \ge R_f^{*}
$$

**Code.**

```python
@udf(packages=["numpy","scipy"], session=session)
def fouling_resistance(U_now: float, U_clean: float = 850.0) -> float:
    return 1.0/U_now - 1.0/U_clean
```

**Flow.** HX-205 dP = 1.42 bar at 17:55. Fouling score crosses threshold; Cortex schedules a clean in the next planned outage window. Avoided fuel gas: ~ $90K/quarter on this exchanger.

**ROI.** Plant-wide heat integration: **$1–2M/year**.

> **ElevenLabs Voice — Adam (Energy Optimization, 30 sec):**
> "Heat exchanger HX-205 has been fouling for three weeks. Snowflake's Snowpark UDF computes the live fouling resistance every five minutes and tells your reliability planner exactly when the energy penalty crosses the cost of a clean. On this exchanger alone we're projecting ninety thousand dollars per quarter in avoided fuel gas. Across the network, one to two million dollars a year."

**UI ref.** Tab `MARGIN` → R3F heat-exchanger model glows red as $R_f$ rises.

---

#### 6.1.4 Product Slate Optimization

**Objective.** Decide the optimal product mix (gasoline / diesel / jet / petchem feed) given forward curves and the long crack position in TRADE-001.

**Algorithm.** Mixed-integer program; integer variables select discrete operating modes (max gasoline, max diesel, balanced, petchem swing).

**Math.**

$$
\max_{z_m\in\{0,1\},\,x} \sum_m z_m \cdot \pi_m(x) \quad \text{s.t.}\; \sum_m z_m=1
$$

**Code.**

```python
prob += pulp.lpSum(z[m] for m in modes) == 1   # one mode at a time
for m in modes:
    prob += pi[m] >= margin_m - M*(1 - z[m])
```

**Flow.** Given long crack TRADE-001 and gasoline forward strength, the solver picks "max gasoline" mode for the next 24h.

**ROI.** **$1–2M/year** through smarter mode selection.

> **ElevenLabs Voice — Rachel (Slate Optimization, 33 sec):**
> "Your slate optimizer is a mixed-integer program that decides whether to push gasoline, diesel, jet, or petchem feed for the next twenty-four hours. It reads your Endur position — for example, TRADE-001's long crack — together with forward curves, and it picks the operating mode that maximizes expected contribution margin. The result on this batch: max gasoline mode, locked in until tomorrow at six p.m."

**UI ref.** Tab `MARGIN` → React Flow node "Slate Mode Selector" with toggle animation.

---

### 6.2 Predictive Maintenance & Asset Reliability — $4–9M / year

#### 6.2.1 Equipment Failure Prediction (Weibull + Hotelling T²)

**Objective.** Predict probability of failure for PUMP-401 and similar rotating equipment in the next 48–168 hours.

**Algorithm.** Hotelling T² on multivariate sensor vector; Weibull survival model for time-to-failure given anomaly state.

**Math.**

$$
T^2 = (\mathbf{x}-\bar{\mathbf{x}})^\top S^{-1} (\mathbf{x}-\bar{\mathbf{x}})
$$

Weibull survival:

$$
S(t) = \exp\!\left[-\left(\frac{t}{\eta}\right)^{\beta}\right], \quad
P(\text{fail in }\Delta t \mid T^2>T^2_\alpha) = 1 - \frac{S(t+\Delta t)}{S(t)}
$$

**Code.**

```python
@sproc(packages=["numpy","scipy","reliability"], session=session)
def pump_failure_prob(asset_id: str, horizon_h: int) -> float:
    import numpy as np, pandas as pd
    from reliability.Fitters import Fit_Weibull_2P
    ts = session.table("SILVER.PUMP_FEATURES").filter(f"asset_id='{asset_id}'").to_pandas()
    t2 = ((ts.iloc[-1, 1:] - ts.iloc[:, 1:].mean()) @
          np.linalg.inv(ts.iloc[:, 1:].cov()) @
          (ts.iloc[-1, 1:] - ts.iloc[:, 1:].mean()).T)
    fit = Fit_Weibull_2P(failures=session.table("GOLD.PUMP_LIFE").to_pandas().tt_f)
    S_t  = np.exp(-((ts.age_h.iloc[-1])         / fit.alpha) ** fit.beta)
    S_th = np.exp(-((ts.age_h.iloc[-1]+horizon_h)/ fit.alpha) ** fit.beta)
    return float(1 - S_th/S_t) * (1.0 if t2 > 12 else 0.3)
```

**Flow.** 17:55 vibration on PUMP-401 = 4.8 mm/s drives T² past threshold; Weibull conditional failure probability over next 48h = 0.42; Cortex writes a Cognite event severity HIGH with recommended derate; reliability engineer accepts work order WO-31742 in CMMS.

**ROI.** Avoid 2–4 unplanned trips/year at $1.0–2.5M each = **$2–6M/year**.

> **ElevenLabs Voice — Adam (Failure Prediction, 38 sec):**
> "Pump 401 just hit 4.8 millimeters per second of vibration. Snowflake's Hotelling T-squared statistic flagged the multivariate signature, and a Weibull survival model placed the probability of failure in the next forty-eight hours at forty-two percent. The recommendation: derate the pump eight percent, schedule a seal inspection on the next planned outage. Avoided unplanned trip cost: between one and two and a half million dollars."

**UI ref.** Tab `MAINTENANCE` → R3F pump model pulses red, sidebar shows live T² gauge.

**Feature inventory used by the model.**
- Vibration RMS (mm/s), peak-to-peak, kurtosis, crest factor
- Bearing temperature delta from baseline
- Pump suction & discharge pressure
- Power draw (kW) versus rated curve
- Lube oil contamination index (from Cognite lab integration)
- Operating hours since last seal change
- Hotelling T² over the rolling 24-hour multivariate vector

The feature store reuses every one of these features across 6.2.2 (anomaly) and 6.2.3 (digital twin), so a single feature pipeline serves three toolkits.

---

#### 6.2.2 Anomaly Detection (CORTEX.ANOMALY_DETECTION)

**Objective.** Surface multivariate anomalies across the entire asset graph in real time.

**Algorithm.** Cortex's built-in Isolation Forest variant with seasonality awareness, augmented with operator-labeled feedback.

**Math.** Anomaly score:

$$
s(\mathbf{x}) = 2^{-\frac{E[h(\mathbf{x})]}{c(n)}}, \quad s > 0.7 \Rightarrow \text{alert}
$$

**Code.**

```sql
SELECT asset_id, ts,
       CORTEX.ANOMALY_DETECTION(value) OVER (PARTITION BY asset_id ORDER BY ts) AS score
FROM SILVER.SENSOR_STREAM
WHERE score > 0.7;
```

**Flow.** PUMP-401 vibration spike scores 0.91 at 17:55; HX-205 dP scores 0.68 (warning) — both surface in the operator console.

**ROI.** Early detection across 3,000 tags = **$1–2M/year** avoided product loss.

> **ElevenLabs Voice — Rachel (Anomaly Detection, 30 sec):**
> "Cortex anomaly detection watches every one of your three thousand sensor tags continuously, in parallel, with no model maintenance from your team. Today at 17:55 it caught Pump 401 with an anomaly score of point nine one, and flagged Heat Exchanger 205 as a warning. Same pane of glass. No false-positive flood."

**UI ref.** Tab `MAINTENANCE` sub-tab "Anomalies" → streaming time-series chart.

---

#### 6.2.3 Digital Twin Operations (Snowpark + Cognite Contextualization)

**Objective.** Run what-if simulations on the live asset graph — e.g., "what if we derate PUMP-401 by 12% instead of 8%?"

**Algorithm.** Surrogate model trained on first-principles simulator output, hosted as Cortex model; Cognite asset graph used for topology lookup.

**Math.** Surrogate:

$$
\hat{y} = g_\theta(\mathbf{x}_\text{ops},\, \mathbf{g}_\text{asset})
$$

where $\mathbf{g}_\text{asset}$ is a graph embedding from the Cognite hierarchy.

**Code.**

```python
@sproc(session=session)
def what_if(asset_id: str, derate_pct: float) -> dict:
    state = session.sql(f"""
      SELECT * FROM GOLD.UNIT_STATE_LATEST
      WHERE asset_id IN (SELECT child FROM GOLD.ASSET_GRAPH WHERE parent='{asset_id}')
    """).to_pandas()
    state["throughput"] *= (1 - derate_pct/100)
    return solve_blend_with_state(state)
```

**Flow.** Operator drags slider in UI from 8% to 12% derate → Snowpark recomputes blend → margin delta visible in 1.4 s.

**ROI.** Operator confidence + smarter trade-offs = **$1M/year**.

> **ElevenLabs Voice — Adam (Digital Twin, 32 sec):**
> "Snowflake hosts a digital twin of your refinery as a surrogate model trained on your first-principles simulator. Drag the derate slider on Pump 401 from eight to twelve percent — and in under two seconds you see the cascading impact on Crude Unit 1 throughput, FCC feed, and contribution margin. Real what-if, not annual offline studies."

**UI ref.** Tab `MAINTENANCE` sub-tab "Digital Twin" → orbitable R3F refinery section with derate slider.

---

### 6.3 End-to-End Contract-to-Cash Visibility — $2–4M / year

#### 6.3.1 Flow ↔ Invoice Reconciliation

**Objective.** Reconcile Quorum physical flows with SAP invoices and Sirion contract terms in real time, not at month-end.

**Algorithm.** Deterministic join on `batch_id`, then fuzzy match on volume/timestamp tolerances for the residual.

**Math.** Acceptable variance:

$$
\left| \frac{V_{\text{Quorum}} - V_{\text{SAP}}}{V_{\text{Quorum}}} \right| \le \tau_v, \quad \tau_v = 0.5\%
$$

**Code.**

```sql
CREATE OR REPLACE DYNAMIC TABLE GOLD.RECONCILIATION_VARIANCE
  TARGET_LAG = '5 minutes' WAREHOUSE = WH_OPS AS
SELECT q.batch_id,
       q.volume_bbl AS qty_flow,
       f.amount_usd / s.price_usd_bbl AS qty_invoiced,
       ABS(q.volume_bbl - f.amount_usd/s.price_usd_bbl)/q.volume_bbl AS var_pct
FROM SILVER.QUORUM_FLOWS  q
JOIN SILVER.SAP_FINANCIALS f USING (batch_id)
JOIN SILVER.SIRION_CONTRACTS s ON s.contract_id = q.contract_id
WHERE var_pct > 0.005;
```

**Flow.** FLOW-001 (120,000 bbl gasoline) reconciles within 0.1% of FIN-001 expected invoice; CON-790 obligation tracker increments toward the 250,000 bbl monthly minimum.

**ROI.** Avoid leakage and dispute fees = **$0.5–1M/year**.

> **ElevenLabs Voice — Rachel (Reconciliation, 32 sec):**
> "Today, reconciling Quorum flows with SAP invoices takes your back office four days. With Snowflake, every batch reconciles in five minutes as a dynamic table refresh. On BATCH-20260512-001, the variance came in at 0.1 percent — well inside tolerance. Disputes caught at the meter, not at month-end."

**UI ref.** Tab `CONTRACT` → React Flow shows Quorum → SAP → Sirion three-way reconciliation.

---

#### 6.3.2 Contract Obligation Tracking (Sirion Fulfillment)

**Objective.** Track minimum / maximum delivery obligations under every Sirion contract live, with alerts at 50%, 75%, and 90% of the period.

**Algorithm.** Time-weighted running tally; Cortex Search for clause retrieval.

**Math.** Fulfillment ratio:

$$
\phi_c(t) = \frac{\sum_{b\in B_c(t)} V_b}{V_{\text{min},c}} \quad
\text{alert if } \phi_c(t) < \frac{t - t_{\text{start}}}{t_{\text{end}} - t_{\text{start}}} - 0.1
$$

**Code.**

```sql
SELECT contract_id,
       SUM(volume_bbl) / ANY_VALUE(volume_min_bbl) AS fulfillment_ratio,
       CORTEX.SEARCH('force_majeure', clauses_text) AS fm_clauses
FROM GOLD.CONTRACT_DELIVERY_BY_BATCH
GROUP BY contract_id;
```

**Flow.** CON-789 (Supplier-X, 500,000 bbl min by Dec-31) at 67% fulfillment, ahead of pace. CON-790 (Offtaker-Y) currently at 88% with 30 days remaining — within band.

**ROI.** Avoid take-or-pay penalties = **$0.5–1M/year**.

> **ElevenLabs Voice — Adam (Contract Tracking, 30 sec):**
> "Sirion contract CON-789 with Supplier-X commits us to half a million barrels of API thirty-two plus crude by December thirty-first. Snowflake's fulfillment tracker shows us at sixty-seven percent — ahead of schedule. Contract CON-790, our offtaker, at eighty-eight percent with thirty days left. No take-or-pay surprises."

**UI ref.** Tab `CONTRACT` sub-tab "Obligations" → progress rings per contract.

---

#### 6.3.3 Cash-Flow Forecasting (CORTEX.FORECAST)

**Objective.** Forecast 30/60/90-day cash flow with confidence bands from live operational data.

**Algorithm.** Cortex's time-series transformer with exogenous regressors (crude price, product cracks, planned outage windows).

**Math.**

$$
\hat{\mathrm{CF}}_{t+h} \sim \mathcal{N}\!\left(\mu_h,\, \sigma_h^2\right), \quad
\mu_h = \mathbb{E}[\mathrm{CF}_{t+h}\mid \mathcal{F}_t]
$$

**Code.**

```sql
CALL CORTEX.FORECAST(
  INPUT_DATA => 'GOLD.CASHFLOW_DAILY',
  TIMESTAMP_COLNAME => 'business_date',
  TARGET_COLNAME => 'net_cashflow_usd',
  FORECAST_HORIZON_DAYS => 90
);
```

**Flow.** TRADE-001 settlement on day +30, FIN-001 already paid; forecast shows June liquidity tight 4–11; Treasury draws revolver early.

**ROI.** Tighter working-capital management = **$0.5–1M/year**.

> **ElevenLabs Voice — Rachel (Cash-Flow Forecast, 32 sec):**
> "Cortex Forecast gives your treasury team a probabilistic ninety-day cash projection grounded in your live trading book, contract obligations, and operating costs. Today's run shows June fourth through eleventh as a tight liquidity window. Plenty of time to draw the revolver early. No more annual spreadsheet roulette."

**UI ref.** Tab `CONTRACT` sub-tab "Cash Flow" → fanchart of 90-day forecast.

---

### 6.4 Trading & Risk Management — Bundled in the $2–4M Contract & Risk Pillar

#### 6.4.1 Position Reconciliation (Physical vs Paper)

**Objective.** Reconcile Endur paper positions with Quorum physical flows continuously.

**Algorithm.** Deterministic match on `batch_id`; mismatch surfaces drift between desk and ops.

**Math.** Position imbalance:

$$
\Delta P = \sum_{b \in \text{paper}} V_b - \sum_{b \in \text{physical}} V_b
$$

**Code.**

```sql
SELECT t.batch_id,
       t.volume_bbl AS paper,
       q.volume_bbl AS physical,
       t.volume_bbl - q.volume_bbl AS delta
FROM SILVER.ENDUR_TRADES t
LEFT JOIN SILVER.QUORUM_FLOWS q USING (batch_id)
WHERE ABS(t.volume_bbl - COALESCE(q.volume_bbl,0)) > 1000;
```

**Flow.** TRADE-001 (80 kbbl paper) vs FLOW-001 (120 kbbl physical) — desk holds an over-hedge of 40 kbbl that the trader must size down before close.

**ROI.** Avoid mismatched hedge slippage = **$0.5–1M/year**.

> **ElevenLabs Voice — Adam (Position Reconciliation, 30 sec):**
> "Every Endur trade and every Quorum flow reconcile inside Snowflake in real time. Today TRADE-001 shows the desk forty thousand barrels over-hedged versus actual physical. The trader sees it before close and sizes down. No more T-plus-one surprises in the back-office meeting."

**UI ref.** Tab `TRADING` → React Flow with mismatch highlight.

---

#### 6.4.2 Hedge Effectiveness & VaR

**Objective.** Quantify hedge effectiveness and compute Value at Risk on the combined book.

**Algorithm.** Historical-simulation VaR + GARCH for tail; hedge effectiveness via dollar-offset method.

**Math.** Historical 1-day 99% VaR:

$$
\mathrm{VaR}_{0.99} = -\inf\{\,\ell \in \mathbb{R} : P(L > \ell) \le 0.01\}
$$

Dollar-offset hedge effectiveness:

$$
\mathrm{HE} = \left|\frac{\Delta V_{\text{hedge}}}{\Delta V_{\text{hedged item}}}\right|, \quad 0.80 \le \mathrm{HE} \le 1.25
$$

**Code.**

```python
@udf(packages=["numpy","scipy"], session=session)
def var_99(pnl_history: list) -> float:
    import numpy as np
    return float(-np.quantile(pnl_history, 0.01))
```

**Flow.** TRADE-001 + TRADE-002 combined book VaR = $2.1M; within $3M risk limit.

**ROI.** Tighter limits + better hedge design = **$0.5–1M/year**.

> **ElevenLabs Voice — Rachel (VaR, 30 sec):**
> "Snowflake computes one-day ninety-nine percent VaR on your full book in seconds. Today's number: two-point-one million dollars, well inside your three-million-dollar limit. Hedge effectiveness on TRADE-001 against the underlying gasoline position: ninety-four percent — squarely in the eighty to one-twenty-five window your auditors require."

**UI ref.** Tab `TRADING` sub-tab "Risk" → VaR fanchart.

---

#### 6.4.3 Counterparty Risk Scoring

**Objective.** Score every counterparty in Sirion on credit, geopolitical, and operational risk.

**Algorithm.** Cortex sentiment on news + financial ratios from a Marketplace dataset + internal default history.

**Math.** Composite score:

$$
R_c = w_1 \cdot \text{Altman-Z} + w_2 \cdot \text{Sentiment}_c + w_3 \cdot \text{ExposureRatio}_c
$$

**Code.**

```sql
SELECT counterparty,
       CORTEX.SENTIMENT(news_text) AS sentiment,
       z_score,
       exposure_usd / pnl_ttm AS exposure_ratio,
       0.4*z_score + 0.3*sentiment + 0.3*(1-exposure_ratio) AS composite
FROM GOLD.COUNTERPARTY_FEATURES;
```

**Flow.** Supplier-X (CON-789) composite = 0.78 (healthy); Offtaker-Y composite = 0.61 (watch).

**ROI.** Reduced bad-debt write-offs = **$0.5–1M/year**.

> **ElevenLabs Voice — Adam (Counterparty Risk, 32 sec):**
> "Every counterparty in Sirion gets a daily composite score: Altman-Z, news sentiment from Cortex, and exposure ratio. Today Supplier-X scores zero-point-seven-eight — healthy. Offtaker-Y at zero-point-six-one — watchlist. Credit knows before legal."

**UI ref.** Tab `TRADING` sub-tab "Counterparty" → scorecard grid.

---

### 6.5 Sustainability & Reporting — Part of the $1–3M Logistics/ESG Pillar

#### 6.5.1 GHG Emissions Calculation (Scope 1/2/3)

**Objective.** Compute Scope 1, 2, 3 emissions for every batch in near real time.

**Algorithm.** Activity × emission-factor model with marketplace EPA / IPCC factors.

**Math.**

$$
E_{\text{scope},b} = \sum_{i} A_{i,b} \cdot EF_{i,\text{scope}}
$$

CI per barrel:

$$
\mathrm{CI}_b = \frac{E_{1,b}+E_{2,b}+E_{3,b}}{V_b}
$$

**Code.**

```sql
SELECT batch_id,
       SUM(activity * ef_scope1) AS scope1_kg,
       SUM(activity * ef_scope2) AS scope2_kg,
       SUM(activity * ef_scope3) AS scope3_kg,
       (SUM(activity * (ef_scope1+ef_scope2+ef_scope3)) / ANY_VALUE(volume_bbl)) AS ci_kg_per_bbl
FROM GOLD.ACTIVITY_X_FACTORS
GROUP BY batch_id;
```

**Flow.** BATCH-20260512-001 carbon intensity = 38.4 kgCO2e/bbl, below 40 target.

**ROI.** Avoid carbon penalty / unlock premium offtakes = **$0.3–0.7M/year**.

> **ElevenLabs Voice — Rachel (Emissions, 30 sec):**
> "Every batch's Scope 1, 2, and 3 emissions are computed inside Snowflake as your operations data hits Bronze. Batch BATCH-20260512-001 came in at thirty-eight-point-four kilograms of CO2-equivalent per barrel — under your forty-kilogram premium-offtake threshold. That batch sells at a premium."

**UI ref.** Tab `SUSTAINABILITY` → R3F flare animation, CI gauge.

---

#### 6.5.2 Methane Leak Detection

**Objective.** Detect fugitive methane emissions from sensor + drone + satellite data.

**Algorithm.** Multi-source fusion with Cortex anomaly + spatial clustering.

**Math.** Bayesian posterior of leak event:

$$
P(L \mid d) \propto P(d \mid L) \cdot P(L)
$$

**Code.** Container service running scikit-learn DBSCAN over geo-tagged readings, output to Cognite events.

**Flow.** Drone pass at 14:00 + sensor cluster at 14:05 → 0.92 posterior leak probability → maintenance dispatched.

**ROI.** Avoid OGMP 2.0 penalties = **$0.3–1M/year**.

> **ElevenLabs Voice — Adam (Methane Leak, 30 sec):**
> "Fixed sensors, drone passes, and satellite data are fused in Snowflake. A density-based clustering job inside Snowpark Container Services flagged a methane plume near Tank Farm A at fourteen-oh-five with ninety-two percent posterior probability. Maintenance is on site in eleven minutes. OGMP 2.0 stays green."

**UI ref.** Tab `SUSTAINABILITY` sub-tab "Methane" → R3F tank farm with plume.

---

#### 6.5.3 ESG Reporting Pipeline

**Objective.** Generate auditable, CSRD/SEC-Climate-ready ESG reports directly from operational data.

**Algorithm.** Materialized GOLD views per disclosure standard, signed and version-locked via Horizon.

**Code.**

```sql
CREATE OR REPLACE VIEW ESG.CSRD_E1 AS
SELECT report_period, scope1_t, scope2_t, scope3_t,
       ci_avg, methane_events,
       HORIZON.LINEAGE_HASH() AS lineage_id
FROM GOLD.EMISSIONS_MONTHLY;
```

**Flow.** Auditor opens the view, sees lineage hash, replays the exact data state. Compliance hours drop 70%.

**ROI.** Reduced audit cost = **$0.3–0.5M/year**.

> **ElevenLabs Voice — Rachel (ESG Reporting, 32 sec):**
> "Your CSRD and SEC climate disclosures are not a quarterly spreadsheet sprint anymore. They are a Snowflake view, signed by Horizon Catalog with a cryptographic lineage hash. Your auditor opens the view, replays the exact data state, and signs off. Seventy percent fewer audit hours."

**UI ref.** Tab `SUSTAINABILITY` sub-tab "Reporting" → live disclosure preview.

---

### 6.6 Demand Forecasting & Logistics — Balance of the $1–3M Pillar

#### 6.6.1 Product Demand Forecasting (CORTEX.FORECAST)

**Objective.** Forecast 7/14/30-day demand for gasoline, diesel, and jet by terminal.

**Algorithm.** Cortex transformer + weather + holiday + price elasticity exogenous.

**Math.**

$$
\hat{D}_{t+h,\,k} = f\!\left(D_{t},\, W_{t},\, P_{t}\right) + \epsilon
$$

**Code.**

```sql
CALL CORTEX.FORECAST(
  INPUT_DATA => 'GOLD.DEMAND_DAILY',
  TIMESTAMP_COLNAME => 'business_date',
  TARGET_COLNAME => 'volume_bbl',
  SERIES_COLNAME => 'product_terminal',
  FORECAST_HORIZON_DAYS => 30,
  EXOG_COLNAMES => ['temp_f','holiday','retail_price']
);
```

**Flow.** Memorial Day weekend gasoline demand +18% → blender retunes; jet steady.

**ROI.** Reduced spot purchase costs and storage churn = **$0.4–1M/year**.

> **ElevenLabs Voice — Adam (Demand Forecast, 30 sec):**
> "Cortex forecasts thirty-day product demand by terminal, conditioned on weather, holidays, and retail prices. Memorial Day weekend gasoline demand projects up eighteen percent. The blender retunes today, the logistics desk re-paths trucks tomorrow. No spot scramble."

**UI ref.** Tab `LOGISTICS` → forecast chart by terminal.

---

#### 6.6.2 Tanker Berth & Routing Optimization

**Objective.** Schedule tanker berths and route trucks to minimize demurrage and miles.

**Algorithm.** VRP (Vehicle Routing Problem) with time windows + berth scheduling MILP.

**Math.**

$$
\min \sum_{(i,j)\in A} c_{ij} x_{ij} + \sum_v d_v \cdot \text{demurrage}_v
$$

**Code.** Snowpark Container Service running `vrpy`.

**Flow.** TRADE-001 cargo aligned to Berth 2 window 22:00–02:00 → $48K demurrage avoided.

**ROI.** **$0.3–0.7M/year**.

> **ElevenLabs Voice — Rachel (Routing, 30 sec):**
> "Snowflake's vehicle routing solver schedules every tanker berth and every truck load each morning. Today it aligned the TRADE-001 cargo to Berth 2 in the twenty-two-hundred window, avoiding forty-eight thousand dollars of demurrage."

**UI ref.** Tab `LOGISTICS` sub-tab "Routing" → R3F harbor scene with tanker animation.

---

#### 6.6.3 Feedstock Logistics

**Objective.** Optimize feedstock arrivals against tank capacity, contract terms, and crude differentials.

**Algorithm.** MILP with rolling horizon.

**Math.**

$$
\min \sum_t \left[ \text{Inv}_t \cdot h + \text{Demurrage}_t + \text{Penalty}_t \right]
$$

**Flow.** CON-789 next shipment scheduled to arrive when sweet crude tank inventory falls below 200 kbbl — perfectly timed against contract minimum.

**ROI.** **$0.3–0.5M/year**.

> **ElevenLabs Voice — Adam (Feedstock Logistics, 30 sec):**
> "Sweet crude arrivals from Supplier-X are timed against your real-time tank inventory and CON-789's minimum-volume clock. The next shipment lands the day after sweet crude inventory crosses two hundred thousand barrels. Tankage stays full, contract stays satisfied, no demurrage."

**UI ref.** Tab `LOGISTICS` sub-tab "Feedstock" → tank-level gauges + arrival timeline.

---

### 6.7 Cross-Cutting Toolkits

#### 6.7.1 Workforce Enablement (Cortex Analyst NL→SQL)

**Objective.** Let every operator, planner, and trader ask data questions in English.

**Algorithm.** Cortex Analyst, grounded in a curated semantic model.

**Code.**

```sql
-- Semantic model snippet (YAML loaded into Cortex Analyst)
tables:
  - name: PUMP_HEALTH
    base_table: GOLD.PUMP_FEATURES
    dimensions: [asset_id, unit, plant]
    measures: [hotelling_t2, vibration_rms, failure_prob_48h]
```

**Flow.** Operator types: *"Show me pumps with failure probability above 30% in Crude Unit 1."* Cortex returns SQL + result + chart in <3 s.

**ROI.** Saved analyst hours + faster decisions = **$0.5–1M/year**.

> **ElevenLabs Voice — Rachel (Cortex Analyst, 32 sec):**
> "Every operator, every trader, every planner gets a natural-language interface to your data. 'Show me pumps with failure probability above thirty percent in Crude Unit 1.' Three seconds later: a chart, the SQL, and a one-click drill-through. No more queueing behind BI."

**UI ref.** Tab `CROSS` → chat-style Cortex Analyst panel.

---

#### 6.7.2 Audit & Compliance (Horizon Lineage Replay)

**Objective.** Allow auditors to replay the exact data state behind any decision or report.

**Algorithm.** Horizon Catalog lineage with Snowflake Time Travel (90 days standard, indefinite via clones).

**Code.**

```sql
SELECT *
FROM GOLD.UNIT_MARGINS AT(TIMESTAMP => '2026-05-12 18:00:00'::timestamp)
WHERE batch_id = 'BATCH-20260512-001';
```

**Flow.** Auditor asks: "Show me the data state that produced the May 12 batch margin report." One query, immutable, hash-verifiable.

**ROI.** Reduced audit cost + reduced regulatory risk = **$0.3–0.5M/year**.

> **ElevenLabs Voice — Adam (Audit & Compliance, 30 sec):**
> "Every recommendation, every report, every regulatory disclosure carries a Horizon Catalog lineage hash. Your auditor types a single query, replays the exact data state from May twelfth at eighteen-hundred UTC, and signs the workpaper. Defensible, immutable, and a fraction of the audit cost."

**UI ref.** Tab `CROSS` sub-tab "Audit" → time-travel query browser.

---

#### 6.7.3 Embedded Operator Copilot (Cortex Agents)
**Objective.** A multi-step agent that diagnoses an event end-to-end and drafts the response.

**Algorithm.** Cortex Agent orchestrates: (a) Cortex Search over historical similar events, (b) Cortex Analyst SQL retrieval of current state, (c) Snowpark `pump_failure_prob`, (d) drafted work-order text generation.

**Flow.** Operator types "Diagnose PUMP-401". The agent returns: similar 2024 events, current T² = 14.2, 48h failure probability = 0.42, drafted work order WO-31742 referencing CON-789 minimum delivery constraint.

**ROI.** Folded into 6.7.1's $0.5–1M.

> **ElevenLabs Voice — Rachel (Operator Copilot, 35 sec):**
> "Type 'Diagnose Pump 401' into the operator copilot. In four seconds, Cortex Agents pulls up the three most similar historical events, computes the current Hotelling T-squared, runs the Weibull survival model, drafts work order WO-31742, and links it to your Sirion contract delivery clock. Three desks of analysis, four seconds, one chat prompt."

**UI ref.** Tab `CROSS` sub-tab "Agent" → chat interface with action chips.

---

**§6 ROI Roll-up** (matches headline):

| Pillar | Contributors | Range |
|---|---|---|
| Margin & Yield | 6.1.1–6.1.4 | $6–12M |
| Maintenance | 6.2.1–6.2.3 | $4–9M |
| Contract/Cash + Trading | 6.3.1–6.3.3 + 6.4.1–6.4.3 | $2–4M |
| Sustainability + Logistics + Workforce/Audit | 6.5.x + 6.6.x + 6.7.x | $1–3M |
| **Total** | | **$13–28M** |

---

## 7.0 Interactive UI Demonstration (React Flow + R3F)

The demo is **frontend-only**; it mocks every Snowflake interaction (zero-copy reads, Cortex inference, streams) using the exact sample data in §3.

### 7.1 How to Run

```bash
cd /home/jnfz/repos/Snowflake/app
npm install
npm run dev
# open http://localhost:5173
```

### 7.2 Stack
| Layer | Library |
|---|---|
| Build | Vite + React + TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Workflow graph | `@xyflow/react` |
| 3D | `@react-three/fiber` + `@react-three/drei` |
| State | `zustand` |
| Mock data | `@faker-js/faker` for streaming jitter on the §3 base rows |

### 7.3 Tab Map

| Tab | React Flow Workflow | R3F 3D Scene | Cortex Query Panel | Time Series |
|---|---|---|---|---|
| `margin` | Cognite → SAP → Quorum → Cortex → Blend recommendation | CDU column with animated yield bars | Crude blending LP | Yield % over last 30 min |
| `maintenance` | Sensor → Anomaly → T² → Weibull → Work order | PUMP-401 pulsing red on vibration | Failure-prob query | Vibration RMS stream |
| `contract` | Quorum ↔ SAP ↔ Sirion reconciliation | Tank farm with fill levels | Reconciliation variance | Variance % stream |
| `trading` | Endur paper ↔ Quorum physical | Hedge gauge + VaR fanchart | VaR computation | P&L stream |
| `sustainability` | Sensors → Activity × EF → CI | Flare stack + plume | CI by batch | Scope 1/2/3 stream |
| `logistics` | Demand forecast → Routing → Berth | Harbor with tanker animation | Demand forecast | Demand by terminal |
| `cross` | Operator NL → Cortex Analyst → SQL | Semantic model graph | Free-text NL→SQL | Query latency |

### 7.4 Mocked Snowflake Telemetry
Every "Run Query" button surfaces realistic mocked metadata:

```ts
{
  query_id: 'q_8f3a...',
  warehouse: 'WH_OPS_M',
  scan_bytes: 4_812_339,
  rows_produced: 14_220,
  duration_ms: 1_416,
  cortex_tokens_in: 1_812,
  cortex_tokens_out: 248,
  cortex_confidence: 0.93,
  lineage_hash: 'hzn_d11b3c...'
}
```

This data drives the "scan bytes" and "tokens" badges in the UI so prospects feel real query economics.

---

## 8.0 Non-Functional, Security, Governance, TCO, Change Management, PoV, Monitoring, Vendor, and Post-Go-Live Requirements

This section is the deliberate counter-brief. Sales prospects rarely raise non-functional requirements until well into procurement — by then it is expensive to add them. The items below should be on the table at Phase 0. Content reconciles the original v1.2 "what you're not asking" list with the April 2026 client NFR addendum.

### 8.1 Non-Functional Requirements

**Headline commitments (from the client addendum):**
- **Latency SLA.** Real-time alerts and recommendations delivered in **< 30 seconds** end-to-end from source-system event to operator dashboard. Snowpipe continuous ingest + Cortex AI inference + zero-copy shares achieve **sub-5-second typical latency** for high-priority use cases (margin optimization, anomaly detection).
- **Scalability.** Designed to ingest and process **500,000+ sensors/day** of high-frequency Cognite time-series. Snowflake multi-cluster warehouses and Snowpark auto-scaling absorb refinery peaks without manual intervention.
- **Uptime / Availability.** **99.99% Snowflake SLA** (industry-leading for cloud data platforms). Multi-AZ and multi-cloud deployment options for business continuity.

**Detailed targets:**

| Metric | Target | Notes |
|---|---|---|
| End-to-end alert latency (event → dashboard) | <30 s contractual / <5 s typical | Snowpipe + Cortex + ZC |
| Ingest latency (Cognite/SAP) | <5 s | Zero-copy, no SLO degradation |
| Ingest latency (Quorum/Endur) | <60 s | Snowpipe Streaming |
| Sensor throughput | 500k+ sensors/day sustained | Multi-cluster auto-scale |
| Query p95 (interactive) | <3 s | M-size warehouse, auto-suspend 60s |
| Cortex inference p95 | <2 s | Per-function |
| Availability | 99.99% | Snowflake SLA, multi-AZ |
| Multi-cloud option | AWS / Azure / GCP | Customer-controlled region |
| RPO / RTO | 15 min / 1 h | Replication enabled |
| Concurrent users | 500 | Multi-cluster auto-scale |
| Query throughput | 5,000 / min peak | XL warehouse for batch windows |
| Ingest throughput | 50k events/s burst | Snowpipe Streaming auto-scale |
| Cortex Forecast batch | <10 min for 30-day horizon × 50 series | L warehouse |
| Snowpark LP solve | <30 s for 200-variable blend | Container Services M-2node |
| Dashboard render | <2 s p95 | Result-set caching enabled |

### 8.1.1 SLO Commitments by Workload Tier
| Tier | Workload | Availability | Latency p95 | Notes |
|---|---|---|---|---|
| Tier 1 | Operator console, anomaly stream | 99.99% | <3 s | Multi-cluster warehouse, geo-replicated |
| Tier 2 | Trader desk reconciliation | 99.95% | <5 s | Single-region |
| Tier 3 | Finance, ESG reporting | 99.9% | <15 s | Single-region, batch-tolerant |
| Tier 4 | Ad-hoc analytics | 99.5% | <60 s | XS warehouse, best-effort |

### 8.2 Security & Compliance
- **RBAC & Fine-Grained Access.** Role-based access with **dynamic data masking**, **row-level security**, and **column-level policies**. Examples: traders see only aggregated positions; plant operators see only their unit's sensor data; counterparty names masked for non-trading roles.
- **Encryption.** Data **encrypted at rest (AES-256)** and **in transit (TLS 1.3)**. **PrivateLink** for zero-copy shares with Cognite and SAP eliminates public-internet exposure.
- **Compliance.** **SOC 2 Type II**, **ISO 27001**, HIPAA-equivalent controls, **CMMC Level 2 readiness** for energy-sector regulatory alignment. Full audit logging via Horizon Catalog.
- **Data Residency.** Multi-cloud deployment (AWS, Azure, GCP) with **customer-controlled region selection** to meet U.S. Gulf Coast data-sovereignty needs.
- **Zero-trust.** PrivateLink, no public endpoints; SCIM + SAML SSO.
- **BYOK.** Tri-Secret Secure with AWS KMS customer-managed keys.
- **Identity.** SCIM provisioning from Azure Entra ID; SAML SSO; quarterly access review.
- **Audit trail.** `QUERY_HISTORY`, `LOGIN_HISTORY`, and `ACCESS_HISTORY` retained 1 year minimum; full Horizon Catalog lineage retained indefinitely.

### 8.3 Data Quality & Governance Framework

- **DQ Rules.** Automated data quality checks (**completeness, freshness, accuracy**) executed via Snowflake Tasks on Bronze → Silver layers. Examples:
  - "Cognite time-series freshness < 60 seconds"
  - "Quorum volume variance < 0.5% vs. Sirion contract"
  - "SAP share freshness < 5 minutes"
  - "Quorum completeness ≥ 99.95% of expected hourly tickets"
- **Implementation tooling.** Great Expectations suites at Bronze→Silver and Silver→Gold transitions; Monte Carlo / Anomalo for freshness, volume, distribution, and schema monitors.
- **Horizon Catalog Policies.** Centralized catalog with **business glossary**, **end-to-end lineage** (source → Cortex model → recommendation), and **automated classification** of sensitive data (PII, financials, OT). Data products are published as governed shares for internal and external (trader/supplier) consumption.
- **Reconciliation monitors.** Daily three-way reconciliation (Quorum / SAP / Endur) variance must stay below 0.5%; breaches generate Cognite events and Snowflake alerts.
- **Quality score target.** ≥ 95% composite DQ score across all Bronze → Silver promotions (per PoV success criteria in §8.6).

### 8.4 Detailed TCO Model & Zero-Copy Savings

**Baseline assumptions** (200–300 kbpd refinery): ~500k sensors/day, 2–5 TB/month new data, moderate AI/ML workload.

| Cost Component | Year-1 Range |
|---|---|
| Snowflake compute + storage | **$180k–$320k** |
| Cortex AI credits (Forecast/Anomaly/Analyst/Search/Agents) | included in compute |
| Snowpark Container Services | included in compute |
| Marketplace data subscriptions (weather, prices, ESG, counterparty) | $40k–$80k |
| Professional Services (Phase 0–1 fixed-fee) | $150k–$220k |
| **Year-1 total** | **$370k–$620k** |

**Zero-Copy Savings.** Cognite and SAP data incur **zero storage cost** in your Snowflake account (only compute when queried). Estimated annual savings: **$250k–$450k** vs. traditional ETL/duplication approaches.

**Net 3-Year TCO Advantage.** **40–60% lower** than on-prem or competing lakehouse platforms due to pay-per-second compute, auto-suspend, and zero-copy architecture.

**Steady-state credit breakdown (post-PoV):**

```
Compute (Warehouses):
  WH_OPS_M (auto)     ─ 8h/day avg ─ 192 credits/mo
  WH_ML_L  (auto)     ─ 2h/day avg ─ 96  credits/mo
  WH_BI_XS (auto)     ─ 4h/day avg ─ 16  credits/mo

Cortex:
  FORECAST  ─ ~250 model runs/mo     ─ ~30  credits
  ANOMALY   ─ ~3,000 tags continuous ─ ~110 credits
  ANALYST   ─ ~5,000 NL queries/mo   ─ ~85  credits

Storage:
  ~12 TB compressed ─ ~$280/mo

Snowpark Container Services:
  ~120 service-hrs/mo ─ ~140 credits

Estimated total: 670 credits/mo ≈ $1.0–1.3M/yr at typical enterprise discount.
ROI ratio: 10×–20× year one against $13–28M margin uplift.
```

**Warehouse sizing matrix:**

| Workload | Size | Multi-cluster | Notes |
|---|---|---|---|
| Operator queries | M | 1–3 | Auto-suspend 60 s |
| Cortex retraining | L | 1 | Nightly |
| Container Services | M-2node | N/A | LP solves |
| BI dashboards | XS | 1 | Caching reduces credits |

### 8.5 Change Management & Training Plan

- **Phase 1 (PoV).** 4-hour operator/analyst workshop + hands-on Cortex Analyst training.
- **Phase 2 (Go-Live).** Role-based training tracks:
  - **Analysts:** SQL + Snowpark Python.
  - **Operators:** natural-language Cortex Analyst, embedded in the console.
  - **Data Scientists:** full ML lifecycle — feature store, model registry, drift monitoring.
- **Adoption Support.** Quarterly "AI Champion" program, pre-built dashboards, and embedded voice explainers in the React UI for self-service learning.
- **Champion bench (90-day program).** 4 operators + 2 traders + 2 reliability engineers, weekly office hours with Snowflake SAs.
- **Adoption target.** **80% user adoption within 90 days**; Daily Active Users ≥ 60% by month 3.

### 8.6 PoV Success Criteria and Resource Plan

**Success Criteria (4–6 week PoV).**
- Deliver **at least one live toolkit** (recommended: 6.1.1 Crude Blending or 6.2.1 PUMP-401 Predictive Maintenance) with measurable ROI signal.
- Demonstrate **< 30 s end-to-end latency** and zero-copy Cognite/SAP integration.
- Achieve **≥ 95% data-quality score** and positive user feedback.
- Measured margin uplift of **≥ $250k** on the chosen use case across two real batches.

**Resource Plan.**
| Side | Role | Allocation |
|---|---|---|
| Snowflake | Sales Architect | 20 hrs/wk |
| Snowflake | Solutions Engineer | 20 hrs/wk |
| Texas Refining | Data Lead | 10 hrs/wk |
| Texas Refining | Operations Sponsor | 10 hrs/wk |
| Texas Refining | Reliability SME (PUMP-class) | 5 hrs/wk |

**Budget.** Modest consumption credits for the PoV environment; Professional Services fixed-fee covered under the Phase 0–1 SOW.

### 8.7 Monitoring & Model-Drift Observability

- **Built-in Tools.** Snowflake **Query Profile**, **Resource Monitors**, and **Cortex Model Monitoring**.
- **Model-Drift Detection.** Automated Snowpark jobs compare live predictions versus actual outcomes (e.g., predicted vs. actual yield on each batch; predicted vs. observed failure on PUMP-class equipment). **Alerts via email/Slack when drift > 5%.**
- **Feature drift.** Model registry tracks feature distribution drift; alerts fire on >2σ shifts in any input feature.
- **Observability Dashboard.** Unified view of pipeline health, latency, freshness, Cortex confidence distributions, and drift signals. Embedded into the operator console as a "platform health" pane.
- **DR/BCP.** Cross-region replication of metadata + critical Gold datasets to us-west-2. Failover runbook tested quarterly. **RPO 15 min / RTO 1 h**. Time Travel 90 days, Fail-safe 7 days, long-term clones for regulatory periods.

### 8.8 Vendor Contract Addendums for Cognite/SAP Data-Sharing

- **Zero-Copy Addendums.** Standard Snowflake **Secure Share** agreements with Cognite and SAP Business Data Cloud (already in place via the 2025–2026 partnerships). Include **bidirectional sharing clauses, data-ownership retention, and audit rights**.
- **Recommended contractual language:**

  > "Customer retains full ownership of shared data; Snowflake acts only as compute layer."

- **Hybrid / Multi-Region.** Optional secondary deployment in Azure West Europe or other regions for regulatory boundaries; Snowflake **Cross-Cloud Replication** keeps Gold + lineage in sync. Cognite federation supported via the same zero-copy connector.
- **Vendor Lock-in & Exit.**
  - All Gold tables exportable as Parquet via `COPY INTO @stage`.
  - **Iceberg** table format supported for fully open storage if Texas Refining prefers.
  - Cortex models trained inside Snowflake stay inside Snowflake; an exit plan replaces them with equivalent open-source models (Prophet, ARIMA, IsolationForest) at <2% accuracy delta.

### 8.9 Post-Go-Live Support & Quarterly AI Retraining Process

- **Support.** **24×7 Snowflake Premier Support** + **dedicated Customer Success Manager**.
- **Quarterly AI Retraining.** Automated Snowpark pipelines retrain Cortex / Snowpark models using the **latest 90-day data**. A governance review ensures no unintended bias or drift before deployment.
- **Retraining gate.** New model promoted to production only if it improves on the incumbent on a held-out 14-day window by ≥ 1% on the primary metric without regression on secondary metrics.
- **Open-source licensing footprint** (carried over from prior version):

| Component | License | Risk | Mitigation |
|---|---|---|---|
| PuLP | BSD | Low | Vendor in container image |
| HiGHS | MIT | Low | Vendor in container image |
| scikit-learn | BSD | Low | Vendor in container image |
| reliability | LGPL | Medium | Containerized; no static linking |
| vrpy | MIT | Low | Vendor in container image |
| @xyflow/react | MIT | Low | Bundled in app |
| three.js / R3F | MIT | Low | Bundled in app |

### 8.10 Integration Testing with Your Exact Data Volumes

- **Approach.** During PoV, anonymized subsets of real Texas Refining data volumes (sensor streams from Cognite, trade files from Endur, contract PDFs from Sirion, flow tickets from Quorum, financial extracts from SAP) are ingested into the trial Snowflake account. Full end-to-end testing validates **latency, scalability, and accuracy against production-like loads**.
- **Test scope.**
  - 30 days of Cognite time-series at 500k sensors/day sustained throughput.
  - 90 days of Endur trade history including edge cases (TRADE-001-class crack-spread bookings).
  - 12 months of Sirion contract corpus including force-majeure clause set.
  - Full Quorum month-end reconciliation against SAP for 3 consecutive months.
- **Performance tuning playbook** (validated during integration testing):
  - **Clustering keys.** Apply on `BATCH_ID` for Quorum + SAP + Endur joins; on `(asset_id, timestamp)` for Cognite time series.
  - **Search Optimization Service** on `SIRION_CONTRACTS.clauses_text` to accelerate Cortex Search.
  - **Materialized views** on `GOLD.UNIT_MARGINS` to shave 200–400 ms off dashboard render.
  - **Result-set cache** retained 24 h for unchanged Gold tables.
- **Exit criteria for integration test.** All workload tiers (§8.1.1) meet their latency p95 targets under the production-like load; DQ composite score ≥ 95%; reconciliation variance < 0.5%.

---

## 9.0 Implementation Roadmap & Next Steps

### 9.1 Phase 0 — Workshop & Discovery (Weeks 1–2)
- Joint architecture workshop, security review, identity integration plan.
- Confirm zero-copy connectors with Cognite & SAP teams.
- Lock the Phase 1 use case (recommendation: **6.1.1 Crude Blending** for fastest ROI demonstration).

### 9.2 Phase 1 — Paid PoV (Weeks 3–8)
- Stand up Bronze + Silver + Gold for the chosen use case.
- Wire the React UI to the live Snowflake account (replace mock toggles).
- Demonstrate measured uplift on 2 real batches.
- Exit criteria: $250K+ measured margin uplift; operator NPS ≥ +30.

### 9.3 Phase 2 — Production Rollout (Months 3–5)
- Extend to all §6.1 + §6.2 toolkits.
- Production change management; Horizon governance go-live.
- Operator and trader certification.

### 9.4 Phase 3 — Scale-Out (Month 6+)
- Add §6.3–§6.7 toolkits.
- Marketplace data subscriptions (weather, forwards, ESG factors).
- Adjacent use cases: refinery network optimization across all Texas Refining sites.

### 9.5 Commercial Structure
- Consumption-based Snowflake credits with annual commit (recommended: 1,200 credits/yr year-1).
- Cortex credits included in commit.
- Snowpark Container Services billed at standard compute rates.
- Professional Services SOW for Phases 0–2 fixed-fee.
- Optional Snowflake Industry Solutions accelerator for Energy.

### 9.6 RACI Matrix (Phase 0–1)
| Activity | Snowflake SA | Snowflake PS | TxR Architect | TxR Reliability | TxR Trading | TxR Finance | TxR Security |
|---|---|---|---|---|---|---|---|
| Architecture workshop | R | C | A | C | C | C | C |
| Zero-copy connector to Cognite | R | A | C | I | I | I | C |
| Zero-copy connector to SAP | R | A | C | I | I | C | C |
| Snowpipe streams (Quorum/Sirion/Endur) | C | R | A | I | C | I | C |
| Gold semantic layer | C | R | A | C | C | C | I |
| Blend LP container | C | R | C | I | C | I | I |
| PUMP-401 anomaly model | C | R | C | A | I | I | I |
| Cortex Analyst semantic model | C | R | A | C | C | C | I |
| Horizon governance go-live | R | C | A | I | I | I | A |
| Security review | C | C | C | I | I | I | A |

R = Responsible · A = Accountable · C = Consulted · I = Informed

### 9.7 Risk Register (Top 10)
| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| 1 | Cognite zero-copy connector requires Cognite version uplift | M | M | Confirm Cognite version in Phase 0 |
| 2 | SAP Datasphere license not in place | L | H | Pre-check during procurement |
| 3 | Snowpark container egress required to external solver | L | M | Use Container Services with in-VPC PrivateLink |
| 4 | Cortex Analyst hallucinates a non-existent column | L | M | Strict semantic model; constrained vocabulary |
| 5 | Operator adoption stalls below 30% | M | H | Champion program; embed Cortex in console |
| 6 | Cost overrun on Cortex credits | L | M | Quotas; monthly governance review |
| 7 | Quorum schema drift breaks Snowpipe | M | L | CASE_INSENSITIVE match; schema-evolution test in CI |
| 8 | Endur Kafka topic latency > 60 s | L | M | Multi-cluster Snowpipe; Kafka tuning |
| 9 | Marketplace data subscription cost surprises | M | L | Phase 0 cost modeling; renegotiate at scale |
| 10 | Regulator request for on-prem residency | L | H | Cross-cloud replication; Iceberg export option |

### 9.8 Next Action
Schedule a 60-minute live demo where the Sales Architect walks Texas Refining executives through this SRD plus the running React UI. Snowflake's Energy Solutions engineering team will participate.

---

## 10.0 Appendix

### 10.1 Glossary
| Term | Definition |
|---|---|
| **CDU** | Crude Distillation Unit |
| **FCC** | Fluid Catalytic Cracker |
| **kbbl / kbpd** | Thousand barrels / Thousand barrels per day |
| **API** | American Petroleum Institute gravity (higher = lighter crude) |
| **RVP** | Reid Vapor Pressure (gasoline volatility) |
| **BS&W** | Basic Sediment & Water |
| **LMTD** | Log-Mean Temperature Difference |
| **LP / MILP** | Linear / Mixed-Integer Linear Programming |
| **T²** | Hotelling T-squared multivariate statistic |
| **VaR** | Value at Risk |
| **CI** | Carbon Intensity (kgCO2e/bbl) |
| **OGMP 2.0** | Oil & Gas Methane Partnership 2.0 |
| **CSRD** | Corporate Sustainability Reporting Directive (EU) |
| **MNPI** | Material Non-Public Information |
| **ZC** | Zero-Copy (Snowflake data share) |

### 10.2 Reference Architecture Diagram

```
                       TEXAS REFINING
   ┌─────────────────────────────────────────────────────────────┐
   │   OT Layer                                                  │
   │   ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐            │
   │   │Cognite │  │ Quorum │  │ Sirion │  │ Endur  │            │
   │   │ + SAP  │  │        │  │        │  │        │            │
   │   └───┬────┘  └───┬────┘  └───┬────┘  └───┬────┘            │
   │       │ZC         │SP         │SP         │SP                │
   └───────┼───────────┼───────────┼───────────┼─────────────────┘
           │           │           │           │
           ▼           ▼           ▼           ▼
   ┌──────────────────────────────────────────────────────┐
   │             SNOWFLAKE AI DATA CLOUD                  │
   │  Bronze → Silver → Gold  •  Cortex  •  Snowpark      │
   │  Horizon Catalog  •  RBAC + Masking + Row Policies   │
   └──────────────────────────┬───────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
        Operator UI      Trader Desk    Auditor/ESG
        (React Demo)     (Endur+UI)     (Horizon view)
              │
              └─── Reverse ZC/REST writeback ───▶ Cognite, Quorum
```

### 10.3 Sample Data DDL (Full)

```sql
CREATE OR REPLACE TABLE BRONZE.COGNITE_ASSETS (
  asset_id        STRING PRIMARY KEY,
  name            STRING,
  type            STRING,
  parent_asset    STRING,
  location        STRING,
  contextual_tags ARRAY
);

CREATE OR REPLACE TABLE BRONZE.COGNITE_TIME_SERIES (
  timestamp       TIMESTAMP_NTZ,
  asset_id        STRING,
  sensor_type     STRING,
  value           NUMBER(18,4),
  unit            STRING,
  contextual_tag  STRING
);

CREATE OR REPLACE TABLE BRONZE.SAP_FINANCIALS (
  transaction_id  STRING PRIMARY KEY,
  batch_id        STRING,
  cost_type       STRING,
  amount_usd      NUMBER(18,2),
  timestamp       TIMESTAMP_NTZ
);

CREATE OR REPLACE TABLE BRONZE.QUORUM_FLOWS (
  flow_id         STRING PRIMARY KEY,
  batch_id        STRING,
  product         STRING,
  volume_bbl      NUMBER(18,2),
  flow_rate_bbl_h NUMBER(18,2),
  timestamp       TIMESTAMP_NTZ
);

CREATE OR REPLACE TABLE BRONZE.SIRION_CONTRACTS (
  contract_id     STRING PRIMARY KEY,
  counterparty    STRING,
  type            STRING,
  volume_min_bbl  NUMBER(18,2),
  price_usd_bbl   NUMBER(10,4),
  expiry          DATE,
  quality_spec    STRING
);

CREATE OR REPLACE TABLE BRONZE.ENDUR_TRADES (
  trade_id        STRING PRIMARY KEY,
  batch_id        STRING,
  instrument      STRING,
  volume_bbl      NUMBER(18,2),
  price_usd_bbl   NUMBER(10,4),
  direction       STRING,
  timestamp       TIMESTAMP_NTZ
);
```

### 10.3.1 Silver / Gold Object Catalog (Excerpt)

```sql
-- Silver: cleaned, deduplicated, harmonized
CREATE OR REPLACE DYNAMIC TABLE SILVER.PUMP_FEATURES
  TARGET_LAG = '1 minute' WAREHOUSE = WH_OPS AS
SELECT
  asset_id,
  timestamp,
  AVG(value) OVER (PARTITION BY asset_id ORDER BY timestamp
                   ROWS BETWEEN 59 PRECEDING AND CURRENT ROW) AS vibration_rms_60s,
  KURTOSIS(value) OVER (PARTITION BY asset_id ORDER BY timestamp
                        ROWS BETWEEN 299 PRECEDING AND CURRENT ROW) AS vibration_kurt_300s,
  DATEDIFF('hour',
    LAG(timestamp) OVER (PARTITION BY asset_id ORDER BY timestamp),
    timestamp) AS age_h
FROM BRONZE.COGNITE_TIME_SERIES
WHERE sensor_type IN ('vibration','bearing_temp','suction_pressure','discharge_pressure','power_kw');

-- Gold: semantic, business-ready
CREATE OR REPLACE DYNAMIC TABLE GOLD.UNIT_MARGINS
  TARGET_LAG = '5 minutes' WAREHOUSE = WH_OPS AS
SELECT
  q.batch_id,
  q.product,
  q.volume_bbl,
  s.price_usd_bbl,
  q.volume_bbl * s.price_usd_bbl AS revenue_usd,
  f.amount_usd AS cost_usd,
  q.volume_bbl * s.price_usd_bbl - f.amount_usd AS margin_usd,
  CURRENT_TIMESTAMP() AS recomputed_at
FROM SILVER.QUORUM_FLOWS  q
JOIN SILVER.SIRION_CONTRACTS s ON s.product = q.product
JOIN SILVER.SAP_FINANCIALS  f USING (batch_id);
```

### 10.3.2 Cortex Analyst Semantic Model (Excerpt)

```yaml
name: refining_v1
description: Texas Refining canonical semantic model.
tables:
  - name: UNIT_MARGINS
    base_table: GOLD.UNIT_MARGINS
    primary_key: [batch_id]
    dimensions:
      - name: product
        synonyms: [stream, cut]
      - name: batch_id
    measures:
      - name: revenue_usd
        agg: SUM
      - name: cost_usd
        agg: SUM
      - name: margin_usd
        agg: SUM
  - name: PUMP_HEALTH
    base_table: GOLD.PUMP_FEATURES
    primary_key: [asset_id, timestamp]
    dimensions:
      - name: asset_id
      - name: unit
        sql: "SPLIT_PART(asset_id, '-', 1)"
    measures:
      - name: hotelling_t2
        agg: MAX
      - name: vibration_rms_60s
        agg: AVG
verified_queries:
  - name: pumps_at_risk
    question: "Which pumps have failure probability above 30% in the next 48 hours?"
    sql: |
      SELECT asset_id, failure_prob_48h
      FROM GOLD.PUMP_FORECAST
      WHERE failure_prob_48h > 0.30
      ORDER BY failure_prob_48h DESC;
```

### 10.4 Voice Library Index (ElevenLabs)

| Filename | Voice | Toolkit | Duration |
|---|---|---|---|
| `vo_pitch_slide1.mp3` | Adam | Slide 1 | 0:35 |
| `vo_pitch_slide3.mp3` | Adam | Slide 3 | 0:42 |
| `vo_pitch_slide5.mp3` | Rachel | Slide 5 | 0:35 |
| `vo_crude_blending.mp3` | Adam | 6.1.1 | 0:35 |
| `vo_yield_opt.mp3` | Rachel | 6.1.2 | 0:32 |
| `vo_energy_opt.mp3` | Adam | 6.1.3 | 0:30 |
| `vo_slate_opt.mp3` | Rachel | 6.1.4 | 0:33 |
| `vo_failure_pred.mp3` | Adam | 6.2.1 | 0:38 |
| `vo_anomaly.mp3` | Rachel | 6.2.2 | 0:30 |
| `vo_digital_twin.mp3` | Adam | 6.2.3 | 0:32 |
| `vo_recon.mp3` | Rachel | 6.3.1 | 0:32 |
| `vo_contract_track.mp3` | Adam | 6.3.2 | 0:30 |
| `vo_cashflow.mp3` | Rachel | 6.3.3 | 0:32 |
| `vo_position_recon.mp3` | Adam | 6.4.1 | 0:30 |
| `vo_var.mp3` | Rachel | 6.4.2 | 0:30 |
| `vo_counterparty.mp3` | Adam | 6.4.3 | 0:32 |
| `vo_emissions.mp3` | Rachel | 6.5.1 | 0:30 |
| `vo_methane.mp3` | Adam | 6.5.2 | 0:30 |
| `vo_esg.mp3` | Rachel | 6.5.3 | 0:32 |
| `vo_demand.mp3` | Adam | 6.6.1 | 0:30 |
| `vo_routing.mp3` | Rachel | 6.6.2 | 0:30 |
| `vo_feedstock.mp3` | Adam | 6.6.3 | 0:30 |
| `vo_analyst.mp3` | Rachel | 6.7.1 | 0:32 |
| `vo_audit.mp3` | Adam | 6.7.2 | 0:30 |

---

### 10.5 Frequently Asked Questions

**Q1. Why not stay with Cognite alone for analytics?**
Cognite is best-in-class for asset graph and OT contextualization. It is not designed for cross-domain SQL across finance, trading, contracts, and sustainability. Snowflake's zero-copy share consumes the Cognite graph without duplication, then joins it natively against SAP, Quorum, Sirion, and Endur. Cognite remains essential; Snowflake adds the reasoning surface.

**Q2. Do we have to move data into Snowflake?**
For Cognite and SAP S/4HANA (via Datasphere), no — zero-copy share means the data stays where it is and Snowflake reads a governed view. For Quorum, Sirion, and Endur, yes — but only at the event level via Snowpipe Streaming, with sub-minute latency.

**Q3. Will Cortex hallucinate when an operator asks a question?**
Cortex Analyst is constrained by the semantic model. If the model does not declare a column, Cortex will not synthesize one. Every NL→SQL answer carries the generated SQL and the result table, so the operator can verify before acting. Verified-query templates further reduce ambiguity.

**Q4. Can we run the optimization solvers without sending data out of Snowflake?**
Yes. Snowpark Container Services runs your PuLP, scikit-learn, statsmodels, and Weibull code inside the Snowflake security boundary. No egress, no shared secrets, no separate VPC.

**Q5. How do we exit if the engagement does not work out?**
All Gold tables can be exported as Parquet via `COPY INTO @stage`. Iceberg format is supported for fully open storage. Cortex models trained inside Snowflake can be replaced by equivalent open-source models (Prophet, ARIMA, IsolationForest) at <2% accuracy delta. The semantic model is a YAML file you own.

**Q6. What does the cost look like at steady state?**
Approximately 670 credits/month across compute, Cortex, and Container Services — equating to $1.0–1.7M/year depending on enterprise discount. ROI ratio versus the $13–28M margin uplift is 10×–20× in year one. See §8.3.

**Q7. How do we secure trader names and counterparty terms?**
Dynamic data masking redacts trader identifiers and counterparty names for non-trading roles. Row-access policies restrict operators to their unit's assets. Horizon Catalog auto-tags MNPI and PII columns. RBAC is reviewed quarterly. PrivateLink ensures no public endpoints.

**Q8. What happens during a Snowflake regional outage?**
Cross-region replication keeps Gold + lineage in sync to us-west-2. Failover runbook tested quarterly. RPO 15 min, RTO 1 h. Cognite and SAP zero-copy shares can be re-established to the secondary region in under 30 minutes.

**Q9. Can we extend the engine to our other refineries?**
Yes. Phase 3 in §9.4 is explicitly designed for multi-site scale-out. The semantic model parameterizes by `plant_id`; the same Cortex models and Snowpark containers work without retraining for similar configurations.

**Q10. How fast can we see real ROI?**
Phase 1 (paid PoV) targets $250K+ measured margin uplift in 4–6 weeks on the chosen use case (recommended: 6.1.1 Crude Blending). Phase 2 production rollout (months 3–5) delivers the full §6.1 + §6.2 toolkits. The headline $13–28M is the year-one range across all toolkits.

---

**End of SRD v1.3** — Texas Refining is positioned to lead the next wave of refinery optimization. Snowflake is ready to deliver measurable $13–28M in first-year value, with the React Flow + R3F demo in §7 ready to run today against your sample data.
