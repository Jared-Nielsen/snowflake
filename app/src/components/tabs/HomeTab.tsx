import {
  Snowflake,
  Zap,
  Activity,
  ShieldCheck,
  Workflow,
  Layers,
  TrendingUp,
  ArrowRight,
} from 'lucide-react'
import { Panel, PanelHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useUiStore } from '@/store/uiStore'
import type { TabKey } from '@/types'

/**
 * HomeTab — long-scroll marketing & explainer landing page.
 *
 * Editorial, not technical. Tells the story of how Snowflake transforms a
 * refinery's operations, then deep-links into the 7 toolkit tabs.
 *
 * NO RoiHero strip · NO italic decorative type · matches the rest of the
 * console's flat, mono-driven design language.
 */
export function HomeTab() {
  const goTo = useUiStore((s) => s.setTab)

  return (
    <div className="px-6 pb-12 space-y-12 animate-reveal-up max-w-[1200px] mx-auto">
      {/* ────────── HERO ─────────────────────────────────────────── */}
      <section className="pt-10 pb-8 border-b border-edge-subtle">
        <div className="grid grid-cols-1 md:grid-cols-[1.05fr_1fr] gap-10 items-center">
          {/* LEFT · copy + CTA */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="led led-green animate-pulse-soft" />
              <span className="tag text-snow">LIVE DEMO · TEXAS REFINING · LEAGUE CITY · 280 KBPD</span>
            </div>
            <h1 className="font-display text-5xl leading-[1.05] font-bold tracking-tight text-snow">
              One unified data plane.
              <br />
              <span className="text-cyan">Five silos, gone.</span>
            </h1>
            <p className="mt-6 text-ink-dim text-lg leading-relaxed font-cond">
              Cognite, SAP, Quorum, Sirion and Endur arrive in one governed Snowflake
              AI Data Cloud with zero data movement. Cortex AI turns it into
              recommendations your operators and traders actually use — every
              fifteen minutes, not every shift.
            </p>
            <div className="flex flex-wrap gap-3 mt-8">
              <button
                onClick={() => goTo('margin')}
                className="group inline-flex items-center gap-2 px-5 py-3 border border-cyan bg-cyan/10 hover:bg-cyan/20 text-cyan font-cond uppercase tracking-[0.16em] text-sm font-semibold transition-colors"
              >
                Start the tour
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
              <button
                onClick={() => goTo('maintenance')}
                className="inline-flex items-center gap-2 px-5 py-3 border border-edge-strong hover:border-cyan/60 text-ink-dim hover:text-ink font-cond uppercase tracking-[0.16em] text-sm font-semibold transition-colors"
              >
                See predictive maintenance
              </button>
            </div>
          </div>

          {/* RIGHT · refinery hero image with overlays */}
          <div className="relative min-h-[260px]">
            {/* glow halo behind image */}
            <div className="absolute -inset-6 bg-cyan/10 blur-3xl pointer-events-none" />
            <div className="relative border border-edge-subtle bg-bg-base overflow-hidden">
              <img
                src="/Refinery.png"
                alt="Texas Refining · League City complex"
                className="block w-full h-auto"
              />
              {/* subtle right-edge fade so the image blends with the page bg */}
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-l from-bg-base/40 to-transparent" />

              {/* Title bar (slim, low opacity so it doesn't cover the skyline) */}
              <div className="absolute top-0 inset-x-0 z-10 flex items-center justify-center py-1.5 bg-gradient-to-b from-bg-base/70 to-transparent">
                <div className="flex items-center gap-2">
                  <span className="font-display text-snow text-base font-bold tracking-[0.32em] uppercase">
                    TEXAS
                  </span>
                  <span className="font-cond text-cyan text-sm uppercase tracking-[0.22em] font-semibold">
                    Refinery
                  </span>
                </div>
              </div>

              {/* corner ticks */}
              <span className="absolute top-0 left-0 w-3 h-3 border-t border-l border-cyan" />
              <span className="absolute top-0 right-0 w-3 h-3 border-t border-r border-cyan" />
              <span className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-cyan" />
              <span className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-cyan" />

              {/* live overlay — Snowpipe status only */}
              <div className="absolute top-11 left-3 z-10 flex items-center gap-2 panel-elev px-2.5 py-1.5">
                <span className="led led-green animate-pulse-soft" />
                <span className="font-cond text-[10px] uppercase tracking-[0.18em] text-snow">Snowpipe · live</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ────────── WHY NOW · 3 cards ────────────────────────────── */}
      <section>
        <div className="tag text-ink-muted mb-3">WHY THIS, WHY NOW</div>
        <h2 className="font-display text-3xl font-bold text-snow tracking-tight mb-8">
          Three pressures forcing the industry to change
        </h2>
        <div className="grid grid-cols-3 gap-5">
          <PressureCard
            tone="cyan"
            icon={<TrendingUp className="w-5 h-5" />}
            title="Margin compression"
            body="Crack spreads have narrowed ~18% from the 2024 peak. There is no room left for shift-cadence decisions on which crude to blend or how to run the FCC."
          />
          <PressureCard
            tone="amber"
            icon={<ShieldCheck className="w-5 h-5" />}
            title="ESG disclosure"
            body="SEC Climate and CSRD now require auditable Scope 1, 2 and 3 numbers calculated on the same data plane as operations — not in a separate annual exercise."
          />
          <PressureCard
            tone="signal"
            icon={<Zap className="w-5 h-5" />}
            title="AI is finally ready"
            body="Cortex Analyst and Cortex Agents have matured. A console operator can ask 'which pumps will fail in 48 hours and what is the margin impact' and get an answer in under five seconds."
          />
        </div>
      </section>

      {/* ────────── HOW IT WORKS · simple 4-step flow ────────────── */}
      <section>
        <div className="tag text-ink-muted mb-3">HOW IT WORKS</div>
        <h2 className="font-display text-3xl font-bold text-snow tracking-tight mb-8">
          From raw signal to operator action in fifteen minutes
        </h2>
        <div className="grid grid-cols-4 gap-3">
          {STEPS.map((s, i) => (
            <div
              key={s.code}
              className="relative bg-bg-panel/70 border border-edge-subtle p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="tag text-cyan">{s.code}</span>
                <span className="font-mono text-[10px] text-ink-muted">0{i + 1}</span>
              </div>
              <div className="font-display text-base font-bold text-snow mb-2 leading-tight">
                {s.title}
              </div>
              <div className="font-mono text-[11px] text-ink-dim leading-relaxed">
                {s.body}
              </div>
              {i < STEPS.length - 1 && (
                <ArrowRight className="hidden xl:block absolute -right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-edge-strong z-10" />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ────────── A DAY IN THE LIFE · scenario walkthrough ─────── */}
      <section>
        <div className="tag text-ink-muted mb-3">A FIFTEEN-MINUTE SCENARIO</div>
        <h2 className="font-display text-3xl font-bold text-snow tracking-tight mb-3">
          17:45 to 18:00 UTC, last Tuesday
        </h2>
        <p className="text-ink-dim font-cond text-base max-w-3xl mb-8">
          A real walkthrough using your sample data: TRADE-001 books, PUMP-401 spikes,
          and the LP solver returns an optimal blend before the next batch hits the CDU.
        </p>
        <div className="space-y-3">
          {TIMELINE.map((row) => (
            <div
              key={row.ts}
              className="grid grid-cols-[112px_1fr_120px] gap-4 items-start border-b border-edge-subtle/60 pb-3 last:border-b-0"
            >
              <div className="font-mono text-cyan text-[12px]">{row.ts}</div>
              <div>
                <div className="font-cond font-semibold text-ink text-[14px] leading-tight">
                  {row.title}
                </div>
                <div className="font-mono text-[11px] text-ink-muted mt-1 leading-relaxed">
                  {row.body}
                </div>
              </div>
              <div className="text-right">
                <Badge tone={row.badge.tone}>{row.badge.label}</Badge>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ────────── WHAT YOU CAN EXPLORE · 7 toolkits ────────────── */}
      <section>
        <div className="tag text-ink-muted mb-3">WHAT YOU CAN EXPLORE</div>
        <h2 className="font-display text-3xl font-bold text-snow tracking-tight mb-8">
          Seven toolkits, twenty-two interactive sub-modules
        </h2>
        <div className="grid grid-cols-2 gap-4">
          {TOOLKITS.map((t) => (
            <button
              key={t.key}
              onClick={() => goTo(t.key)}
              className="text-left bg-bg-panel/60 border border-edge-subtle hover:border-cyan/60 hover:bg-bg-panel/90 p-5 transition-all group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="tag text-cyan">{t.code}</span>
                <ArrowRight className="w-3.5 h-3.5 text-ink-muted group-hover:text-cyan group-hover:translate-x-0.5 transition-all" />
              </div>
              <div className="font-display text-xl font-bold text-snow tracking-tight mb-2 leading-tight">
                {t.title}
              </div>
              <div className="font-mono text-[11px] text-ink-dim mb-3 leading-relaxed">
                {t.body}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {t.tags.map((tg) => (
                  <span
                    key={tg}
                    className="font-mono text-[9px] uppercase tracking-[0.16em] text-ink-muted border border-edge-subtle px-1.5 py-0.5"
                  >
                    {tg}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ────────── PROOF · what changes vs today ───────────────── */}
      <section>
        <div className="tag text-ink-muted mb-3">WHAT CHANGES</div>
        <h2 className="font-display text-3xl font-bold text-snow tracking-tight mb-8">
          Before / After
        </h2>
        <div className="grid grid-cols-3 gap-3">
          {DELTAS.map((d) => (
            <div key={d.metric} className="bg-bg-panel/60 border border-edge-subtle p-5">
              <div className="tag text-ink-muted mb-2">{d.metric}</div>
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-ink-dim text-sm line-through decoration-flare/60">
                  {d.before}
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-cyan" />
                <span className="font-display text-2xl font-bold text-signal">
                  {d.after}
                </span>
              </div>
              <div className="font-mono text-[11px] text-ink-muted mt-2 leading-relaxed">
                {d.note}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ────────── CTA ─────────────────────────────────────────── */}
      <section className="pt-8 border-t border-edge-subtle">
        <Panel className="p-8 bg-bg-panel/80">
          <div className="flex items-center justify-between flex-wrap gap-6">
            <div>
              <div className="tag text-cyan mb-2">NEXT STEP</div>
              <div className="font-display text-2xl font-bold text-snow tracking-tight max-w-xl leading-tight">
                Start the tour and click any node in any diagram —
                you'll see live telemetry and live SQL.
              </div>
            </div>
            <button
              onClick={() => goTo('margin')}
              className="group inline-flex items-center gap-2 px-6 py-3.5 border border-cyan bg-cyan/15 hover:bg-cyan/25 text-cyan font-cond uppercase tracking-[0.16em] text-sm font-semibold transition-colors"
            >
              Open the first toolkit
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </Panel>
      </section>
    </div>
  )
}

/* ───────────────────────── helpers ──────────────────────────────── */

function PressureCard({
  tone,
  icon,
  title,
  body,
}: {
  tone: 'cyan' | 'amber' | 'signal'
  icon: React.ReactNode
  title: string
  body: string
}) {
  const toneClass =
    tone === 'cyan'   ? 'text-cyan border-cyan/40' :
    tone === 'amber'  ? 'text-amber border-amber/40' :
                        'text-signal border-signal/40'
  return (
    <div className={`relative bg-bg-panel/60 border ${toneClass} p-6`}>
      <div className={`flex items-center gap-2 mb-3 ${toneClass.split(' ')[0]}`}>
        {icon}
        <span className="font-cond text-[11px] uppercase tracking-[0.18em] font-semibold">
          {title}
        </span>
      </div>
      <p className="font-mono text-[12px] leading-relaxed text-ink-dim">{body}</p>
    </div>
  )
}

const STEPS = [
  { code: 'INGEST',   title: 'Zero-copy + Snowpipe',          body: 'Cognite + SAP arrive as governed shares. Quorum, Sirion, Endur stream in via Snowpipe. No pipelines to build.' },
  { code: 'CURATE',   title: 'Bronze → Silver → Gold',        body: 'Dynamic tables harmonize the data and publish a semantic refinery ontology Cortex can reason about.' },
  { code: 'REASON',   title: 'Cortex + Snowpark',             body: 'Forecast, anomaly detection, search, NL→SQL, plus PuLP LP and Weibull solvers in Snowpark Container Services.' },
  { code: 'ACT',      title: 'Closed-loop writeback',         body: 'Recommendations push back to Cognite events, Quorum dispatch tickets and Endur draft hedges in under 30 seconds.' },
]

const TIMELINE = [
  { ts: '17:45 UTC',  title: 'Endur trader books TRADE-001 (Crack Spread, 80 kbbl)',
    body: 'Snowpipe Streaming surfaces the trade in Snowflake Bronze in under thirty seconds.',
    badge: { label: 'PAPER',   tone: 'cyan'   as const } },
  { ts: '17:55 UTC',  title: 'PUMP-401 vibration spikes to 4.8 mm/s',
    body: 'Cognite zero-copy share surfaces the anomaly. Cortex anomaly score: 0.91. Hotelling T²: 14.2.',
    badge: { label: 'ANOMALY', tone: 'amber'  as const } },
  { ts: '17:56 UTC',  title: 'Cortex joins SAP + Quorum + Sirion + Endur',
    body: 'Landed crude cost ($1.85M on FIN-001), current yield (50% gasoline), CON-789 minimum, TRADE-001 long crack — all on one query.',
    badge: { label: 'JOIN',    tone: 'snow'   as const } },
  { ts: '17:58 UTC',  title: 'Snowpark LP returns the recommendation',
    body: 'Shift 15 kbbl to sweet crude. Derate PUMP-401 by 8 percent. Expected uplift: +$148K on this batch.',
    badge: { label: 'SOLVE',   tone: 'signal' as const } },
  { ts: '17:59 UTC',  title: 'Writeback to Cognite + Quorum',
    body: 'Recommendation posted as a Cognite event and a Quorum dispatch ticket. Operator and trader desk receive identical guidance.',
    badge: { label: 'PUSH',    tone: 'signal' as const } },
  { ts: '18:00 UTC',  title: 'Horizon lineage hash stamped',
    body: 'Every step is replayable. Auditor types one SQL statement to recover the exact data state behind the recommendation.',
    badge: { label: 'GOVERN',  tone: 'copper' as const } },
]

const TOOLKITS: { key: TabKey; code: string; title: string; body: string; tags: string[] }[] = [
  { key: 'margin',         code: '§6.1', title: 'Margin & Yield',         body: 'Crude blending, real-time yield, heat integration, slate selection.',          tags: ['LP / PuLP', 'Cortex', '15-min cadence'] },
  { key: 'maintenance',    code: '§6.2', title: 'Predictive Maintenance', body: 'PUMP-401 Weibull + Hotelling T², anomaly detection, digital twin what-if.',   tags: ['Snowpark', 'Cortex', 'Live stream'] },
  { key: 'contract',       code: '§6.3', title: 'Contract-to-Cash',       body: 'Quorum × SAP × Sirion three-way reconciliation, obligation tracking, cash-flow forecast.', tags: ['Recon', 'Cortex Forecast'] },
  { key: 'trading',        code: '§6.4', title: 'Trading & Risk',         body: 'Paper vs physical reconciliation, Monte-Carlo VaR, counterparty risk scoring.', tags: ['VaR', 'Monte Carlo', 'Sentiment'] },
  { key: 'sustainability', code: '§6.5', title: 'Sustainability',         body: 'Scope 1/2/3 emissions, methane leak detection, CSRD/IFRS disclosure pipeline.', tags: ['GHG', 'Cortex CV', 'Reporting'] },
  { key: 'logistics',      code: '§6.6', title: 'Logistics',              body: 'Tanker AIS, demand forecast, vehicle routing, berth scheduling, dispatch.',     tags: ['VRP', 'AIS', 'Cortex Forecast'] },
  { key: 'cross',          code: '§6.7', title: 'Cross-Cutting',          body: 'Cortex Analyst NL→SQL, Horizon governance, audit replay, operator copilot.',    tags: ['NL→SQL', 'Horizon', 'Agents'] },
  { key: 'devices',        code: 'CATALOG', title: 'Device Catalog',     body: '13 canonical refinery device classes with 3D models, live telemetry and process-train workflow.', tags: ['3D · R3F', 'React Flow', 'Live'] },
]

const DELTAS = [
  { metric: 'Crude blend decision',     before: '8 h shift',  after: '15 min',  note: 'LP refire every quarter-hour with live data.' },
  { metric: 'Three-way reconciliation', before: '4 days',     after: '5 min',   note: 'Quorum × SAP × Sirion as a dynamic table.' },
  { metric: 'Unplanned trips (PUMP)',   before: '6 / yr',     after: '2–3 / yr', note: 'Weibull + T² catches failures 48h ahead.' },
  { metric: 'ESG disclosure lag',       before: '30 days',    after: 'T+1',     note: 'CSRD/IFRS view signed with lineage hash.' },
  { metric: 'Operator self-service',    before: '<10 /day',   after: '>300 /day', note: 'Cortex Analyst NL→SQL.' },
  { metric: 'Audit replay',             before: 'manual',     after: 'one SQL', note: 'Horizon AT(TIMESTAMP) replay.' },
]
