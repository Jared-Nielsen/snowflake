/**
 * NetworkTab — symbolic network topology of the refinery + cloud + remote
 * facilities, organized by Purdue layer (L0–L5) with example devices on
 * each tier. Traffic animates along the connectors.
 *
 * Tiers shown (top to bottom):
 *   L5  Enterprise / Cloud · Snowflake AI Data Cloud, SaaS, vendors
 *   L4  Business Network · Corp routers, file servers
 *   L4  Remote control facility · ops mirror
 *   L4  Disaster Recovery DC · cross-region replica
 *   ── IT/OT DMZ ──
 *   L3.5 IDMZ · firewalls, jump hosts, historian replica, MFT
 *   L3  Site control · OT Domain controller, EWS, Cognite gateway
 *   L2  Supervisory · DCS / SCADA / Historian / HMI
 *   L1  Basic control · PLC / DCS controllers / safety PLC (SIS)
 *   L0  Physical · sensors, transmitters, actuators, motors, valves
 *
 * All layers use the same SVG so animated traffic markers can travel
 * along the connectors at a steady cadence.
 */

import { useEffect, useState } from 'react'
import { Panel, PanelHeader, Kpi, DataRow } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'

const C = {
  bg:      '#0b1322',
  axis:    '#3a4a64',
  grid:    '#1e3049',
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

interface NetNode {
  id: string
  label: string
  sub?: string
  layer: 'L5' | 'L4' | 'IDMZ' | 'L3' | 'L2' | 'L1' | 'L0'
  kind: 'cloud' | 'datacenter' | 'firewall' | 'router' | 'switch' | 'server' | 'workstation' | 'hmi' | 'historian' | 'plc' | 'sis' | 'sensor' | 'actuator' | 'wireless'
  x: number
  y: number
  /** show 1-3 small icons inside (server racks, blade count, etc.) */
  count?: number
}

const W = 1240, H = 760

/* x positions by column lane (so the diagram reads as a Purdue stack) */
const LANE = { far: 110, left: 290, leftMid: 470, mid: 620, rightMid: 770, right: 950, farRight: 1130 }

const NODES: NetNode[] = [
  /* L5 — Enterprise / cloud */
  { id: 'snowflake',  label: 'Snowflake AI Data Cloud', sub: '6 sources · zero-copy',  layer: 'L5', kind: 'cloud',       x: LANE.mid,     y: 60 },
  { id: 'office365',  label: 'Office 365',              sub: 'corp identity',          layer: 'L5', kind: 'cloud',       x: LANE.left,    y: 60 },
  { id: 'vendors',    label: 'Vendor SaaS',             sub: 'Cognite · Sirion · Endur', layer: 'L5', kind: 'cloud',     x: LANE.right,   y: 60 },

  /* L4 — Business network */
  { id: 'corp-rtr',   label: 'Corp Edge Router',        sub: 'BGP · DDoS protect',     layer: 'L4', kind: 'router',      x: LANE.mid,     y: 150 },
  { id: 'remote',     label: 'Remote Control Facility', sub: 'Houston · ops mirror',   layer: 'L4', kind: 'datacenter',  x: LANE.left,    y: 150 },
  { id: 'dr',         label: 'Disaster Recovery DC',    sub: 'us-west-2 · 15-min RPO', layer: 'L4', kind: 'datacenter',  x: LANE.right,   y: 150 },

  /* IDMZ — Firewall sandwich */
  { id: 'fw-up',      label: 'IT/OT DMZ Firewall',      sub: 'next-gen · IPS',         layer: 'IDMZ', kind: 'firewall',  x: LANE.mid,     y: 240 },
  { id: 'jump',       label: 'IDMZ Jump Host',          sub: 'MFA · session record',   layer: 'IDMZ', kind: 'server',    x: LANE.leftMid, y: 240 },
  { id: 'hist-rep',   label: 'Historian Replica',       sub: 'Aspen IP21 · 24h',       layer: 'IDMZ', kind: 'historian', x: LANE.rightMid, y: 240 },
  { id: 'mft',        label: 'Managed File Transfer',   sub: 'PGP · audited',          layer: 'IDMZ', kind: 'server',    x: LANE.far,     y: 240 },
  { id: 'reverse',    label: 'Reverse Proxy',           sub: 'TLS-term · WAF',         layer: 'IDMZ', kind: 'server',    x: LANE.farRight, y: 240 },

  /* L3 — Site OT */
  { id: 'fw-dn',      label: 'OT Edge Firewall',        sub: 'allow-list only',        layer: 'L3', kind: 'firewall',    x: LANE.mid,     y: 330 },
  { id: 'ot-dc',      label: 'OT Domain Controller',    sub: 'separate AD forest',     layer: 'L3', kind: 'server',      x: LANE.leftMid, y: 330 },
  { id: 'ews',        label: 'Engineering Workstation', sub: 'config + DLP',           layer: 'L3', kind: 'workstation', x: LANE.rightMid, y: 330 },
  { id: 'cognite-gw', label: 'Cognite Edge Gateway',    sub: 'OPC-UA → cloud',         layer: 'L3', kind: 'server',      x: LANE.right,   y: 330 },
  { id: 'cct',        label: 'Cyber Crit Team',         sub: '24/7 SOC',               layer: 'L3', kind: 'server',      x: LANE.left,    y: 330 },

  /* L2 — Supervisory */
  { id: 'dcs-srv',    label: 'DCS Server Pair',         sub: 'Honeywell PHD',          layer: 'L2', kind: 'server',      x: LANE.left,    y: 430 },
  { id: 'hist',       label: 'Plant Historian',         sub: 'IP21 · 12 month',        layer: 'L2', kind: 'historian',   x: LANE.leftMid, y: 430 },
  { id: 'scada',      label: 'SCADA Master',            sub: 'GE iFix · redundant',    layer: 'L2', kind: 'server',      x: LANE.mid,     y: 430 },
  { id: 'hmi1',       label: 'HMI Console #1',          sub: 'control room A',         layer: 'L2', kind: 'hmi',         x: LANE.rightMid, y: 430 },
  { id: 'hmi2',       label: 'HMI Console #2',          sub: 'control room B',         layer: 'L2', kind: 'hmi',         x: LANE.right,   y: 430 },
  { id: 'l2-sw',      label: 'L2 Industrial Switch',    sub: 'Cisco IE-3300 · PRP',    layer: 'L2', kind: 'switch',      x: LANE.farRight, y: 430 },

  /* L1 — Basic control */
  { id: 'plc1',       label: 'PLC · CDU-100 train',     sub: 'Allen-Bradley · CLX',    layer: 'L1', kind: 'plc',         x: LANE.left,    y: 540 },
  { id: 'plc2',       label: 'PLC · FCC train',         sub: 'Siemens S7-1500',        layer: 'L1', kind: 'plc',         x: LANE.leftMid, y: 540 },
  { id: 'plc3',       label: 'PLC · Utilities',         sub: 'AB · CompactLogix',      layer: 'L1', kind: 'plc',         x: LANE.mid,     y: 540 },
  { id: 'sis',        label: 'SIS · Safety PLC',        sub: 'Triconex Tricon',        layer: 'L1', kind: 'sis',         x: LANE.rightMid, y: 540 },
  { id: 'wifi',       label: 'Plant Wi-Fi AP',          sub: 'IEEE 802.11ax · WPA3',   layer: 'L1', kind: 'wireless',    x: LANE.right,   y: 540 },
  { id: 'l1-sw',      label: 'L1 Field Switch',         sub: 'Cisco IE-3010',          layer: 'L1', kind: 'switch',      x: LANE.farRight, y: 540 },

  /* L0 — Physical (devices · field) */
  { id: 'sensor-pump', label: 'PUMP-401 vibration',     sub: 'OPC-UA · 1 Hz',          layer: 'L0', kind: 'sensor',     x: LANE.far,     y: 660 },
  { id: 'sensor-cdu',  label: 'CDU-100 PTs / TTs',      sub: 'HART · 4–20 mA',         layer: 'L0', kind: 'sensor',     x: LANE.left,    y: 660 },
  { id: 'analyzer',    label: 'FCC analyzer',           sub: 'Modbus · NIR',           layer: 'L0', kind: 'sensor',     x: LANE.leftMid, y: 660 },
  { id: 'flowmeter',   label: 'FLOW-001 meter',         sub: 'Coriolis · 4–20 mA',     layer: 'L0', kind: 'sensor',     x: LANE.mid,     y: 660 },
  { id: 'actuator-fv', label: 'FV-101 control valve',   sub: 'HART positioner',        layer: 'L0', kind: 'actuator',   x: LANE.rightMid, y: 660 },
  { id: 'motor-401',   label: 'PUMP-401 motor',         sub: '4 kV · TEFC',            layer: 'L0', kind: 'actuator',   x: LANE.right,   y: 660 },
  { id: 'sis-elem',    label: 'Final element · ESD',    sub: 'fail-closed',            layer: 'L0', kind: 'actuator',   x: LANE.farRight, y: 660 },
]

interface Edge {
  from: string
  to: string
  /** packet color */
  tone?: 'cyan' | 'signal' | 'amber' | 'snow'
  /** label */
  label?: string
}

const EDGES: Edge[] = [
  /* L5 ↔ L4 */
  { from: 'snowflake',  to: 'corp-rtr',   tone: 'cyan',   label: 'HTTPS / ODBC' },
  { from: 'office365',  to: 'corp-rtr',   tone: 'snow' },
  { from: 'vendors',    to: 'corp-rtr',   tone: 'snow' },
  { from: 'remote',     to: 'corp-rtr',   tone: 'cyan',   label: 'WAN MPLS' },
  { from: 'dr',         to: 'corp-rtr',   tone: 'amber',  label: 'cross-region repl.' },

  /* L4 ↔ IDMZ */
  { from: 'corp-rtr',   to: 'fw-up',      tone: 'cyan',   label: 'inspected' },
  { from: 'fw-up',      to: 'jump',       tone: 'snow' },
  { from: 'fw-up',      to: 'hist-rep',   tone: 'cyan' },
  { from: 'fw-up',      to: 'mft',        tone: 'snow' },
  { from: 'fw-up',      to: 'reverse',    tone: 'snow' },

  /* IDMZ ↔ L3 */
  { from: 'fw-up',      to: 'fw-dn' },
  { from: 'fw-dn',      to: 'ot-dc' },
  { from: 'fw-dn',      to: 'ews' },
  { from: 'fw-dn',      to: 'cognite-gw', tone: 'cyan',   label: 'OPC-UA' },
  { from: 'fw-dn',      to: 'cct',        tone: 'amber',  label: 'syslog' },

  /* L3 ↔ L2 */
  { from: 'ot-dc',      to: 'dcs-srv' },
  { from: 'ews',        to: 'scada' },
  { from: 'cognite-gw', to: 'hist',       tone: 'cyan' },
  { from: 'cognite-gw', to: 'hmi1' },
  { from: 'cognite-gw', to: 'hmi2' },
  { from: 'cognite-gw', to: 'l2-sw' },

  /* L2 ↔ L1 */
  { from: 'l2-sw',      to: 'plc1',       tone: 'cyan' },
  { from: 'l2-sw',      to: 'plc2',       tone: 'cyan' },
  { from: 'l2-sw',      to: 'plc3',       tone: 'cyan' },
  { from: 'l2-sw',      to: 'sis',        tone: 'amber',  label: 'air-gap pref.' },
  { from: 'l2-sw',      to: 'wifi' },
  { from: 'l2-sw',      to: 'l1-sw' },

  /* L1 ↔ L0 */
  { from: 'plc1',       to: 'sensor-cdu', tone: 'snow' },
  { from: 'plc1',       to: 'flowmeter',  tone: 'snow' },
  { from: 'plc1',       to: 'sensor-pump', tone: 'snow' },
  { from: 'plc2',       to: 'analyzer',   tone: 'snow' },
  { from: 'plc3',       to: 'actuator-fv', tone: 'signal' },
  { from: 'plc3',       to: 'motor-401',   tone: 'signal' },
  { from: 'sis',        to: 'sis-elem',    tone: 'amber',  label: 'SIF loop' },
]

/* ─── helpers ─────────────────────────────────────────────────────── */

function findNode(id: string) {
  return NODES.find((n) => n.id === id)!
}

function toneColor(tone?: Edge['tone']) {
  switch (tone) {
    case 'cyan':   return C.cyan
    case 'amber':  return C.amber
    case 'signal': return C.signal
    case 'snow':   return C.snow
    default:       return C.snow
  }
}

/* ─── node icon ───────────────────────────────────────────────────── */

function NodeIcon({ kind }: { kind: NetNode['kind'] }) {
  switch (kind) {
    case 'cloud':
      return (
        <g>
          <ellipse cx="0" cy="0" rx="22" ry="12" fill="none" stroke={C.cyan} strokeWidth="1.4" />
          <circle cx="-8" cy="-3" r="6" fill="none" stroke={C.cyan} strokeWidth="1.4" />
          <circle cx="6" cy="-4" r="7" fill="none" stroke={C.cyan} strokeWidth="1.4" />
        </g>
      )
    case 'datacenter':
      return (
        <g>
          <rect x="-18" y="-14" width="36" height="28" fill={C.bg} stroke={C.snow} strokeWidth="1.4" />
          {[-9, -2, 5].map((y, i) => <rect key={i} x="-13" y={y} width="26" height="4" fill={C.snow} opacity="0.5" />)}
        </g>
      )
    case 'firewall':
      return (
        <g>
          <rect x="-18" y="-13" width="36" height="26" fill={C.bg} stroke={C.alarm} strokeWidth="1.5" />
          {[-8, 0, 8].map((y, i) => (
            <line key={i} x1="-16" x2="16" y1={y} y2={y} stroke={C.alarm} strokeWidth="1" />
          ))}
          {[-12, -4, 4, 12].map((x, i) => (
            <line key={i} x1={x} x2={x + (i % 2 ? 8 : -8)} y1={i % 2 ? -8 : 0} y2={i % 2 ? 0 : 8} stroke={C.alarm} strokeWidth="0.8" />
          ))}
        </g>
      )
    case 'router':
      return (
        <g>
          <circle r="14" fill={C.bg} stroke={C.snow} strokeWidth="1.4" />
          {[0, 90, 180, 270].map((deg, i) => (
            <polygon key={i} points="0,-4 10,0 0,4" fill={C.snow} transform={`rotate(${deg})`} />
          ))}
        </g>
      )
    case 'switch':
      return (
        <g>
          <rect x="-18" y="-10" width="36" height="20" fill={C.bg} stroke={C.cyan} strokeWidth="1.4" />
          {[-12, -4, 4, 12].map((x, i) => <rect key={i} x={x - 1.5} y="-6" width="3" height="12" fill={C.cyan} />)}
        </g>
      )
    case 'server':
      return (
        <g>
          <rect x="-15" y="-13" width="30" height="26" fill={C.bg} stroke={C.snow} strokeWidth="1.4" />
          {[-9, -3, 3].map((y, i) => <line key={i} x1="-10" x2="10" y1={y} y2={y} stroke={C.snow} strokeWidth="0.8" />)}
          <circle cx="9" cy="9" r="2" fill={C.signal} />
        </g>
      )
    case 'workstation':
      return (
        <g>
          <rect x="-15" y="-12" width="30" height="18" fill={C.bg} stroke={C.snow} strokeWidth="1.4" />
          <rect x="-3"  y="6"   width="6"  height="4"  fill={C.snow} />
          <rect x="-9"  y="10"  width="18" height="2"  fill={C.snow} />
        </g>
      )
    case 'hmi':
      return (
        <g>
          <rect x="-16" y="-12" width="32" height="22" fill={C.bg} stroke={C.signal} strokeWidth="1.4" />
          <circle cx="-7" cy="-3" r="3" fill={C.signal} opacity="0.6" />
          <rect x="2" y="-5" width="10" height="3" fill={C.signal} opacity="0.7" />
          <rect x="2" y="0" width="8" height="3" fill={C.signal} opacity="0.4" />
        </g>
      )
    case 'historian':
      return (
        <g>
          <rect x="-15" y="-13" width="30" height="26" fill={C.bg} stroke={C.amber} strokeWidth="1.4" />
          {[-9, -4, 1, 6].map((y, i) => <ellipse key={i} cx="0" cy={y} rx="11" ry="2" fill="none" stroke={C.amber} strokeWidth="0.7" />)}
        </g>
      )
    case 'plc':
      return (
        <g>
          <rect x="-16" y="-12" width="32" height="22" fill={C.bg} stroke={C.copper} strokeWidth="1.5" />
          <rect x="-13" y="-9" width="6" height="16" fill={C.copper} opacity="0.5" />
          <rect x="-5"  y="-9" width="4" height="16" fill={C.copper} opacity="0.7" />
          <rect x="1"   y="-9" width="4" height="16" fill={C.copper} opacity="0.5" />
          <rect x="7"   y="-9" width="4" height="16" fill={C.copper} opacity="0.7" />
        </g>
      )
    case 'sis':
      return (
        <g>
          <rect x="-16" y="-12" width="32" height="22" fill={C.bg} stroke={C.flare} strokeWidth="1.6" />
          <path d="M-10,-4 L-3,5 L10,-8" fill="none" stroke={C.flare} strokeWidth="1.4" />
          <text fontSize="7" fill={C.flare} textAnchor="middle" y="-2">SIS</text>
        </g>
      )
    case 'sensor':
      return (
        <g>
          <circle r="11" fill={C.bg} stroke={C.cyan} strokeWidth="1.4" />
          <circle r="5" fill={C.cyan} opacity="0.6" />
        </g>
      )
    case 'actuator':
      return (
        <g>
          <rect x="-10" y="-10" width="20" height="20" fill={C.bg} stroke={C.signal} strokeWidth="1.4" transform="rotate(45)" />
          <circle r="3" fill={C.signal} />
        </g>
      )
    case 'wireless':
      return (
        <g>
          <circle r="3" fill={C.snow} />
          <path d="M-10,5 A 11 11 0 0 1 10,5" fill="none" stroke={C.snow} strokeWidth="1.2" />
          <path d="M-15,9 A 17 17 0 0 1 15,9" fill="none" stroke={C.snow} strokeWidth="1.2" opacity="0.7" />
          <path d="M-20,13 A 23 23 0 0 1 20,13" fill="none" stroke={C.snow} strokeWidth="1.2" opacity="0.5" />
        </g>
      )
    default:
      return null
  }
}

/* ─── animated traffic packet on each edge ────────────────────────── */

function Packet({ edge, phase }: { edge: Edge; phase: number }) {
  const a = findNode(edge.from)
  const b = findNode(edge.to)
  // simple linear interpolation; phase ∈ [0,1)
  const x = a.x + (b.x - a.x) * phase
  const y = a.y + (b.y - a.y) * phase
  return (
    <circle cx={x} cy={y} r={2.6} fill={toneColor(edge.tone)} opacity="0.95">
      <animate
        attributeName="r"
        values="2.2;3.2;2.2"
        dur="1s"
        repeatCount="indefinite"
      />
    </circle>
  )
}

/* ─── layer-band background ───────────────────────────────────────── */

const LAYERS: { y: number; height: number; label: string; sub: string; tone: string }[] = [
  { y: 30,  height: 80, label: 'L5 · Enterprise / Cloud',  sub: 'Snowflake AI Data Cloud · SaaS', tone: C.cyan },
  { y: 120, height: 70, label: 'L4 · Business Network',    sub: 'corp · remote · DR',             tone: C.snow },
  { y: 200, height: 80, label: 'IDMZ',                     sub: 'firewall sandwich + proxies',    tone: C.alarm },
  { y: 290, height: 80, label: 'L3 · Site OT',             sub: 'OT domain · EWS · edge GW',      tone: C.snow },
  { y: 380, height: 80, label: 'L2 · Supervisory',         sub: 'DCS · SCADA · Historian · HMI',  tone: C.signal },
  { y: 490, height: 80, label: 'L1 · Basic Control',       sub: 'PLC · SIS · field switches',     tone: C.copper },
  { y: 600, height: 90, label: 'L0 · Physical Devices',    sub: 'sensors · transmitters · actuators', tone: C.amber },
]

/* ─── component ────────────────────────────────────────────────────── */

export function NetworkTab() {
  const [phase, setPhase] = useState(0)
  useEffect(() => {
    let raf = 0
    const start = performance.now()
    const tick = () => {
      const t = (performance.now() - start) / 1000
      // 0..1 every 2.4s
      setPhase((t / 2.4) % 1)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div className="px-6 pb-8 space-y-4 animate-reveal-up">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <div className="tag">NETWORK · PURDUE MODEL · ANIMATED TRAFFIC</div>
          <h1 className="font-display text-2xl font-bold tracking-tight mt-1">
            Plant network topology · Cloud · Control Room · Remote · DR
          </h1>
          <div className="tag mt-1 text-ink-muted">
            Every Purdue layer (L0–L5), with representative devices on each tier and animated packet flow along the connectors. Click any node for telemetry.
          </div>
        </div>
        <div className="flex gap-2">
          <Badge tone="cyan">L5–L0</Badge>
          <Badge tone="amber">IDMZ</Badge>
          <Badge tone="signal">live traffic</Badge>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <Kpi label="Nodes"             value={NODES.length.toString()}    tone="cyan" />
        <Kpi label="Connectors"        value={EDGES.length.toString()}    tone="snow" />
        <Kpi label="Firewall hops"     value="2"  unit="IDMZ + OT edge"   tone="amber" />
        <Kpi label="Inbound from cloud" value="HTTPS only"                tone="signal" />
      </div>

      {/* Topology */}
      <Panel>
        <PanelHeader label="REFINERY NETWORK · PURDUE STACK" hint="animated">
          <Badge tone="cyan">SVG</Badge>
          <Badge tone="signal">live</Badge>
        </PanelHeader>
        <div className="p-2">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full bg-bg-base">
            {/* Layer bands */}
            {LAYERS.map((l) => (
              <g key={l.label}>
                <rect x="20" y={l.y} width={W - 40} height={l.height} fill={l.tone} opacity="0.04" />
                <line x1="20" x2={W - 20} y1={l.y} y2={l.y} stroke={l.tone} strokeOpacity="0.3" />
                <text x="36" y={l.y + 14} fontSize="10" fill={l.tone} fontWeight="bold">{l.label}</text>
                <text x="36" y={l.y + 26} fontSize="9" fill={C.inkDim}>{l.sub}</text>
              </g>
            ))}

            {/* Edges */}
            {EDGES.map((e, i) => {
              const a = findNode(e.from)
              const b = findNode(e.to)
              const color = toneColor(e.tone)
              return (
                <g key={i}>
                  <line x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                        stroke={color} strokeOpacity="0.45" strokeWidth="1.2" />
                  {e.label && (
                    <text
                      x={(a.x + b.x) / 2}
                      y={(a.y + b.y) / 2 - 4}
                      fontSize="8"
                      fill={C.inkDim}
                      textAnchor="middle"
                      pointerEvents="none"
                    >
                      {e.label}
                    </text>
                  )}
                </g>
              )
            })}

            {/* Animated packets — staggered phase per edge */}
            {EDGES.map((e, i) => {
              const p = (phase + i * 0.07) % 1
              return <Packet key={`p-${i}`} edge={e} phase={p} />
            })}

            {/* Nodes */}
            {NODES.map((n) => (
              <g key={n.id} transform={`translate(${n.x},${n.y})`}>
                <NodeIcon kind={n.kind} />
                <text y="26" fontSize="9.5" fill={C.ink} textAnchor="middle">{n.label}</text>
                {n.sub && <text y="38" fontSize="8" fill={C.inkDim} textAnchor="middle">{n.sub}</text>}
              </g>
            ))}
          </svg>
        </div>
      </Panel>

      {/* Legend */}
      <div className="grid grid-cols-3 gap-4">
        <Panel className="p-4">
          <div className="tag text-cyan mb-2">DEVICE CLASSES</div>
          <div className="space-y-1 font-mono text-[11px]">
            <LegendRow color={C.cyan}   label="Cloud / Snowflake AI Data Cloud" />
            <LegendRow color={C.snow}   label="Data-center · server · workstation · router" />
            <LegendRow color={C.alarm}  label="Firewall · IDMZ inspect / IPS" />
            <LegendRow color={C.signal} label="HMI · actuator (final element)" />
            <LegendRow color={C.amber}  label="Historian · SIS safety PLC" />
            <LegendRow color={C.copper} label="PLC / DCS controller" />
          </div>
        </Panel>
        <Panel className="p-4">
          <div className="tag text-cyan mb-2">TRAFFIC FLOWS</div>
          <DataRow label="Cloud ↔ corp" value="HTTPS / ODBC · TLS 1.3" tone="cyan" />
          <DataRow label="WAN remote / DR" value="MPLS · IPSec" tone="cyan" />
          <DataRow label="IT/OT DMZ" value="inspected only · WAF" tone="alarm" />
          <DataRow label="OT ↔ historian replica" value="one-way push · MFT" tone="amber" />
          <DataRow label="L3 ↔ L2 / L1" value="OPC-UA · Modbus · EtherNet/IP" tone="cyan" />
          <DataRow label="SIS loop" value="hardwired or air-gapped" tone="flare" />
        </Panel>
        <Panel className="p-4">
          <div className="tag text-cyan mb-2">CONTROLS · LAYER BOUNDARIES</div>
          <DataRow label="Cloud → Corp"     value="WAF · DDoS"             tone="signal" />
          <DataRow label="Corp → IDMZ"      value="next-gen FW · IPS"      tone="amber" />
          <DataRow label="IDMZ → OT"        value="allow-list · jump host" tone="amber" />
          <DataRow label="OT → field"       value="signed firmware"        tone="snow" />
          <DataRow label="Field → SIS"      value="physically separate"    tone="flare" />
          <DataRow label="OT → audit"       value="syslog → SOC · Cortex"  tone="cyan" />
        </Panel>
      </div>
    </div>
  )
}

function LegendRow({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={cn('inline-block w-2.5 h-2.5')} style={{ background: color }} />
      <span className="text-ink-dim">{label}</span>
    </div>
  )
}
