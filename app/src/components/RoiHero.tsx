import { Tex } from '@/lib/katex'
import { Badge } from './ui/Badge'

interface RoiBreakProps {
  label: string
  range: string
  index: string
}

export function RoiHero() {
  return (
    <div className="panel px-6 py-5 overflow-hidden">
      <span className="corner corner-tl" />
      <span className="corner corner-tr" />
      <span className="corner corner-bl" />
      <span className="corner corner-br" />

      {/* Subtle sweep accent */}
      <div className="absolute inset-y-0 -inset-x-4 pointer-events-none overflow-hidden opacity-30">
        <div className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-cyan/10 to-transparent animate-sweep" />
      </div>

      <div className="grid grid-cols-[1fr_auto] gap-10 items-center relative">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="tag">PROJECTED 1ST-YEAR ROI</span>
            <Badge tone="snow">SRD §1.0 · 200–300 kbpd benchmark</Badge>
            <Badge tone="signal">Payback 4–8 months</Badge>
            <Badge tone="copper">BATCH-20260512-001 · live</Badge>
          </div>

          <div className="font-display text-[68px] leading-[0.92] tracking-tight font-bold text-ink">
            <span className="text-ink">$13</span>
            <span className="text-ink-muted mx-1">–</span>
            <span className="text-snow">28</span>
            <span className="text-snow/60 text-[44px] align-top ml-1">M</span>
          </div>

          <div className="mt-4 grid grid-cols-4 gap-6 font-mono text-xs">
            <RoiBreak index="01" label="Margin & Yield"     range="$6–12M" />
            <RoiBreak index="02" label="Predictive Maint."  range="$4–9M"  />
            <RoiBreak index="03" label="Contract & Risk"    range="$2–4M"  />
            <RoiBreak index="04" label="ESG & Logistics"    range="$1–3M"  />
          </div>
        </div>

        <div className="text-right border-l border-edge-subtle pl-8">
          <div className="tag mb-2">CORE OBJECTIVE</div>
          <div className="text-left">
            <Tex
              display
              tex={String.raw`\max_{\mathbf{x} \geq 0} \sum_{p \in P}\bigl(R_p(\mathbf{x}) - C_p(\mathbf{x})\bigr)`}
              className="text-ink text-base"
            />
            <div className="tag mt-1 text-ink-muted">subject to</div>
            <Tex
              display
              tex={String.raw`\mathbf{A}\mathbf{x} \leq \mathbf{b}, \quad \rho(\mathbf{x}) = \rho^{*}`}
              className="text-ink-dim text-sm"
            />
          </div>
          <div className="tag mt-3 text-cyan/80">refinery LP · re-solved every 15 min</div>
        </div>
      </div>
    </div>
  )
}

function RoiBreak({ index, label, range }: RoiBreakProps) {
  return (
    <div className="border-l border-edge-subtle pl-4">
      <div className="flex items-baseline gap-2">
        <span className="text-ink-muted text-[10px]">{index}</span>
        <span className="tag">{label}</span>
      </div>
      <div className="lcd-blue text-base mt-1">{range}</div>
    </div>
  )
}
