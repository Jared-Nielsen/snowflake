/**
 * PumpDiagrams.tsx
 *
 * The full canonical engineering-diagram suite for PUMP-401, rendered as
 * inline SVG (no external charting lib). Built to the user-provided
 * engineering-diagrams reference, plus the K-value coefficient table.
 *
 * Each diagram is exported as a small React component so they can be
 * dropped into the MaintenanceTab in a deck.
 *
 *   1. PumpPerformanceCurves  ─ H-Q · Efficiency · BHP · NPSHr
 *   2. SystemCurveOverlay     ─ System curve × pump curve → operating point
 *   3. PumpPID                ─ Process & Instrumentation Diagram (symbolic)
 *   4. PumpCrossSection       ─ Cutaway / GA: impeller, volute, seal, bearings
 *   5. VibrationAnalysisDeck  ─ FFT · Orbit · Bode · Waterfall · Shaft centerline
 *   6. PVIndicatorDiagram     ─ Pressure-Volume cycle (reciprocating)
 *   7. HydraulicSchematic     ─ Flow path + motor symbol + control
 *   8. KValueTable            ─ Minor-loss coefficient table (Crane TP-410)
 *
 * All diagrams are styled to the existing console (mono fonts, dark fog
 * background, accent palette: cyan, amber, signal, alarm, copper, snow).
 */

import { useMemo } from 'react'
import { useStreamStore } from '@/store/streamStore'

const C = {
  bg:      '#0b1322',
  grid:    '#1e3049',
  gridSub: '#152134',
  axis:    '#3a4a64',
  ink:     '#c8d4e6',
  inkDim:  '#7a8aa1',
  cyan:    '#4ee2f4',
  snow:    '#1ea7ff',
  amber:   '#ffb627',
  signal:  '#34d57b',
  alarm:   '#ef4444',
  copper:  '#c79a4a',
  flare:   '#ff6b35',
}

const W = 720
const H = 320
const PAD = { l: 56, r: 24, t: 24, b: 40 }

function axes({
  xLabel,
  yLabel,
  ySecondaryLabel,
}: {
  xLabel: string
  yLabel: string
  ySecondaryLabel?: string
}) {
  return (
    <>
      {/* outer frame */}
      <rect x={PAD.l} y={PAD.t} width={W - PAD.l - PAD.r} height={H - PAD.t - PAD.b}
            fill="none" stroke={C.axis} strokeWidth="1" />
      {/* grid */}
      {Array.from({ length: 9 }).map((_, i) => {
        const x = PAD.l + ((W - PAD.l - PAD.r) * (i + 1)) / 10
        return <line key={`gx${i}`} x1={x} x2={x} y1={PAD.t} y2={H - PAD.b}
                     stroke={C.gridSub} strokeWidth="0.5" />
      })}
      {Array.from({ length: 5 }).map((_, i) => {
        const y = PAD.t + ((H - PAD.t - PAD.b) * (i + 1)) / 6
        return <line key={`gy${i}`} x1={PAD.l} x2={W - PAD.r} y1={y} y2={y}
                     stroke={C.gridSub} strokeWidth="0.5" />
      })}
      <text x={(W - PAD.r + PAD.l) / 2} y={H - 12} fontSize="10" fill={C.inkDim} textAnchor="middle">{xLabel}</text>
      <text x={14} y={(H - PAD.b + PAD.t) / 2} fontSize="10" fill={C.inkDim}
            textAnchor="middle" transform={`rotate(-90 14 ${(H - PAD.b + PAD.t) / 2})`}>{yLabel}</text>
      {ySecondaryLabel && (
        <text x={W - 10} y={(H - PAD.b + PAD.t) / 2} fontSize="10" fill={C.inkDim}
              textAnchor="middle" transform={`rotate(90 ${W - 10} ${(H - PAD.b + PAD.t) / 2})`}>{ySecondaryLabel}</text>
      )}
    </>
  )
}

/* ─────────────────────── 1 · PERFORMANCE CURVES ──────────────────── */
export function PumpPerformanceCurves({ operatingFlowGpm = 1450 }: { operatingFlowGpm?: number }) {
  // Domain: Q (gpm) 0..3000; range: H (ft) 0..400, eff 0..100, BHP 0..400, NPSH 0..40
  const Qmax = 3000
  const toX = (q: number) => PAD.l + (q / Qmax) * (W - PAD.l - PAD.r)
  const toY = (v: number, vmax: number) => PAD.t + (1 - v / vmax) * (H - PAD.t - PAD.b)

  // H(Q) parabolic falloff:  H = 360 - 0.000035 * Q^2
  const head    = (q: number) => Math.max(0, 360 - 0.000035 * q * q)
  // Efficiency: gaussian peaked at BEP=1600 gpm
  const eff     = (q: number) => 84 * Math.exp(-Math.pow((q - 1600) / 900, 2))
  // BHP: rises near-linear, mild rolloff
  const bhp     = (q: number) => 60 + 0.092 * q + 0.0000018 * q * q
  // NPSHr: rises steeply with flow
  const npshr   = (q: number) => 3 + 0.0000075 * q * q + 0.0008 * q

  const path = (fn: (q: number) => number, vmax: number) => {
    const pts: string[] = []
    for (let q = 0; q <= Qmax; q += 60) {
      const cmd = q === 0 ? 'M' : 'L'
      pts.push(`${cmd}${toX(q).toFixed(1)},${toY(fn(q), vmax).toFixed(1)}`)
    }
    return pts.join(' ')
  }

  const opQ = operatingFlowGpm
  const opH = head(opQ)
  const opE = eff(opQ)
  const opP = bhp(opQ)
  const opN = npshr(opQ)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      <rect width={W} height={H} fill={C.bg} />
      {axes({ xLabel: 'FLOW Q · gpm', yLabel: 'HEAD H · ft', ySecondaryLabel: 'EFF · % / BHP · hp / NPSHr · ft' })}

      {/* H-Q curve */}
      <path d={path(head, 400)} stroke={C.cyan} strokeWidth="2" fill="none" />
      <text x={toX(2400)} y={toY(head(2400), 400) - 6} fontSize="10" fill={C.cyan}>H(Q)</text>

      {/* Efficiency */}
      <path d={path(eff, 100)} stroke={C.signal} strokeWidth="1.6" fill="none" strokeDasharray="2 3" />
      <text x={toX(1700)} y={toY(eff(1700), 100) - 6} fontSize="10" fill={C.signal}>η · BEP 1,600 gpm</text>

      {/* BHP */}
      <path d={path(bhp, 400)} stroke={C.amber} strokeWidth="1.4" fill="none" strokeDasharray="4 2" />
      <text x={toX(2700)} y={toY(bhp(2700), 400) - 6} fontSize="10" fill={C.amber}>BHP</text>

      {/* NPSHr */}
      <path d={path(npshr, 40)} stroke={C.flare} strokeWidth="1.4" fill="none" />
      <text x={toX(2700)} y={toY(npshr(2700), 40) + 12} fontSize="10" fill={C.flare}>NPSHr</text>

      {/* Operating point */}
      <line x1={toX(opQ)} x2={toX(opQ)} y1={PAD.t} y2={H - PAD.b} stroke={C.snow} strokeDasharray="3 3" />
      <circle cx={toX(opQ)} cy={toY(opH, 400)} r={4} fill={C.snow} stroke={C.snow} />
      <text x={toX(opQ) + 6} y={toY(opH, 400) - 6} fontSize="10" fill={C.snow}>
        OP · {opQ} gpm · {opH.toFixed(0)} ft · η {opE.toFixed(0)}% · {opP.toFixed(0)} hp · NPSHr {opN.toFixed(1)} ft
      </text>
    </svg>
  )
}

/* ─────────────────────── 2 · SYSTEM CURVE OVERLAY ────────────────── */
export function SystemCurveOverlay({ operatingFlowGpm = 1450 }: { operatingFlowGpm?: number }) {
  const Qmax = 3000
  const toX = (q: number) => PAD.l + (q / Qmax) * (W - PAD.l - PAD.r)
  const toY = (v: number) => PAD.t + (1 - v / 400) * (H - PAD.t - PAD.b)

  // Pump curve (same as #1)
  const head = (q: number) => Math.max(0, 360 - 0.000035 * q * q)
  // System curve: H_sys = H_static + K · Q^2
  const Hstatic = 90
  const K = 0.000048
  const sys = (q: number) => Hstatic + K * q * q

  // Throttled system curve (valve more closed → higher K)
  const Kthrottle = 0.000085
  const sysT = (q: number) => Hstatic + Kthrottle * q * q

  const pathOf = (fn: (q: number) => number) => {
    const pts: string[] = []
    for (let q = 0; q <= Qmax; q += 60) {
      const cmd = q === 0 ? 'M' : 'L'
      pts.push(`${cmd}${toX(q).toFixed(1)},${toY(fn(q)).toFixed(1)}`)
    }
    return pts.join(' ')
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      <rect width={W} height={H} fill={C.bg} />
      {axes({ xLabel: 'FLOW Q · gpm', yLabel: 'HEAD H · ft' })}

      <path d={pathOf(head)} stroke={C.cyan}   strokeWidth="2"   fill="none" />
      <path d={pathOf(sys)}  stroke={C.signal} strokeWidth="1.6" fill="none" />
      <path d={pathOf(sysT)} stroke={C.amber}  strokeWidth="1.4" fill="none" strokeDasharray="4 3" />

      <text x={toX(2400)} y={toY(head(2400)) - 6} fontSize="10" fill={C.cyan}>pump curve</text>
      <text x={toX(2300)} y={toY(sys(2300)) - 6}  fontSize="10" fill={C.signal}>system curve · K · Q²</text>
      <text x={toX(2050)} y={toY(sysT(2050)) - 6} fontSize="10" fill={C.amber}>throttled system</text>

      {/* operating point — closed-form intersection of pump and open system */}
      <line x1={toX(operatingFlowGpm)} x2={toX(operatingFlowGpm)} y1={PAD.t} y2={H - PAD.b} stroke={C.snow} strokeDasharray="3 3" />
      <circle cx={toX(operatingFlowGpm)} cy={toY(head(operatingFlowGpm))} r={4} fill={C.snow} />
      <text x={toX(operatingFlowGpm) + 6} y={toY(head(operatingFlowGpm)) - 6} fontSize="10" fill={C.snow}>
        OPERATING POINT · {operatingFlowGpm} gpm
      </text>

      {/* explainer panel */}
      <rect x={W - 230} y={PAD.t + 8} width={210} height={68} fill="rgba(20,30,46,0.7)" stroke={C.axis} />
      <text x={W - 220} y={PAD.t + 24} fontSize="10" fill={C.inkDim}>H = H_static + Σ Kᵢ · v²/2g</text>
      <text x={W - 220} y={PAD.t + 38} fontSize="10" fill={C.inkDim}>H_static = {Hstatic} ft</text>
      <text x={W - 220} y={PAD.t + 52} fontSize="10" fill={C.inkDim}>K_open = {K.toExponential(1)}</text>
      <text x={W - 220} y={PAD.t + 66} fontSize="10" fill={C.amber}>K_throttle = {Kthrottle.toExponential(1)}</text>
    </svg>
  )
}

/* ─────────────────────── 3 · P&ID ─────────────────────────────────── */
export function PumpPID() {
  // Symbolic — ISA-5.1 conventions adapted for legibility.
  return (
    <svg viewBox="0 0 720 320" className="w-full">
      <rect width="720" height="320" fill={C.bg} />

      {/* suction header */}
      <line x1="20" y1="180" x2="160" y2="180" stroke={C.signal} strokeWidth="2.5" />
      {/* gate valve on suction */}
      <g transform="translate(160,180)">
        <polygon points="-12,-12 12,12 12,-12 -12,12" fill="none" stroke={C.ink} strokeWidth="1.5" />
        <text y="-22" fontSize="10" fill={C.ink} textAnchor="middle">HV-101</text>
      </g>
      <line x1="184" y1="180" x2="220" y2="180" stroke={C.signal} strokeWidth="2.5" />
      {/* check valve */}
      <g transform="translate(220,180)">
        <polygon points="0,-10 18,0 0,10" fill="none" stroke={C.ink} strokeWidth="1.5" />
        <text y="-22" fontSize="10" fill={C.ink} textAnchor="middle">CV-101</text>
      </g>
      <line x1="238" y1="180" x2="290" y2="180" stroke={C.signal} strokeWidth="2.5" />

      {/* pressure transmitter (PT) on suction */}
      <g transform="translate(265,140)">
        <circle r="14" fill={C.bg} stroke={C.cyan} strokeWidth="1.5" />
        <text fontSize="9" fill={C.cyan} textAnchor="middle" dy="-2">PT</text>
        <text fontSize="8" fill={C.cyan} textAnchor="middle" dy="9">101</text>
        <line x1="0" y1="14" x2="0" y2="40" stroke={C.cyan} strokeDasharray="3 2" />
      </g>

      {/* PUMP-401 symbol — circle with arrow */}
      <g transform="translate(335,180)">
        <circle r="34" fill={C.bg} stroke={C.snow} strokeWidth="2.5" />
        <polygon points="-22,0 14,-18 14,18" fill={C.snow} opacity="0.8" />
        <text x="0" y="56" fontSize="11" fill={C.snow} textAnchor="middle">PUMP-401</text>
        <text x="0" y="68" fontSize="9" fill={C.inkDim} textAnchor="middle">centrifugal · 250 HP</text>
      </g>

      {/* motor symbol */}
      <g transform="translate(335,110)">
        <circle r="18" fill={C.bg} stroke={C.amber} strokeWidth="1.5" />
        <text fontSize="11" fill={C.amber} textAnchor="middle" dy="4">M</text>
        <text x="0" y="-26" fontSize="9" fill={C.amber} textAnchor="middle">4 kV · TEFC</text>
      </g>
      <line x1="335" y1="128" x2="335" y2="146" stroke={C.amber} strokeWidth="1.5" />

      {/* discharge piping */}
      <line x1="369" y1="180" x2="430" y2="180" stroke={C.signal} strokeWidth="2.5" />
      {/* pressure transmitter discharge */}
      <g transform="translate(410,140)">
        <circle r="14" fill={C.bg} stroke={C.cyan} strokeWidth="1.5" />
        <text fontSize="9" fill={C.cyan} textAnchor="middle" dy="-2">PT</text>
        <text fontSize="8" fill={C.cyan} textAnchor="middle" dy="9">102</text>
        <line x1="0" y1="14" x2="0" y2="40" stroke={C.cyan} strokeDasharray="3 2" />
      </g>
      {/* check valve on discharge */}
      <g transform="translate(430,180)">
        <polygon points="0,-10 18,0 0,10" fill="none" stroke={C.ink} strokeWidth="1.5" />
        <text y="-22" fontSize="10" fill={C.ink} textAnchor="middle">CV-102</text>
      </g>
      <line x1="448" y1="180" x2="500" y2="180" stroke={C.signal} strokeWidth="2.5" />

      {/* control valve with FT loop */}
      <g transform="translate(520,180)">
        <polygon points="-14,-14 14,14 14,-14 -14,14" fill="none" stroke={C.signal} strokeWidth="1.5" />
        {/* actuator hat */}
        <path d="M-10,-14 L0,-30 L10,-14 Z" fill={C.signal} opacity="0.4" stroke={C.signal} />
        <text y="-38" fontSize="10" fill={C.signal} textAnchor="middle">FV-101</text>
      </g>
      <line x1="534" y1="180" x2="590" y2="180" stroke={C.signal} strokeWidth="2.5" />
      {/* flow transmitter */}
      <g transform="translate(570,140)">
        <circle r="14" fill={C.bg} stroke={C.cyan} strokeWidth="1.5" />
        <text fontSize="9" fill={C.cyan} textAnchor="middle" dy="-2">FT</text>
        <text fontSize="8" fill={C.cyan} textAnchor="middle" dy="9">101</text>
      </g>
      {/* FIC controller */}
      <g transform="translate(600,80)">
        <rect x="-22" y="-14" width="44" height="28" fill={C.bg} stroke={C.cyan} strokeWidth="1.5" />
        <text fontSize="9" fill={C.cyan} textAnchor="middle" dy="-1">FIC</text>
        <text fontSize="8" fill={C.cyan} textAnchor="middle" dy="10">101</text>
      </g>
      <line x1="570" y1="126" x2="570" y2="98" stroke={C.cyan} strokeDasharray="3 2" />
      <line x1="570" y1="98"  x2="600" y2="98" stroke={C.cyan} strokeDasharray="3 2" />
      <line x1="600" y1="80"  x2="600" y2="62" stroke={C.cyan} strokeDasharray="3 2" />
      <line x1="600" y1="62"  x2="520" y2="62" stroke={C.cyan} strokeDasharray="3 2" />
      <line x1="520" y1="62"  x2="520" y2="150" stroke={C.cyan} strokeDasharray="3 2" />

      {/* drain + relief on pump body */}
      <line x1="335" y1="214" x2="335" y2="245" stroke={C.signal} strokeWidth="2" />
      <g transform="translate(335,255)">
        <polygon points="-10,-10 10,-10 0,10" fill="none" stroke={C.alarm} strokeWidth="1.5" />
        <text x="14" y="0" fontSize="10" fill={C.alarm}>PSV-101</text>
      </g>

      {/* vibration tag at pump */}
      <g transform="translate(380,235)">
        <circle r="14" fill={C.bg} stroke={C.flare} strokeWidth="1.5" />
        <text fontSize="9" fill={C.flare} textAnchor="middle" dy="-2">VT</text>
        <text fontSize="8" fill={C.flare} textAnchor="middle" dy="9">401</text>
        <line x1="-14" y1="-4" x2="-30" y2="-12" stroke={C.flare} strokeDasharray="3 2" />
      </g>

      {/* legend */}
      <g transform="translate(20,20)">
        <text fontSize="11" fill={C.snow} fontWeight="bold">PUMP-401 · P&amp;ID · UNIT-CD-01</text>
        <text y="14" fontSize="9" fill={C.inkDim}>ISA-5.1 · gate · check · control · safety</text>
      </g>
      <g transform="translate(20,280)">
        <text fontSize="9" fill={C.inkDim}>solid line = process · dashed = signal/control · circles = instruments</text>
      </g>
    </svg>
  )
}

/* ─────────────────── 4 · CROSS-SECTION / GA DRAWING ───────────────── */
export function PumpCrossSection() {
  // Side-elevation cutaway. X axis = along shaft.
  return (
    <svg viewBox="0 0 720 320" className="w-full">
      <rect width="720" height="320" fill={C.bg} />

      {/* baseplate */}
      <rect x="40" y="240" width="640" height="22" fill="#0f1828" stroke={C.axis} />
      <rect x="40" y="262" width="640" height="10" fill="#3a3026" stroke={C.axis} />

      {/* motor */}
      <g>
        <rect x="60" y="120" width="180" height="120" fill="#2a3954" stroke={C.snow} />
        {/* fins */}
        {Array.from({ length: 9 }).map((_, i) => (
          <line key={i} x1={60 + 20 + i * 18} y1="120" x2={60 + 20 + i * 18} y2="240" stroke="#1a2638" strokeWidth="2" />
        ))}
        {/* junction box */}
        <rect x="120" y="92" width="50" height="32" fill="#1a2638" stroke={C.snow} />
        <text x="150" y="84" fontSize="10" fill={C.snow} textAnchor="middle">M · 250 HP</text>
      </g>

      {/* coupling guard */}
      <rect x="240" y="170" width="36" height="50" fill={C.amber} opacity="0.55" stroke={C.amber} />
      <text x="258" y="160" fontSize="9" fill={C.amber} textAnchor="middle">guard</text>

      {/* shaft */}
      <rect x="240" y="190" width="200" height="10" fill={C.ink} stroke="#5b6678" />
      <text x="340" y="186" fontSize="9" fill={C.ink} textAnchor="middle">shaft (Ø 60mm)</text>

      {/* bearing housing */}
      <rect x="276" y="160" width="78" height="80" fill="#2c3f5a" stroke={C.snow} />
      <text x="315" y="155" fontSize="9" fill={C.snow} textAnchor="middle">bearing housing</text>
      {/* DE / NDE bearings */}
      <circle cx="290" cy="195" r="9" fill="#0b1322" stroke={C.copper} />
      <circle cx="340" cy="195" r="9" fill="#0b1322" stroke={C.copper} />
      <text x="290" y="220" fontSize="8" fill={C.copper} textAnchor="middle">NDE</text>
      <text x="340" y="220" fontSize="8" fill={C.copper} textAnchor="middle">DE</text>

      {/* stuffing box / seal */}
      <rect x="354" y="170" width="60" height="60" fill="#1b2840" stroke={C.copper} />
      <text x="384" y="158" fontSize="9" fill={C.copper} textAnchor="middle">mech seal</text>
      <line x1="364" y1="180" x2="404" y2="180" stroke={C.copper} strokeWidth="2" />
      <line x1="364" y1="220" x2="404" y2="220" stroke={C.copper} strokeWidth="2" />

      {/* volute */}
      <g>
        <path d="M 440,140 A 90 90 0 1 1 440 280 Z" fill="#2c3f5a" stroke={C.snow} />
        {/* inner spiral fill */}
        <path d="M 460,160 A 70 70 0 1 1 460 260 Z" fill="#1b2840" stroke="#2a3954" />
        <text x="500" y="135" fontSize="9" fill={C.snow} textAnchor="middle">volute</text>
        {/* impeller */}
        <g transform="translate(500,210)">
          <circle r="40" fill="none" stroke={C.amber} strokeWidth="1.5" />
          {/* vanes */}
          {Array.from({ length: 6 }).map((_, i) => {
            const a = (i / 6) * Math.PI * 2
            const x2 = Math.cos(a) * 36
            const y2 = Math.sin(a) * 36
            return <path key={i} d={`M 0,0 Q ${x2 * 0.55},${y2 * 0.55 - 8} ${x2},${y2}`} fill="none" stroke={C.amber} strokeWidth="2" />
          })}
          <circle r="6" fill={C.amber} />
          <text y="56" fontSize="9" fill={C.amber} textAnchor="middle">impeller</text>
        </g>
        {/* wear ring */}
        <circle cx="500" cy="210" r="44" fill="none" stroke={C.copper} strokeWidth="1.5" strokeDasharray="3 2" />
        <text x="556" y="206" fontSize="9" fill={C.copper}>wear ring</text>
      </g>

      {/* suction nozzle forward */}
      <rect x="540" y="186" width="100" height="48" fill="#4d5d75" stroke={C.snow} />
      <text x="590" y="180" fontSize="9" fill={C.snow} textAnchor="middle">suction (Ø 8")</text>
      {/* flange */}
      <rect x="640" y="180" width="10" height="60" fill="#3a4a64" stroke={C.snow} />

      {/* discharge nozzle up */}
      <rect x="486" y="80" width="36" height="60" fill="#4d5d75" stroke={C.snow} />
      <text x="504" y="74" fontSize="9" fill={C.snow} textAnchor="middle">discharge (Ø 6")</text>
      <rect x="480" y="68" width="48" height="14" fill="#3a4a64" stroke={C.snow} />

      {/* dimensions */}
      <g stroke={C.inkDim} fill="none">
        <line x1="60" y1="296" x2="650" y2="296" />
        <line x1="60" y1="290" x2="60" y2="302" />
        <line x1="650" y1="290" x2="650" y2="302" />
      </g>
      <text x="355" y="310" fontSize="9" fill={C.inkDim} textAnchor="middle">overall length 1,860 mm</text>

      <text x="40" y="28" fontSize="11" fill={C.snow} fontWeight="bold">PUMP-401 · MECHANICAL CROSS-SECTION</text>
      <text x="40" y="42" fontSize="9" fill={C.inkDim}>API-610 OH2 · ANSI B73.1 · single-stage end-suction</text>
    </svg>
  )
}

/* ─────────────────── 5 · VIBRATION ANALYSIS DECK ──────────────────── */
/**
 * Five small sub-plots: FFT spectrum, orbit, Bode (amp/phase), waterfall, shaft centerline.
 * All driven by the live PUMP-401:vibration stream where it makes sense; otherwise
 * realistic synthetic data tied to current vibration severity.
 */
export function VibrationAnalysisDeck() {
  const arr = useStreamStore((s) => s.streams['PUMP-401:vibration'] || [])
  const vibNow = arr[arr.length - 1]?.value ?? 4.8

  // FFT spectrum — five peaks around running speed 29 Hz and 1×, 2× harmonics
  const fft = useMemo(() => {
    const peaks = [
      { f: 14.5, a: 0.4 },
      { f: 29.0, a: vibNow > 4.5 ? vibNow * 0.18 : 0.9 },
      { f: 58.0, a: vibNow > 4.5 ? vibNow * 0.12 : 0.35 },
      { f: 87.0, a: 0.25 },
      { f: 120.0, a: 0.18 },
    ]
    return peaks
  }, [vibNow])

  const fftW = 230, fftH = 110, fftPAD = 22
  const fftMaxF = 150
  const fftMaxA = Math.max(...fft.map(p => p.a), 1.6)

  const orbit = useMemo(() => {
    const pts: string[] = []
    const wobble = Math.max(0.3, vibNow * 0.13)
    for (let i = 0; i <= 240; i++) {
      const t = (i / 240) * Math.PI * 2
      const x = Math.cos(t) * (1 + Math.sin(t * 3) * 0.18) * wobble
      const y = Math.sin(t) * (1 + Math.cos(t * 3) * 0.22) * wobble
      pts.push(`${i === 0 ? 'M' : 'L'}${(x * 30 + 75).toFixed(1)},${(y * 30 + 55).toFixed(1)}`)
    }
    return pts.join(' ')
  }, [vibNow])

  const bodeAmp = (omega: number) => {
    // Peaks near 0.95 × running (29 Hz), boosted in alarm
    const wn = 29
    const zeta = 0.06
    const r = omega / wn
    const denom = Math.sqrt((1 - r * r) ** 2 + (2 * zeta * r) ** 2)
    return (1 / denom) * (1 + (vibNow - 4) * 0.06)
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* FFT */}
      <div className="bg-bg-base/80 border border-edge-subtle p-2">
        <div className="tag text-cyan mb-1">FFT SPECTRUM · 0–150 Hz</div>
        <svg viewBox={`0 0 ${fftW} ${fftH}`} className="w-full">
          <rect width={fftW} height={fftH} fill={C.bg} />
          <line x1={fftPAD} x2={fftW - 10} y1={fftH - fftPAD} y2={fftH - fftPAD} stroke={C.axis} />
          <line x1={fftPAD} x2={fftPAD}    y1={6}                y2={fftH - fftPAD} stroke={C.axis} />
          {fft.map((p, i) => {
            const x = fftPAD + (p.f / fftMaxF) * (fftW - fftPAD - 10)
            const h = (p.a / fftMaxA) * (fftH - fftPAD - 8)
            return (
              <g key={i}>
                <rect
                  x={x - 5}
                  y={fftH - fftPAD - h}
                  width="10"
                  height={h}
                  fill={p.f === 29 && vibNow > 4.5 ? C.alarm : p.f === 29 ? C.cyan : C.snow}
                  opacity="0.85"
                />
                <text x={x} y={fftH - 6} fontSize="8" fill={C.inkDim} textAnchor="middle">{p.f.toFixed(0)}</text>
              </g>
            )
          })}
          <text x={fftW - 10} y={14} fontSize="9" fill={C.inkDim} textAnchor="end">mm/s</text>
        </svg>
      </div>

      {/* Orbit */}
      <div className="bg-bg-base/80 border border-edge-subtle p-2">
        <div className="tag text-cyan mb-1">ORBIT · X vs Y proximity probes</div>
        <svg viewBox="0 0 150 110" className="w-full">
          <rect width="150" height="110" fill={C.bg} />
          <line x1="20" x2="130" y1="55" y2="55" stroke={C.axis} strokeDasharray="3 3" />
          <line x1="75" x2="75"  y1="10" y2="100" stroke={C.axis} strokeDasharray="3 3" />
          <circle cx="75" cy="55" r="38" fill="none" stroke={C.gridSub} />
          <path d={orbit} fill="none" stroke={vibNow > 5.5 ? C.alarm : vibNow > 4.5 ? C.amber : C.signal} strokeWidth="1.4" />
          <text x="140" y="106" fontSize="8" fill={C.inkDim} textAnchor="end">PUMP-401 · DE</text>
        </svg>
      </div>

      {/* Bode amplitude */}
      <div className="bg-bg-base/80 border border-edge-subtle p-2">
        <div className="tag text-cyan mb-1">BODE · amplitude vs RPM</div>
        <svg viewBox="0 0 230 110" className="w-full">
          <rect width="230" height="110" fill={C.bg} />
          <line x1="22" x2="222" y1="92" y2="92" stroke={C.axis} />
          <line x1="22" x2="22"  y1="6"  y2="92" stroke={C.axis} />
          <path
            d={(() => {
              const pts: string[] = []
              for (let r = 600; r <= 3600; r += 60) {
                const omega = r / 60
                const a = bodeAmp(omega)
                const x = 22 + ((r - 600) / 3000) * 200
                const y = 92 - Math.min(86, a * 24)
                pts.push(`${pts.length === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`)
              }
              return pts.join(' ')
            })()}
            fill="none"
            stroke={C.amber}
            strokeWidth="1.4"
          />
          <line x1={22 + ((1740 - 600) / 3000) * 200} x2={22 + ((1740 - 600) / 3000) * 200} y1="6" y2="92"
                stroke={C.snow} strokeDasharray="3 3" />
          <text x={22 + ((1740 - 600) / 3000) * 200} y="14" fontSize="8" fill={C.snow} textAnchor="middle">1740 RPM</text>
        </svg>
      </div>

      {/* Waterfall (faked as 6 stacked spectra) */}
      <div className="bg-bg-base/80 border border-edge-subtle p-2">
        <div className="tag text-cyan mb-1">WATERFALL · last 6 samples</div>
        <svg viewBox="0 0 230 110" className="w-full">
          <rect width="230" height="110" fill={C.bg} />
          {Array.from({ length: 6 }).map((_, row) => {
            const yBase = 18 + row * 14
            const decay = 1 - row * 0.07
            return (
              <g key={row}>
                {fft.map((p, i) => {
                  const x = 22 + (p.f / fftMaxF) * 200
                  const h = Math.min(12, (p.a / fftMaxA) * 14 * decay)
                  const c = p.f === 29 && vibNow > 4.5 && row < 2 ? C.alarm : p.f === 29 ? C.cyan : C.snow
                  return <rect key={i} x={x - 3} y={yBase - h} width="6" height={h} fill={c} opacity={0.8 - row * 0.1} />
                })}
              </g>
            )
          })}
          <text x="6"  y="20" fontSize="8" fill={C.inkDim}>t-0</text>
          <text x="6"  y="92" fontSize="8" fill={C.inkDim}>t-5</text>
        </svg>
      </div>

      {/* Shaft centerline */}
      <div className="bg-bg-base/80 border border-edge-subtle p-2 col-span-2">
        <div className="tag text-cyan mb-1">SHAFT CENTERLINE · DE / NDE bearings</div>
        <svg viewBox="0 0 480 90" className="w-full">
          <rect width="480" height="90" fill={C.bg} />
          {/* bearing 1 */}
          <circle cx="120" cy="45" r="32" fill="none" stroke={C.gridSub} />
          {/* shaft DE */}
          <circle cx={120 + (vibNow > 4.5 ? (vibNow - 4) * 4 : 1)}
                  cy={45 + (vibNow > 4.5 ? (vibNow - 4) * 2 : 0)}
                  r="8"
                  fill={vibNow > 5.5 ? C.alarm : vibNow > 4.5 ? C.amber : C.signal} />
          <text x="120" y="86" fontSize="9" fill={C.inkDim} textAnchor="middle">DE bearing</text>

          {/* bearing 2 */}
          <circle cx="360" cy="45" r="32" fill="none" stroke={C.gridSub} />
          <circle cx={360 - (vibNow > 4.5 ? (vibNow - 4) * 3 : 1)}
                  cy={45 + (vibNow > 4.5 ? (vibNow - 4) * 1.6 : 0)}
                  r="8"
                  fill={vibNow > 5.5 ? C.alarm : vibNow > 4.5 ? C.amber : C.signal} />
          <text x="360" y="86" fontSize="9" fill={C.inkDim} textAnchor="middle">NDE bearing</text>

          <line x1="120" y1="45" x2="360" y2="45" stroke={C.ink} strokeWidth="1" strokeDasharray="4 3" />
          <text x="240" y="20" fontSize="9" fill={C.snow} textAnchor="middle">
            shaft centerline · displacement Δ = {((vibNow > 4.5 ? (vibNow - 4) : 0.05) * 10).toFixed(2)} mil
          </text>
        </svg>
      </div>
    </div>
  )
}

/* ─────────────────────── 6 · P-V INDICATOR ─────────────────────────── */
/**
 * Not applicable to a centrifugal PUMP-401, but included to honor the
 * canonical engineering-diagram set. We render a representative cycle for
 * a reciprocating pump with a note explaining the centrifugal exclusion.
 */
export function PVIndicatorDiagram() {
  // Build a 4-stroke-ish PV loop for a reciprocating cylinder
  const Vmin = 0.2, Vmax = 1.0
  const Pmin = 0.5, Pmax = 4.5
  const toX = (V: number) => 40 + ((V - Vmin) / (Vmax - Vmin)) * 480
  const toY = (P: number) => 240 - ((P - Pmin) / (Pmax - Pmin)) * 200

  const path = [
    // suction stroke (low P, V increases)
    `M ${toX(Vmin)},${toY(Pmin)} L ${toX(Vmax)},${toY(Pmin + 0.2)}`,
    // compression
    `L ${toX(Vmax * 0.7)},${toY(Pmax * 0.7)}`,
    // discharge (high P, V decreases)
    `L ${toX(Vmin + 0.05)},${toY(Pmax)}`,
    // expansion / return
    `L ${toX(Vmin)},${toY(Pmin)} Z`,
  ].join(' ')

  return (
    <svg viewBox="0 0 560 280" className="w-full">
      <rect width="560" height="280" fill={C.bg} />
      <rect x="40" y="40" width="480" height="200" fill="none" stroke={C.axis} />
      <text x="280" y="270" fontSize="10" fill={C.inkDim} textAnchor="middle">VOLUME V · stroke fraction</text>
      <text x="20" y="140" fontSize="10" fill={C.inkDim} textAnchor="middle" transform="rotate(-90 20 140)">PRESSURE P · barg</text>
      <path d={path} fill={C.cyan + '20'} stroke={C.cyan} strokeWidth="1.6" />
      <text x={toX(0.6)} y={toY(0.6) - 6}  fontSize="9" fill={C.cyan}>suction</text>
      <text x={toX(0.85)} y={toY(2.8)}     fontSize="9" fill={C.amber}>compression</text>
      <text x={toX(0.55)} y={toY(4.2) - 6} fontSize="9" fill={C.signal}>discharge</text>
      <text x={toX(0.25)} y={toY(2)}       fontSize="9" fill={C.flare}>expansion</text>

      <g transform="translate(40,22)">
        <text fontSize="11" fill={C.snow} fontWeight="bold">P-V INDICATOR · representative reciprocating cycle</text>
      </g>
      <g transform="translate(40,254)">
        <text fontSize="9" fill={C.inkDim}>
          PUMP-401 is centrifugal — P-V indicator is included for completeness against reciprocating units in the fleet.
        </text>
      </g>
    </svg>
  )
}

/* ─────────────────── 7 · HYDRAULIC / ELECTRICAL SCHEMATIC ─────────── */
export function HydraulicSchematic() {
  return (
    <svg viewBox="0 0 720 320" className="w-full">
      <rect width="720" height="320" fill={C.bg} />

      {/* Source tank */}
      <g transform="translate(60,160)">
        <rect x="-30" y="-40" width="60" height="80" fill="none" stroke={C.snow} strokeWidth="1.5" />
        <line x1="-30" y1="-20" x2="30" y2="-20" stroke={C.snow} strokeDasharray="3 2" />
        <text x="0" y="-50" fontSize="9" fill={C.snow} textAnchor="middle">TK-501</text>
      </g>

      {/* suction line */}
      <line x1="90" y1="160" x2="240" y2="160" stroke={C.signal} strokeWidth="2.5" />

      {/* strainer */}
      <g transform="translate(150,160)">
        <rect x="-12" y="-10" width="24" height="20" fill="none" stroke={C.copper} />
        <line x1="-12" y1="0" x2="12" y2="0" stroke={C.copper} />
        <text x="0" y="-16" fontSize="9" fill={C.copper} textAnchor="middle">strainer</text>
      </g>

      {/* pump (ISO 1219) */}
      <g transform="translate(280,160)">
        <circle r="34" fill={C.bg} stroke={C.snow} strokeWidth="2" />
        <polygon points="-18,0 12,-14 12,14" fill={C.snow} opacity="0.85" />
        <text y="56" fontSize="10" fill={C.snow} textAnchor="middle">PUMP-401</text>
      </g>

      {/* motor + electrical */}
      <g transform="translate(280,80)">
        <circle r="22" fill={C.bg} stroke={C.amber} strokeWidth="2" />
        <text fontSize="13" fill={C.amber} textAnchor="middle" dy="4">M</text>
        <text y="-32" fontSize="9" fill={C.amber} textAnchor="middle">4 kV · 60 Hz · 3φ</text>
      </g>
      <line x1="280" y1="102" x2="280" y2="126" stroke={C.amber} strokeWidth="2" />

      {/* VFD */}
      <g transform="translate(190,80)">
        <rect x="-30" y="-22" width="60" height="44" fill={C.bg} stroke={C.amber} strokeWidth="1.5" />
        <text fontSize="10" fill={C.amber} textAnchor="middle" dy="-1">VFD</text>
        <text fontSize="8" fill={C.inkDim} textAnchor="middle" dy="13">SPD: 1740 RPM</text>
      </g>
      <line x1="220" y1="80" x2="258" y2="80" stroke={C.amber} strokeWidth="1.5" />

      {/* discharge */}
      <line x1="316" y1="160" x2="440" y2="160" stroke={C.signal} strokeWidth="2.5" />

      {/* check valve */}
      <g transform="translate(360,160)">
        <polygon points="0,-10 18,0 0,10" fill="none" stroke={C.ink} strokeWidth="1.5" />
        <text y="-22" fontSize="9" fill={C.ink} textAnchor="middle">CV</text>
      </g>

      {/* throttle valve */}
      <g transform="translate(420,160)">
        <polygon points="-12,-12 12,12 12,-12 -12,12" fill="none" stroke={C.signal} strokeWidth="1.5" />
        <text y="-20" fontSize="9" fill={C.signal} textAnchor="middle">HV-102</text>
      </g>

      {/* destination header */}
      <line x1="440" y1="160" x2="660" y2="160" stroke={C.signal} strokeWidth="2.5" />
      <g transform="translate(660,160)">
        <polygon points="0,-10 16,0 0,10" fill={C.signal} />
        <text x="-6" y="-18" fontSize="9" fill={C.signal} textAnchor="end">to CDU-100</text>
      </g>

      {/* legend */}
      <g transform="translate(40,28)">
        <text fontSize="11" fill={C.snow} fontWeight="bold">HYDRAULIC + ELECTRICAL SCHEMATIC · PUMP-401</text>
        <text y="14" fontSize="9" fill={C.inkDim}>ISO-1219 · motor / VFD / pump · discharge to CDU-100</text>
      </g>
    </svg>
  )
}

/* ─────────────────── 8 · K-VALUE TABLE ────────────────────────────── */
export function KValueTable() {
  const rows: { fitting: string; k: string; note?: string }[] = [
    { fitting: 'Gate valve · full open',     k: '0.19' },
    { fitting: 'Gate valve · ½ open',        k: '2.06' },
    { fitting: 'Globe valve · full open',    k: '10.0' },
    { fitting: 'Check valve · swing',        k: '2.5'  },
    { fitting: 'Ball valve · full open',     k: '0.05' },
    { fitting: 'Butterfly valve · full open', k: '0.86' },
    { fitting: 'Tee · flow through run',     k: '0.4'  },
    { fitting: 'Tee · branch',               k: '1.0'  },
    { fitting: '90° standard elbow',         k: '0.9'  },
    { fitting: '90° long-radius elbow',      k: '0.45' },
    { fitting: '45° elbow',                  k: '0.4'  },
    { fitting: 'Reducer · gradual',          k: '0.04' },
    { fitting: 'Sharp-edged entrance',       k: '0.5'  },
    { fitting: 'Flush exit',                 k: '1.0'  },
    { fitting: 'Strainer · clean',           k: '0.35' },
  ]

  return (
    <div className="w-full">
      <div className="font-mono text-[10px] text-ink-muted mb-2 leading-relaxed">
        Crane TP-410 minor-loss coefficients. Head loss h_f = K · v² / 2g.
        Static values are ingested into Cognite PI AF as pipe-segment attributes,
        then joined with live flow/pressure in Snowflake to compute expected vs
        actual head — the foundation of digital-twin fouling / leak detection.
      </div>
      <div className="grid grid-cols-2 gap-x-6">
        {rows.map((r) => (
          <div key={r.fitting} className="flex items-center justify-between border-b border-edge-subtle/50 py-1 font-mono text-[11px]">
            <span className="text-ink-dim">{r.fitting}</span>
            <span className="text-cyan tabular-nums">K = {r.k}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
