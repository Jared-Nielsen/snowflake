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

import { useEffect, useMemo, useRef, useState } from 'react'
import { Snowflake as SnowflakeIcon, X } from 'lucide-react'
import { Panel, PanelHeader, Kpi, DataRow } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { cn, shortTime } from '@/lib/utils'

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

/* ─── device-specific telemetry ──────────────────────────────────── */

/**
 * Static-but-realistic telemetry blueprint per node. The numeric values
 * are seeded; the rendered values jitter at runtime in TelemetryPanel
 * so the panel feels alive.
 */
interface NodeMetric {
  label: string
  /** baseline value */
  base: number
  /** ± jitter (uniform) */
  jitter: number
  /** number of decimal places to show */
  digits?: number
  unit?: string
  tone?: 'cyan' | 'amber' | 'signal' | 'snow' | 'alarm' | 'flare'
  /** sparkline domain */
  series?: { min: number; max: number }
}

interface NodeTelemetry {
  /** human title */
  subtitle: string
  /** narrative paragraph */
  summary: string
  /** metric strip with mini-sparklines */
  metrics: NodeMetric[]
  /** key/value rows below */
  facts: { label: string; value: string }[]
  /** typical traffic in/out */
  traffic: { label: string; value: string }[]
}

const NODE_TELEMETRY: Record<string, NodeTelemetry> = {
  /* L5 · Cloud */
  snowflake: {
    subtitle: 'Snowflake AI Data Cloud · us-east-2',
    summary: 'Unified data plane. Receives zero-copy shares from Cognite and SAP and Snowpipe streams from Quorum, Sirion and Endur. Cortex AI runs against the gold semantic layer.',
    metrics: [
      { label: 'queries / min',  base: 1820, jitter: 220, digits: 0, unit: 'qpm',    tone: 'cyan',   series: { min: 1400, max: 2400 } },
      { label: 'avg latency',    base: 1.6,  jitter: 0.4, digits: 1, unit: 's',      tone: 'signal', series: { min: 0.8,  max: 3.2 } },
      { label: 'ingest rate',    base: 8420, jitter: 580, digits: 0, unit: 'ev/s',   tone: 'amber',  series: { min: 5000, max: 12000 } },
      { label: 'cortex tokens',  base: 412,  jitter: 80,  digits: 0, unit: '/min',   tone: 'snow',   series: { min: 280,  max: 580 } },
    ],
    facts: [
      { label: 'region',         value: 'AWS us-east-2 (primary) · us-west-2 (DR)' },
      { label: 'edition',        value: 'Enterprise · ASB · BYOK' },
      { label: 'warehouses',     value: '6 active · auto-scaled' },
      { label: 'governance',     value: 'Horizon Catalog · 13.4k columns' },
      { label: 'compliance',     value: 'SOC 2 II · ISO 27001 · CMMC L2' },
    ],
    traffic: [
      { label: 'inbound from corp', value: 'HTTPS / ODBC · TLS 1.3' },
      { label: 'outbound to corp',  value: 'JDBC result-sets · governed' },
      { label: 'zero-copy shares',  value: 'Cognite + SAP BDC' },
    ],
  },
  office365: {
    subtitle: 'Office 365 · corporate productivity',
    summary: 'Email, Teams, SharePoint, OneDrive. Federates to corp Azure AD; conditional access enforced on all sign-ins.',
    metrics: [
      { label: 'active users',    base: 412,  jitter: 28,  digits: 0, unit: '',     tone: 'snow',   series: { min: 380,  max: 460 } },
      { label: 'inbound msgs',    base: 1240, jitter: 180, digits: 0, unit: '/h',  tone: 'cyan',   series: { min: 800,  max: 1800 } },
      { label: 'spam blocked',    base: 84,   jitter: 18,  digits: 0, unit: '%',   tone: 'signal', series: { min: 72,   max: 96 } },
      { label: 'phish · 24h',     base: 12,   jitter: 6,   digits: 0, unit: '',    tone: 'amber',  series: { min: 0,    max: 28 } },
    ],
    facts: [
      { label: 'tenant',     value: 'texasrefining.onmicrosoft.com' },
      { label: 'identity',   value: 'Azure AD + SCIM to Snowflake' },
      { label: 'CASB',       value: 'Defender for Cloud Apps' },
    ],
    traffic: [
      { label: 'corp → cloud',   value: 'HTTPS · cert-pinned' },
      { label: 'SSO assertions', value: 'SAML 2.0 · 4 h cache' },
    ],
  },
  vendors: {
    subtitle: 'Vendor SaaS · Cognite / Sirion / Endur',
    summary: 'Operational SaaS portals for the five source systems. None of these are queried directly by analytics; data flows into Snowflake via zero-copy or Snowpipe instead.',
    metrics: [
      { label: 'cognite ts ingest', base: 4820, jitter: 420, digits: 0, unit: 'rows/s', tone: 'cyan',   series: { min: 3000, max: 7000 } },
      { label: 'endur trades · /h', base: 184,  jitter: 36,  digits: 0, unit: '',       tone: 'snow',   series: { min: 80,   max: 280 } },
      { label: 'sirion contracts',  base: 24,   jitter: 1,   digits: 0, unit: 'active', tone: 'snow' },
      { label: 'cortex sentiment',  base: 5184, jitter: 240, digits: 0, unit: '/d',     tone: 'amber',  series: { min: 4200, max: 6200 } },
    ],
    facts: [
      { label: 'cognite version', value: 'Data Fusion · zero-copy connector' },
      { label: 'endur',           value: 'Kafka topic endur.trades.v1' },
      { label: 'sirion',          value: 'S3 export · Snowpipe' },
    ],
    traffic: [
      { label: 'vendor → corp', value: 'HTTPS API · TLS 1.3' },
      { label: 'tokens',        value: 'OAuth2 · 1 h lifetime' },
    ],
  },

  /* L4 */
  'corp-rtr': {
    subtitle: 'Corp Edge Router · BGP / DDoS',
    summary: 'Houston HQ corporate edge. eBGP to two upstream carriers, IPSec to remote and DR sites, anti-DDoS scrubbing.',
    metrics: [
      { label: 'throughput',   base: 4.2, jitter: 0.8, digits: 1, unit: 'Gbps',  tone: 'cyan',   series: { min: 2,   max: 8 } },
      { label: 'pps',          base: 412, jitter: 64,  digits: 0, unit: 'kpps',  tone: 'snow',   series: { min: 240, max: 580 } },
      { label: 'BGP sessions', base: 4,   jitter: 0,   digits: 0, unit: '',      tone: 'signal' },
      { label: 'DDoS scrub',   base: 0,   jitter: 0,   digits: 0, unit: 'Gbps',  tone: 'signal' },
    ],
    facts: [
      { label: 'platform', value: 'Cisco ASR 9000' },
      { label: 'BGP ASN',  value: 'AS65512' },
      { label: 'IPSec',    value: 'remote + DR · AES-256-GCM' },
    ],
    traffic: [
      { label: 'cloud',  value: '4.2 Gbps avg · 8.1 Gbps peak' },
      { label: 'remote', value: '420 Mbps MPLS' },
    ],
  },
  remote: {
    subtitle: 'Remote Control Facility · Houston',
    summary: 'Operations mirror — duplicates DCS HMI views, alarm management, ESG dashboards. Read-only on OT data; not in the control loop.',
    metrics: [
      { label: 'active sessions', base: 14,   jitter: 4,   digits: 0, unit: '',     tone: 'cyan',  series: { min: 6,   max: 24 } },
      { label: 'wan latency',     base: 18.4, jitter: 3.2, digits: 1, unit: 'ms',   tone: 'snow',  series: { min: 12,  max: 28 } },
      { label: 'hmi mirror',      base: 100,  jitter: 0,   digits: 0, unit: '% sync', tone: 'signal' },
    ],
    facts: [
      { label: 'distance',  value: '38 mi · Houston' },
      { label: 'mode',      value: 'read-only mirror · audit logged' },
    ],
    traffic: [
      { label: 'WAN', value: '420 Mbps MPLS · IPSec failover' },
    ],
  },
  dr: {
    subtitle: 'Disaster Recovery DC · us-west-2',
    summary: 'Cross-region passive replica. Cross-cloud replication keeps Gold tables + Horizon lineage in sync. 15-minute RPO, 1-hour RTO target.',
    metrics: [
      { label: 'replication lag', base: 12.4, jitter: 2.6, digits: 1, unit: 'min', tone: 'signal', series: { min: 8, max: 20 } },
      { label: 'cross-cloud Gbps', base: 0.8,  jitter: 0.2, digits: 1, unit: 'Gbps', tone: 'cyan', series: { min: 0.4, max: 1.6 } },
      { label: 'last failover test', base: 28, jitter: 0, digits: 0, unit: 'd ago', tone: 'snow' },
    ],
    facts: [
      { label: 'region',     value: 'AWS us-west-2' },
      { label: 'RPO',        value: '15 min' },
      { label: 'RTO',        value: '1 h tested · annual' },
    ],
    traffic: [
      { label: 'replication', value: 'cross-cloud · governed share' },
    ],
  },

  /* IDMZ */
  'fw-up': {
    subtitle: 'IT/OT DMZ Firewall · next-gen + IPS',
    summary: 'Palo Alto PA-5450 pair. All north-south OT traffic terminates here. App-ID + URL filtering + IPS + WildFire sandbox.',
    metrics: [
      { label: 'sessions',    base: 18420, jitter: 1800, digits: 0, unit: '',     tone: 'cyan',  series: { min: 12000, max: 26000 } },
      { label: 'IPS blocks',  base: 84,    jitter: 16,   digits: 0, unit: '/min', tone: 'flare', series: { min: 40,    max: 180 } },
      { label: 'throughput',  base: 3.2,   jitter: 0.6,  digits: 1, unit: 'Gbps', tone: 'snow',  series: { min: 2,     max: 5 } },
      { label: 'wildfire q',  base: 6,     jitter: 3,    digits: 0, unit: '',     tone: 'amber', series: { min: 0,     max: 18 } },
    ],
    facts: [
      { label: 'platform',  value: 'PA-5450 HA pair' },
      { label: 'mode',      value: 'TAP + inline · L7 inspection' },
      { label: 'profiles',  value: 'IT-to-IDMZ + IDMZ-to-OT' },
    ],
    traffic: [
      { label: 'inspected', value: 'L7 + decrypt allowed apps only' },
      { label: 'denied',    value: 'OT egress to internet · default' },
    ],
  },
  jump: {
    subtitle: 'IDMZ Jump Host · MFA · session record',
    summary: 'CyberArk-based jump host. All admin sessions into OT are mediated, recorded, and time-boxed. No saved credentials on operator endpoints.',
    metrics: [
      { label: 'sessions',     base: 4,   jitter: 2,  digits: 0, unit: '',     tone: 'cyan',   series: { min: 0,  max: 12 } },
      { label: 'avg duration', base: 22,  jitter: 8,  digits: 0, unit: 'min',  tone: 'snow',   series: { min: 4,  max: 60 } },
      { label: 'recordings',   base: 184, jitter: 6,  digits: 0, unit: 'kept', tone: 'signal' },
    ],
    facts: [
      { label: 'auth',     value: 'MFA · YubiKey + PIN' },
      { label: 'platform', value: 'CyberArk PSM' },
      { label: 'retention', value: '90 d · WORM' },
    ],
    traffic: [
      { label: 'in',  value: 'RDP / SSH · MFA-gated' },
      { label: 'out', value: 'to OT VLAN · cert-pinned' },
    ],
  },
  'hist-rep': {
    subtitle: 'Historian Replica · Aspen IP21',
    summary: '24-hour rolling cache of plant historian. Read-only one-way push from L2 historian. Powers SOC + analytics without giving direct access to OT.',
    metrics: [
      { label: 'tags',        base: 13402, jitter: 0,   digits: 0, unit: '',     tone: 'cyan'   },
      { label: 'samples · /s', base: 4820, jitter: 280, digits: 0, unit: 'pts',  tone: 'snow',  series: { min: 3800, max: 6200 } },
      { label: 'replication lag', base: 4.2, jitter: 1.2, digits: 1, unit: 's', tone: 'signal', series: { min: 1, max: 12 } },
    ],
    facts: [
      { label: 'platform',  value: 'Aspen IP21' },
      { label: 'retention', value: '24 h locally · permanent in Snowflake' },
    ],
    traffic: [
      { label: 'one-way push', value: 'L2 historian → IDMZ replica' },
    ],
  },
  mft: {
    subtitle: 'Managed File Transfer',
    summary: 'PGP-signed, audit-logged. Inbound from vendors (catalog data, lab files), outbound to insurers/regulators.',
    metrics: [
      { label: 'transfers · /h', base: 12, jitter: 4, digits: 0, unit: '', tone: 'cyan' },
      { label: 'failed', base: 0, jitter: 0, digits: 0, unit: '', tone: 'signal' },
    ],
    facts: [
      { label: 'platform', value: 'GoAnywhere MFT' },
      { label: 'encryption', value: 'PGP + TLS 1.3' },
    ],
    traffic: [
      { label: 'inbound', value: 'vendor lab data + catalog' },
      { label: 'outbound', value: 'CDP/CSRD/EPA disclosures' },
    ],
  },
  reverse: {
    subtitle: 'Reverse Proxy · TLS-term + WAF',
    summary: 'F5 BIG-IP. Terminates TLS for OT web apps exposed to corp. Web Application Firewall blocks OWASP top-10.',
    metrics: [
      { label: 'requests · /s', base: 142, jitter: 32, digits: 0, unit: 'rps',   tone: 'cyan',  series: { min: 60, max: 280 } },
      { label: 'WAF blocks',     base: 6,  jitter: 4,  digits: 0, unit: '/min', tone: 'amber', series: { min: 0,  max: 20 } },
      { label: 'TLS handshakes', base: 84, jitter: 18, digits: 0, unit: '/s',   tone: 'snow' },
    ],
    facts: [
      { label: 'platform', value: 'F5 BIG-IP · ASM' },
      { label: 'cipher',   value: 'TLS 1.3 only' },
    ],
    traffic: [{ label: 'corp → OT web apps', value: 'reverse-proxied' }],
  },

  /* L3 */
  'fw-dn': {
    subtitle: 'OT Edge Firewall · allow-list',
    summary: 'Default-deny stance. Only protocol-aware rules allowed. Industrial DPI for OPC-UA, Modbus, EtherNet/IP, DNP3.',
    metrics: [
      { label: 'allow-list rules', base: 184,  jitter: 0,  digits: 0, unit: '',     tone: 'cyan' },
      { label: 'deny · /min',      base: 412,  jitter: 56, digits: 0, unit: '',     tone: 'flare', series: { min: 240, max: 720 } },
      { label: 'OT DPI throughput', base: 1.4, jitter: 0.3, digits: 1, unit: 'Gbps', tone: 'snow', series: { min: 0.8, max: 2.2 } },
    ],
    facts: [
      { label: 'platform',  value: 'Fortinet FortiGate 600F (ICS profile)' },
      { label: 'industrial', value: 'OPC-UA + Modbus + EtherNet/IP DPI' },
    ],
    traffic: [
      { label: 'OPC-UA up', value: 'Cognite gateway only' },
      { label: 'all egress', value: 'default deny' },
    ],
  },
  'ot-dc': {
    subtitle: 'OT Domain Controller · separate forest',
    summary: 'OT-only Active Directory. No trust to corp. Tier-0 admin separation enforced. KRBTGT rotated every 90 days.',
    metrics: [
      { label: 'auth requests',  base: 1820, jitter: 240, digits: 0, unit: '/min', tone: 'cyan',  series: { min: 1200, max: 2600 } },
      { label: 'logon failures', base: 4,    jitter: 3,   digits: 0, unit: '/min', tone: 'amber', series: { min: 0, max: 14 } },
      { label: 'tier-0 admins',  base: 4,    jitter: 0,   digits: 0, unit: '',     tone: 'snow' },
    ],
    facts: [
      { label: 'platform',  value: 'Windows Server 2022 · domain ot.txr.local' },
      { label: 'trust',     value: 'no corp trust' },
    ],
    traffic: [{ label: 'Kerberos + LDAPS', value: 'within OT VLAN only' }],
  },
  ews: {
    subtitle: 'Engineering Workstation · config + DLP',
    summary: 'PLC programming endpoint. Application allow-list, DLP on USB + clipboard, EDR with OT-aware ruleset.',
    metrics: [
      { label: 'CIP sessions',  base: 2,   jitter: 2,  digits: 0, unit: '',    tone: 'cyan' },
      { label: 'usb attempts',  base: 0,   jitter: 1,  digits: 0, unit: '/d',  tone: 'amber' },
      { label: 'EDR signals',   base: 0,   jitter: 0,  digits: 0, unit: '',    tone: 'signal' },
    ],
    facts: [
      { label: 'allow-list', value: 'Studio 5000, TIA Portal, RSLogix' },
      { label: 'edr',        value: 'CrowdStrike Falcon for OT' },
    ],
    traffic: [{ label: 'PLC programming', value: 'EtherNet/IP CIP · audited' }],
  },
  'cognite-gw': {
    subtitle: 'Cognite Edge Gateway',
    summary: 'OPC-UA to cloud. Aggregates tag values, contextualizes with Cognite Data Fusion, and pushes through the zero-copy share to Snowflake.',
    metrics: [
      { label: 'tags scanned', base: 13402, jitter: 0,    digits: 0, unit: '', tone: 'cyan' },
      { label: 'samples / s',  base: 4820,  jitter: 240,  digits: 0, unit: 'pts', tone: 'cyan', series: { min: 4000, max: 6200 } },
      { label: 'edge buffer',  base: 18,    jitter: 6,    digits: 0, unit: '%', tone: 'signal' },
    ],
    facts: [
      { label: 'platform',     value: 'Cognite Edge 2.4' },
      { label: 'protocols',    value: 'OPC-UA · Modbus · MQTT' },
    ],
    traffic: [{ label: 'OT → Cloud', value: 'OPC-UA · TLS · queued' }],
  },
  cct: {
    subtitle: 'Cyber Crit Team · 24/7 SOC',
    summary: 'In-plant security operations center. Tier-1 + Tier-2 analysts. Hands off to corporate IR after containment.',
    metrics: [
      { label: 'open alerts',   base: 12, jitter: 4, digits: 0, unit: '', tone: 'amber', series: { min: 4, max: 24 } },
      { label: 'analysts on shift', base: 3, jitter: 1, digits: 0, unit: '', tone: 'cyan' },
      { label: 'MTTD',          base: 4.1, jitter: 0.8, digits: 1, unit: 'min', tone: 'signal' },
    ],
    facts: [
      { label: 'rotation', value: '3 shifts · 24×7' },
      { label: 'playbook', value: 'NIST CSF · IEC 62443' },
    ],
    traffic: [{ label: 'syslog in', value: '~12k events/s' }],
  },

  /* L2 */
  'dcs-srv': {
    subtitle: 'DCS Server Pair · Honeywell PHD',
    summary: 'Primary + secondary DCS servers. Hot-standby pair. Controls CDU, FCC, utilities trains.',
    metrics: [
      { label: 'cpu',       base: 38, jitter: 8, digits: 0, unit: '%',    tone: 'cyan',   series: { min: 20, max: 60 } },
      { label: 'memory',    base: 56, jitter: 4, digits: 0, unit: '%',    tone: 'snow',   series: { min: 48, max: 68 } },
      { label: 'sync lag',  base: 0.4, jitter: 0.2, digits: 1, unit: 's', tone: 'signal', series: { min: 0.2, max: 0.8 } },
    ],
    facts: [
      { label: 'platform',  value: 'Honeywell Experion PHD' },
      { label: 'pair',      value: 'A (primary) + B (hot)' },
    ],
    traffic: [{ label: 'L1 PLC poll', value: 'EtherNet/IP · 100 ms' }],
  },
  hist: {
    subtitle: 'Plant Historian · Aspen IP21',
    summary: '12-month online retention. Compresses ~13k OT tags. Source of truth before cloud replication.',
    metrics: [
      { label: 'tags',        base: 13402, jitter: 0,   digits: 0, unit: '',     tone: 'cyan' },
      { label: 'write rate',  base: 8400,  jitter: 420, digits: 0, unit: 'pts/s', tone: 'amber', series: { min: 6000, max: 12000 } },
      { label: 'disk · used', base: 64,    jitter: 1,   digits: 0, unit: '%',    tone: 'snow' },
    ],
    facts: [
      { label: 'retention', value: '12 mo on-disk · forever in cloud' },
      { label: 'compression', value: '~9× swinging-door' },
    ],
    traffic: [{ label: 'L1 → historian', value: 'OPC-UA · 100 ms' }],
  },
  scada: {
    subtitle: 'SCADA Master · GE iFix',
    summary: 'Field-area SCADA. Tanks, pipelines, terminal automation. Redundant master.',
    metrics: [
      { label: 'tags polled',  base: 4820, jitter: 120, digits: 0, unit: '', tone: 'cyan' },
      { label: 'poll period',  base: 1.0,  jitter: 0,   digits: 1, unit: 's', tone: 'snow' },
      { label: 'comms ok',     base: 99.8, jitter: 0.2, digits: 1, unit: '%', tone: 'signal' },
    ],
    facts: [{ label: 'platform', value: 'GE iFix 6.5 · redundant' }],
    traffic: [{ label: 'field RTUs', value: 'DNP3 + serial' }],
  },
  hmi1: {
    subtitle: 'HMI Console #1 · Control Room A',
    summary: 'Primary operator console for the CDU + FCC trains. Two operators on shift.',
    metrics: [
      { label: 'alarms · /h',  base: 18, jitter: 6, digits: 0, unit: '', tone: 'amber', series: { min: 4, max: 36 } },
      { label: 'operator ack', base: 96, jitter: 3, digits: 0, unit: '%', tone: 'signal' },
      { label: 'screens',      base: 4,  jitter: 0, digits: 0, unit: '', tone: 'snow' },
    ],
    facts: [{ label: 'shift', value: 'B · J. Wheeler + S. Ortiz' }],
    traffic: [{ label: 'DCS feed', value: 'subscribed views' }],
  },
  hmi2: {
    subtitle: 'HMI Console #2 · Control Room B',
    summary: 'Secondary operator console — utilities + tank farm + flare.',
    metrics: [
      { label: 'alarms · /h',  base: 8,  jitter: 4, digits: 0, unit: '', tone: 'amber', series: { min: 0, max: 18 } },
      { label: 'operator ack', base: 98, jitter: 2, digits: 0, unit: '%', tone: 'signal' },
      { label: 'screens',      base: 3,  jitter: 0, digits: 0, unit: '', tone: 'snow' },
    ],
    facts: [{ label: 'shift', value: 'B · M. Rivera' }],
    traffic: [{ label: 'DCS feed', value: 'subscribed views' }],
  },
  'l2-sw': {
    subtitle: 'L2 Industrial Switch · Cisco IE-3300 · PRP',
    summary: 'Parallel-Redundant-Protocol switch. Zero-failover for critical L2 traffic.',
    metrics: [
      { label: 'throughput', base: 240, jitter: 32, digits: 0, unit: 'Mbps',  tone: 'cyan',   series: { min: 140, max: 380 } },
      { label: 'errors',     base: 0,   jitter: 0,  digits: 0, unit: '',      tone: 'signal' },
      { label: 'PRP redundancy', base: 100, jitter: 0, digits: 0, unit: '% sync', tone: 'signal' },
    ],
    facts: [{ label: 'protocol', value: 'IEEE 62439-3 PRP' }],
    traffic: [{ label: 'L2 ↔ L1', value: 'EtherNet/IP + Modbus TCP' }],
  },

  /* L1 */
  plc1: {
    subtitle: 'PLC · CDU-100 train · Allen-Bradley CLX',
    summary: 'Primary controller for the crude distillation train. Ladder logic signed and hash-verified by Cortex anomaly.',
    metrics: [
      { label: 'scan time',      base: 8.4, jitter: 1.2, digits: 1, unit: 'ms', tone: 'cyan',   series: { min: 6, max: 14 } },
      { label: 'cpu',            base: 42,  jitter: 4,   digits: 0, unit: '%',  tone: 'snow',   series: { min: 30, max: 60 } },
      { label: 'ladder hash',    base: 1,   jitter: 0,   digits: 0, unit: 'gold', tone: 'signal' },
    ],
    facts: [
      { label: 'platform',  value: 'AB ControlLogix 5580' },
      { label: 'tags',      value: '4,820 (CDU train)' },
    ],
    traffic: [{ label: 'EtherNet/IP', value: 'L2 switch · 100 ms poll' }],
  },
  plc2: {
    subtitle: 'PLC · FCC train · Siemens S7-1500',
    summary: 'FCC riser + regenerator control. Multi-master safety.',
    metrics: [
      { label: 'scan time', base: 6.2, jitter: 0.8, digits: 1, unit: 'ms', tone: 'cyan',   series: { min: 4, max: 12 } },
      { label: 'cpu',       base: 38,  jitter: 4,   digits: 0, unit: '%',  tone: 'snow',   series: { min: 28, max: 58 } },
    ],
    facts: [{ label: 'platform', value: 'Siemens S7-1500 · F-CPU' }],
    traffic: [{ label: 'PROFINET', value: 'L2 switch · 50 ms' }],
  },
  plc3: {
    subtitle: 'PLC · Utilities · AB CompactLogix',
    summary: 'Utilities controller — cooling tower, instrument air, nitrogen, fuel gas header.',
    metrics: [
      { label: 'scan time', base: 12.4, jitter: 1.6, digits: 1, unit: 'ms', tone: 'cyan',   series: { min: 8, max: 18 } },
      { label: 'cpu',       base: 32,   jitter: 6,   digits: 0, unit: '%',  tone: 'snow',   series: { min: 20, max: 50 } },
    ],
    facts: [{ label: 'platform', value: 'AB CompactLogix 5380' }],
    traffic: [{ label: 'EtherNet/IP', value: 'L2 switch · 200 ms' }],
  },
  sis: {
    subtitle: 'SIS · Safety PLC · Triconex Tricon',
    summary: 'Safety-instrumented system. SIL-3. Air-gapped from BPCS where possible; hardwired ESD output.',
    metrics: [
      { label: 'safety loops',  base: 184, jitter: 0, digits: 0, unit: '', tone: 'cyan' },
      { label: 'demand · /yr',  base: 2,   jitter: 0, digits: 0, unit: '', tone: 'snow' },
      { label: 'PFD avg',       base: 8.4e-4, jitter: 0, digits: 4, unit: '', tone: 'signal' },
    ],
    facts: [
      { label: 'platform',  value: 'Schneider Triconex Tricon · TMR' },
      { label: 'sil',       value: 'SIL-3 · IEC 61511' },
    ],
    traffic: [{ label: 'BPCS', value: 'air-gapped / hardwired' }],
  },
  wifi: {
    subtitle: 'Plant Wi-Fi AP · IEEE 802.11ax · WPA3',
    summary: 'Outdoor industrial AP. Used by mobile operators and contractors. Cert-based authentication, not PSK.',
    metrics: [
      { label: 'clients',  base: 12, jitter: 4, digits: 0, unit: '', tone: 'cyan',   series: { min: 4, max: 24 } },
      { label: 'tx rate',  base: 180, jitter: 24, digits: 0, unit: 'Mbps', tone: 'snow', series: { min: 80, max: 300 } },
      { label: 'rogue APs', base: 0, jitter: 0, digits: 0, unit: '', tone: 'signal' },
    ],
    facts: [
      { label: 'auth',  value: 'WPA3 Enterprise · 802.1X' },
      { label: 'rf',    value: '5 GHz + 6 GHz' },
    ],
    traffic: [{ label: 'mobile + contractor', value: 'segmented VLAN · MAC filtered' }],
  },
  'l1-sw': {
    subtitle: 'L1 Field Switch · Cisco IE-3010',
    summary: 'Field-area Ethernet switch. Aggregates sensor and actuator traffic, uplinks to L2.',
    metrics: [
      { label: 'ports up',    base: 18,  jitter: 0,  digits: 0, unit: '/24', tone: 'cyan' },
      { label: 'throughput',  base: 84,  jitter: 16, digits: 0, unit: 'Mbps', tone: 'snow', series: { min: 40, max: 160 } },
      { label: 'CRC errors',  base: 0,   jitter: 0,  digits: 0, unit: '/min', tone: 'signal' },
    ],
    facts: [{ label: 'platform', value: 'Cisco IE-3010-24TC' }],
    traffic: [{ label: 'L0 ↔ L1', value: 'aggregated Ethernet' }],
  },

  /* L0 */
  'sensor-pump': {
    subtitle: 'PUMP-401 vibration sensor',
    summary: 'IFM vibration sensor on the bearing housing. 1 Hz to Cognite via the OPC-UA gateway.',
    metrics: [
      { label: 'vibration', base: 4.81, jitter: 0.6, digits: 2, unit: 'mm/s', tone: 'amber',  series: { min: 3, max: 7 } },
      { label: 'temp',      base: 78.4, jitter: 1.4, digits: 1, unit: '°C',   tone: 'snow',   series: { min: 70, max: 90 } },
      { label: 'quality',   base: 100,  jitter: 0,   digits: 0, unit: '%',    tone: 'signal' },
    ],
    facts: [
      { label: 'model',     value: 'IFM VVB001 + temperature' },
      { label: 'protocol',  value: 'OPC-UA · 1 Hz' },
    ],
    traffic: [{ label: 'to gateway', value: 'OPC-UA' }],
  },
  'sensor-cdu': {
    subtitle: 'CDU-100 PTs / TTs · HART 4–20 mA',
    summary: 'Pressure + temperature transmitters across the column. Loop-powered, HART for diagnostics.',
    metrics: [
      { label: 'top T',  base: 128, jitter: 3,  digits: 0, unit: '°C',  tone: 'cyan',   series: { min: 120, max: 140 } },
      { label: 'bot T',  base: 358, jitter: 4,  digits: 0, unit: '°C',  tone: 'amber',  series: { min: 340, max: 380 } },
      { label: 'top P',  base: 1.2, jitter: 0.05, digits: 2, unit: 'bar', tone: 'snow' },
      { label: 'loop',   base: 100, jitter: 0,  digits: 0, unit: '% good', tone: 'signal' },
    ],
    facts: [{ label: 'protocol', value: 'HART · 4–20 mA' }],
    traffic: [{ label: 'PLC-1 input', value: '24 channels' }],
  },
  analyzer: {
    subtitle: 'FCC analyzer · NIR Modbus',
    summary: 'Near-infrared online analyzer at the FCC riser. Used by Cortex yield regression.',
    metrics: [
      { label: 'gasoline %', base: 51.2, jitter: 0.4, digits: 1, unit: '', tone: 'signal', series: { min: 49, max: 54 } },
      { label: 'sulfur',     base: 8,    jitter: 2,   digits: 0, unit: 'ppm', tone: 'cyan', series: { min: 4, max: 14 } },
      { label: 'cycle',      base: 60,   jitter: 0,   digits: 0, unit: 's', tone: 'snow' },
    ],
    facts: [{ label: 'protocol', value: 'Modbus TCP · 1 reading / min' }],
    traffic: [{ label: 'PLC-2', value: 'Modbus poll' }],
  },
  flowmeter: {
    subtitle: 'FLOW-001 Coriolis meter',
    summary: 'Custody-grade Coriolis meter on the gasoline product line. 4–20 mA out plus pulse output.',
    metrics: [
      { label: 'flow',      base: 5200, jitter: 80,  digits: 0, unit: 'bbl/h', tone: 'cyan',  series: { min: 4800, max: 5800 } },
      { label: 'density',   base: 738,  jitter: 6,   digits: 0, unit: 'kg/m³', tone: 'snow' },
      { label: 'totalizer', base: 120,  jitter: 1,   digits: 0, unit: 'kbbl',  tone: 'signal' },
    ],
    facts: [{ label: 'protocol', value: '4–20 mA + HART + pulse' }],
    traffic: [{ label: 'PLC-1', value: 'analog input' }],
  },
  'actuator-fv': {
    subtitle: 'FV-101 control valve · HART positioner',
    summary: 'Globe valve with diaphragm actuator. Smart positioner with valve signature + travel diagnostics.',
    metrics: [
      { label: 'position',  base: 46,    jitter: 6,   digits: 0, unit: '%',  tone: 'cyan',  series: { min: 30, max: 70 } },
      { label: 'SP',        base: 48,    jitter: 5,   digits: 0, unit: '%',  tone: 'snow',  series: { min: 30, max: 70 } },
      { label: 'travel',    base: 1820,  jitter: 0,   digits: 0, unit: 'k cycles', tone: 'signal' },
    ],
    facts: [{ label: 'positioner', value: 'Fisher DVC6200 HART' }],
    traffic: [{ label: 'PLC-3 output', value: '4–20 mA + HART' }],
  },
  'motor-401': {
    subtitle: 'PUMP-401 motor · 4 kV TEFC',
    summary: '250 HP three-phase induction motor driving PUMP-401. VFD-controlled.',
    metrics: [
      { label: 'current',   base: 142, jitter: 4, digits: 0, unit: 'A',   tone: 'cyan',  series: { min: 120, max: 168 } },
      { label: 'power',     base: 186, jitter: 6, digits: 0, unit: 'kW',  tone: 'amber', series: { min: 160, max: 220 } },
      { label: 'temp · brg', base: 68, jitter: 2, digits: 0, unit: '°C',  tone: 'snow', series: { min: 58, max: 88 } },
    ],
    facts: [{ label: 'platform', value: 'WEG W22 · 250 HP · 4 kV' }],
    traffic: [{ label: 'PLC-3 / VFD', value: 'EtherNet/IP control' }],
  },
  'sis-elem': {
    subtitle: 'Final element · ESD valve',
    summary: 'Air-fail-closed shutdown valve on the crude charge line. SIS-controlled, hardwired.',
    metrics: [
      { label: 'position',     base: 100, jitter: 0, digits: 0, unit: '% open', tone: 'signal' },
      { label: 'demand · /yr', base: 1,   jitter: 0, digits: 0, unit: '',       tone: 'snow' },
      { label: 'stroke test',  base: 28,  jitter: 0, digits: 0, unit: 'd ago',  tone: 'cyan' },
    ],
    facts: [{ label: 'logic', value: 'SIL-3 · fail-closed' }],
    traffic: [{ label: 'SIS', value: 'hardwired · no Ethernet' }],
  },
}

/* ─── edge telemetry (per connector) ─────────────────────────────── */

interface EdgeTelemetry {
  protocol: string
  payload: string
  encryption: string
  authn: string
  metrics: NodeMetric[]
  notes: string[]
}

/**
 * Build a sensible edge telemetry object from the protocol class.
 * If a specific (from,to) edge needs different telemetry, return it from
 * the override map below.
 */
function defaultEdgeTelemetry(e: Edge): EdgeTelemetry {
  const key = `${e.from}>${e.to}`
  if (EDGE_OVERRIDES[key]) return EDGE_OVERRIDES[key]

  // Generic profile by tone + label heuristics
  const label = (e.label ?? '').toLowerCase()
  if (label.includes('https') || label.includes('odbc')) {
    return {
      protocol: 'HTTPS / ODBC · TLS 1.3',
      payload: 'JDBC result-sets · governed views',
      encryption: 'AES-256-GCM · cert-pinned',
      authn: 'OAuth2 + SCIM identity',
      metrics: [
        { label: 'queries · /s', base: 38,  jitter: 8,  digits: 0, unit: 'qps', tone: 'cyan',  series: { min: 18, max: 64 } },
        { label: 'avg payload',  base: 2.4, jitter: 0.4, digits: 1, unit: 'MB',  tone: 'snow',  series: { min: 0.8, max: 6 } },
        { label: 'latency',      base: 1.4, jitter: 0.3, digits: 1, unit: 's',   tone: 'signal', series: { min: 0.6, max: 3 } },
      ],
      notes: ['Decryption performed at the IDMZ firewall on allow-listed apps.'],
    }
  }
  if (label.includes('mpls') || label.includes('wan')) {
    return {
      protocol: 'WAN MPLS · IPSec AES-256',
      payload: 'corporate L3 traffic · VoIP + RDP + replication',
      encryption: 'IPSec tunnel · AES-256-GCM',
      authn: 'pre-shared key + certificate',
      metrics: [
        { label: 'throughput', base: 420, jitter: 60, digits: 0, unit: 'Mbps', tone: 'cyan',  series: { min: 220, max: 720 } },
        { label: 'latency',    base: 18,  jitter: 2,  digits: 0, unit: 'ms',   tone: 'snow',  series: { min: 12, max: 28 } },
        { label: 'jitter',     base: 0.8, jitter: 0.3, digits: 1, unit: 'ms',  tone: 'signal' },
      ],
      notes: ['Dual-carrier diversity for failover.'],
    }
  }
  if (label.includes('opc')) {
    return {
      protocol: 'OPC-UA · Binary · TLS',
      payload: 'tag values · 13,402 tags · 1 Hz',
      encryption: 'Basic256Sha256 · cert-trust list',
      authn: 'application certificate',
      metrics: [
        { label: 'samples · /s', base: 4820, jitter: 280, digits: 0, unit: 'pts', tone: 'cyan',   series: { min: 4000, max: 6200 } },
        { label: 'payload',      base: 1.4,  jitter: 0.2, digits: 1, unit: 'MB/s', tone: 'snow',   series: { min: 0.8, max: 2.4 } },
        { label: 'session age',  base: 14,   jitter: 0,   digits: 0, unit: 'h',     tone: 'signal' },
      ],
      notes: ['OPC-UA is the only allowed protocol across the OT edge firewall.'],
    }
  }
  if (label.includes('syslog')) {
    return {
      protocol: 'Syslog · TLS over TCP',
      payload: 'events from L1/L2 devices → SOC',
      encryption: 'TLS 1.3',
      authn: 'mutual cert',
      metrics: [
        { label: 'events · /s', base: 12000, jitter: 1400, digits: 0, unit: 'eps', tone: 'cyan',  series: { min: 8000, max: 18000 } },
        { label: 'parse rate',  base: 99.6,  jitter: 0.2,  digits: 1, unit: '%',   tone: 'signal' },
      ],
      notes: ['Indexed in Snowflake via Snowpipe Streaming for SOC + Cortex correlation.'],
    }
  }
  if (label.includes('sif') || label.includes('air-gap')) {
    return {
      protocol: 'Hardwired loop · 4–20 mA',
      payload: 'safety-instrumented function (SIF) · ESD',
      encryption: 'n/a (physical layer only)',
      authn: 'physical security · TMR voting',
      metrics: [
        { label: 'demand · /yr', base: 1, jitter: 0, digits: 0, unit: '', tone: 'snow' },
        { label: 'PFD avg',      base: 8.4e-4, jitter: 0, digits: 4, unit: '', tone: 'signal' },
      ],
      notes: ['No Ethernet path. SIS is independent of the BPCS for SIL-3 compliance.'],
    }
  }
  // protocol guess from neighbors
  if (e.from === 'plc3' || e.to === 'actuator-fv' || e.to === 'motor-401') {
    return {
      protocol: 'EtherNet/IP · CIP',
      payload: 'control commands + setpoints',
      encryption: 'optional (CIP Security)',
      authn: 'IP allow-list',
      metrics: [
        { label: 'packets · /s', base: 240, jitter: 24, digits: 0, unit: 'pps', tone: 'cyan',  series: { min: 160, max: 360 } },
        { label: 'latency',      base: 4.2, jitter: 0.4, digits: 1, unit: 'ms',  tone: 'signal', series: { min: 2, max: 8 } },
      ],
      notes: ['Deterministic ring-fenced VLAN on the L1 field switch.'],
    }
  }
  if (e.from === 'plc1' || e.from === 'plc2') {
    return {
      protocol: 'HART / 4–20 mA',
      payload: 'analog process variables + diagnostics',
      encryption: 'n/a',
      authn: 'physical loop',
      metrics: [
        { label: 'samples · /s', base: 16, jitter: 2, digits: 0, unit: '', tone: 'cyan' },
        { label: 'comm OK',      base: 100, jitter: 0, digits: 0, unit: '%', tone: 'signal' },
      ],
      notes: ['HART overlays on 4–20 mA loops for diagnostics.'],
    }
  }
  // generic interior link
  return {
    protocol: 'L3 routed · TCP/UDP',
    payload: 'mixed enterprise traffic',
    encryption: 'TLS where applicable',
    authn: 'corporate AD / OT AD',
    metrics: [
      { label: 'throughput', base: 84, jitter: 18, digits: 0, unit: 'Mbps', tone: 'cyan',   series: { min: 40, max: 180 } },
      { label: 'packets',    base: 14000, jitter: 1800, digits: 0, unit: 'pps', tone: 'snow', series: { min: 8000, max: 24000 } },
      { label: 'errors',     base: 0,   jitter: 0,  digits: 0, unit: '',     tone: 'signal' },
    ],
    notes: ['Inspected at the L3 boundary firewalls.'],
  }
}

const EDGE_OVERRIDES: Record<string, EdgeTelemetry> = {
  'snowflake>corp-rtr': {
    protocol: 'HTTPS · ODBC · TLS 1.3 (corp egress to Snowflake)',
    payload: 'governed query result-sets · JDBC',
    encryption: 'AES-256-GCM · cert-pinned',
    authn: 'OAuth2 + SCIM identity',
    metrics: [
      { label: 'queries · /min', base: 1820, jitter: 220, digits: 0, unit: 'qpm', tone: 'cyan',  series: { min: 1400, max: 2400 } },
      { label: 'avg duration',   base: 1.4,  jitter: 0.3, digits: 1, unit: 's',   tone: 'signal' },
      { label: 'data out',       base: 6.2,  jitter: 0.8, digits: 1, unit: 'GB/h', tone: 'snow', series: { min: 4, max: 12 } },
    ],
    notes: ['No raw OT data leaves the IDMZ — only gold semantic views.'],
  },
  'fw-up>fw-dn': {
    protocol: 'OPC-UA only · allow-listed flow',
    payload: 'tag values from OT to Cognite gateway',
    encryption: 'Basic256Sha256',
    authn: 'application certificate · mTLS',
    metrics: [
      { label: 'samples · /s', base: 4820, jitter: 280, digits: 0, unit: 'pts', tone: 'cyan', series: { min: 4000, max: 6200 } },
      { label: 'denied · /min', base: 412, jitter: 56, digits: 0, unit: '', tone: 'flare', series: { min: 240, max: 720 } },
    ],
    notes: ['Default-deny stance. Every flow that traverses this edge has an explicit rule.'],
  },
  'l2-sw>sis': {
    protocol: 'air-gap preferred · diagnostic-only Ethernet',
    payload: 'health/status of safety PLC',
    encryption: 'n/a',
    authn: 'physical isolation',
    metrics: [
      { label: 'demand', base: 1, jitter: 0, digits: 0, unit: '/yr', tone: 'snow' },
    ],
    notes: ['Process-control loop is hardwired. Ethernet to SIS exists for read-only diagnostics only.'],
  },
}

/* ─── helpers ─────────────────────────────────────────────────────── */

function findNode(id: string) {
  return NODES.find((n) => n.id === id)!
}

function toneColor(tone?: 'cyan' | 'amber' | 'signal' | 'snow' | 'flare' | 'alarm') {
  switch (tone) {
    case 'cyan':   return C.cyan
    case 'amber':  return C.amber
    case 'signal': return C.signal
    case 'snow':   return C.snow
    case 'flare':  return C.flare
    case 'alarm':  return C.alarm
    default:       return C.snow
  }
}

/* ─── node icon ───────────────────────────────────────────────────── */

/** Lucide-style snowflake glyph as SVG paths so we can drop it inline. */
function SnowflakeGlyph({ size = 30, color = '#1ea7ff' }: { size?: number; color?: string }) {
  const half = size / 2
  return (
    <g
      transform={`translate(${-half},${-half})`}
      stroke={color}
      strokeWidth="1.8"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={`M ${half - half},${half} h ${size}`} />
      <path d={`M ${half},${half - half} v ${size}`} />
      <path d={`M ${size - 4},${half + 4} l -4,-4 l 4,-4`} />
      <path d={`M 4,${half - 4} l 4,4 l -4,4`} />
      <path d={`M ${half - 4},4 l 4,4 l 4,-4`} />
      <path d={`M ${half + 4},${size - 4} l -4,-4 l -4,4`} />
    </g>
  )
}

function NodeIcon({ kind, id }: { kind: NetNode['kind']; id?: string }) {
  if (id === 'snowflake') {
    return (
      <g>
        {/* glow halo */}
        <circle r="22" fill="#1ea7ff" opacity="0.12" />
        <circle r="14" fill={C.bg} stroke={C.snow} strokeWidth="1.5" />
        <SnowflakeGlyph size={20} color="#4ee2f4" />
      </g>
    )
  }
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
  const [selected, setSelected] = useState<
    | { kind: 'node'; id: string }
    | { kind: 'edge'; idx: number }
    | null
  >(null)
  const [snowflakeOpen, setSnowflakeOpen] = useState(false)

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

  function handleNodeClick(id: string) {
    if (id === 'snowflake') {
      setSnowflakeOpen(true)
      setSelected({ kind: 'node', id })
      return
    }
    setSelected({ kind: 'node', id })
  }
  function handleEdgeClick(idx: number) {
    setSelected({ kind: 'edge', idx })
  }

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

      {/* Topology + telemetry panel */}
      <div className="grid grid-cols-[1fr_400px] gap-4 items-stretch">
        <Panel className="flex flex-col">
          <PanelHeader label="REFINERY NETWORK · PURDUE STACK" hint="click nodes + wires">
            <Badge tone="cyan">SVG</Badge>
            <Badge tone="signal">live</Badge>
          </PanelHeader>
          <div className="p-2 flex-1 min-h-0">
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
                const isSel = selected?.kind === 'edge' && selected.idx === i
                return (
                  <g key={i} className="cursor-pointer" onClick={() => handleEdgeClick(i)}>
                    {/* Wide invisible hit-target */}
                    <line x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                          stroke="transparent" strokeWidth="12" />
                    {/* Visible line */}
                    <line x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                          stroke={color}
                          strokeOpacity={isSel ? 1 : 0.45}
                          strokeWidth={isSel ? 2.6 : 1.2}
                          style={{ filter: isSel ? `drop-shadow(0 0 5px ${color})` : undefined }} />
                    {e.label && (
                      <text
                        x={(a.x + b.x) / 2}
                        y={(a.y + b.y) / 2 - 4}
                        fontSize="8"
                        fill={isSel ? color : C.inkDim}
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
              {NODES.map((n) => {
                const isSel = selected?.kind === 'node' && selected.id === n.id
                return (
                  <g
                    key={n.id}
                    transform={`translate(${n.x},${n.y})`}
                    className="cursor-pointer"
                    onClick={() => handleNodeClick(n.id)}
                  >
                    {/* hit area */}
                    <circle r="24" fill="transparent" />
                    {/* selection halo */}
                    {isSel && (
                      <circle r="22" fill="none" stroke={C.cyan} strokeWidth="1.5"
                              style={{ filter: 'drop-shadow(0 0 6px #4ee2f4)' }} />
                    )}
                    <NodeIcon kind={n.kind} id={n.id} />
                    <text y="26" fontSize="9.5" fill={isSel ? C.cyan : C.ink} textAnchor="middle">{n.label}</text>
                    {n.sub && <text y="38" fontSize="8" fill={C.inkDim} textAnchor="middle">{n.sub}</text>}
                  </g>
                )
              })}
            </svg>
          </div>
        </Panel>

        {/* Telemetry side panel */}
        <TelemetrySide
          selected={selected}
          onClose={() => setSelected(null)}
          onOpenSnowflake={() => setSnowflakeOpen(true)}
        />
      </div>

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

      {/* ─── DeltaV deployment diagram (DCS) ─────────────────────── */}
      <DeltaVDeployment />

      {/* Snowflake AI Data Cloud — full-screen modal */}
      {snowflakeOpen && <SnowflakeDeploymentModal onClose={() => setSnowflakeOpen(false)} />}
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

/* ════════════════════════════════════════════════════════════════════
   TELEMETRY SIDE PANEL — animated, device-specific
   ════════════════════════════════════════════════════════════════════ */

type TelemetrySelection =
  | { kind: 'node'; id: string }
  | { kind: 'edge'; idx: number }
  | null

function TelemetrySide({
  selected,
  onClose,
  onOpenSnowflake,
}: {
  selected: TelemetrySelection
  onClose: () => void
  onOpenSnowflake: () => void
}) {
  if (!selected) {
    return (
      <Panel className="p-4 flex flex-col items-center justify-center text-center">
        <div className="tag text-ink-muted mb-2">TELEMETRY</div>
        <div className="font-cond text-ink-dim text-[13px] leading-relaxed max-w-[260px]">
          Click any <span className="text-cyan">node</span> or <span className="text-amber">connector</span> to see device-specific telemetry, traffic profile and live counters.
        </div>
      </Panel>
    )
  }

  if (selected.kind === 'node') {
    const node = NODES.find((n) => n.id === selected.id)
    const tel  = NODE_TELEMETRY[selected.id]
    if (!node || !tel) return null
    return (
      <Panel className="flex flex-col">
        <PanelHeader label={`NODE · ${node.label}`} hint={tel.subtitle}>
          <Badge tone="cyan">{node.layer}</Badge>
          <button onClick={onClose} className="ml-1 p-1 text-ink-muted hover:text-cyan transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </PanelHeader>
        <div className="p-4 flex flex-col gap-3 overflow-y-auto max-h-[640px]">
          <div className="font-mono text-[10.5px] text-ink leading-relaxed border-l-2 border-cyan/40 pl-3">
            {tel.summary}
          </div>
          {/* Open big modal hint for Snowflake */}
          {node.id === 'snowflake' && (
            <button
              onClick={onOpenSnowflake}
              className="self-start inline-flex items-center gap-2 px-3 py-1.5 border border-cyan text-cyan bg-cyan/10 hover:bg-cyan/20 font-cond text-[11px] uppercase tracking-[0.16em] font-semibold transition-colors"
            >
              <SnowflakeIcon className="w-3.5 h-3.5" />
              Open deployment map
            </button>
          )}
          <MetricGrid metrics={tel.metrics} />
          <Panel className="bg-transparent">
            <PanelHeader label="FACTS" hint="static" />
            <div className="py-1">
              {tel.facts.map((f) => <DataRow key={f.label} label={f.label} value={f.value} />)}
            </div>
          </Panel>
          <Panel className="bg-transparent">
            <PanelHeader label="TRAFFIC" hint="profile" />
            <div className="py-1">
              {tel.traffic.map((t) => <DataRow key={t.label} label={t.label} value={t.value} tone="cyan" />)}
            </div>
          </Panel>
        </div>
      </Panel>
    )
  }

  // edge selected
  const edge = EDGES[selected.idx]
  if (!edge) return null
  const a = NODES.find((n) => n.id === edge.from)
  const b = NODES.find((n) => n.id === edge.to)
  const tel = defaultEdgeTelemetry(edge)
  return (
    <Panel className="flex flex-col">
      <PanelHeader label={`WIRE · ${a?.label ?? edge.from} → ${b?.label ?? edge.to}`} hint={tel.protocol}>
        <Badge tone="amber">CONNECTOR</Badge>
        <button onClick={onClose} className="ml-1 p-1 text-ink-muted hover:text-cyan transition-colors">
          <X className="w-3.5 h-3.5" />
        </button>
      </PanelHeader>
      <div className="p-4 flex flex-col gap-3 overflow-y-auto max-h-[640px]">
        <div className="font-mono text-[10.5px] text-ink leading-relaxed border-l-2 border-amber/40 pl-3">
          {tel.payload}
        </div>
        <Panel className="bg-transparent">
          <PanelHeader label="CONTRACT" hint="data plane" />
          <div className="py-1">
            <DataRow label="protocol"   value={tel.protocol}   tone="cyan" />
            <DataRow label="payload"    value={tel.payload}    tone="snow" />
            <DataRow label="encryption" value={tel.encryption} tone="signal" />
            <DataRow label="authn"      value={tel.authn}      tone="signal" />
          </div>
        </Panel>
        <MetricGrid metrics={tel.metrics} />
        {tel.notes.length > 0 && (
          <div className="bg-cyan/5 border border-cyan/30 px-3 py-2 text-[10.5px] font-mono leading-relaxed text-snow space-y-1">
            <span className="tag text-cyan">NOTES</span>
            {tel.notes.map((n, i) => <div key={i}>{n}</div>)}
          </div>
        )}
        <div className="font-mono text-[10px] text-ink-muted">
          ts {shortTime()}
        </div>
      </div>
    </Panel>
  )
}

/* ─── animated metric grid (mini-sparklines) ─────────────────────── */

function MetricGrid({ metrics }: { metrics: NodeMetric[] }) {
  // Each metric maintains a small rolling history of jittered values.
  const [history, setHistory] = useState<number[][]>(() =>
    metrics.map((m) => Array.from({ length: 24 }, () => m.base)),
  )

  useEffect(() => {
    // Reset history when metrics array identity changes
    setHistory(metrics.map((m) => Array.from({ length: 24 }, () => m.base)))
  }, [metrics])

  useEffect(() => {
    const id = window.setInterval(() => {
      setHistory((prev) =>
        prev.map((arr, i) => {
          const m = metrics[i]
          const next = m.base + (Math.random() - 0.5) * 2 * m.jitter
          return [...arr.slice(1), next]
        }),
      )
    }, 900)
    return () => window.clearInterval(id)
  }, [metrics])

  return (
    <div className="grid grid-cols-2 gap-2">
      {metrics.map((m, i) => {
        const series = history[i] ?? []
        const last = series[series.length - 1] ?? m.base
        const display = m.digits !== undefined ? last.toFixed(m.digits) : last.toString()
        const tone = m.tone ?? 'cyan'
        const toneColor = tone === 'amber' ? C.amber : tone === 'flare' ? C.flare : tone === 'alarm' ? C.alarm : tone === 'signal' ? C.signal : tone === 'snow' ? C.snow : C.cyan
        return (
          <div key={m.label} className="border border-edge-subtle bg-bg-base/40 p-2">
            <div className="tag" style={{ color: toneColor }}>{m.label}</div>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="font-mono tabular-nums text-[14px]" style={{ color: toneColor }}>{display}</span>
              {m.unit && <span className="font-mono text-[10px] text-ink-muted">{m.unit}</span>}
            </div>
            {/* Sparkline */}
            {m.series && (
              <Sparkline series={series} min={m.series.min} max={m.series.max} color={toneColor} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function Sparkline({ series, min, max, color }: { series: number[]; min: number; max: number; color: string }) {
  if (series.length < 2) return null
  const W = 100
  const H = 22
  const span = max - min || 1
  const pts = series.map((v, i) => {
    const x = (i / (series.length - 1)) * W
    const y = H - ((v - min) / span) * H
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${Math.max(0, Math.min(H, y)).toFixed(1)}`
  }).join(' ')
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-5 mt-1">
      <path d={pts} fill="none" stroke={color} strokeWidth="1.2" opacity="0.95" />
      <circle cx={W} cy={H - ((series[series.length - 1] - min) / span) * H} r="1.8" fill={color} />
    </svg>
  )
}

/* ════════════════════════════════════════════════════════════════════
   SNOWFLAKE DEPLOYMENT MODAL — full-screen, every instance clickable
   ════════════════════════════════════════════════════════════════════ */

interface SfInstance {
  id: string
  group: string
  label: string
  detail: string
  tone: 'cyan' | 'amber' | 'signal' | 'snow' | 'flare'
}

const SF_GROUPS: { key: string; title: string; instances: SfInstance[] }[] = [
  {
    key: 'cloud-services',
    title: 'CLOUD SERVICES LAYER · stateless',
    instances: [
      { id: 'auth',       group: 'cloud', label: 'Authentication',       detail: 'SAML 2.0 + SCIM · OAuth2 · key-pair · MFA',   tone: 'cyan' },
      { id: 'optimizer',  group: 'cloud', label: 'Optimizer',            detail: 'cost-based planner · adaptive query graph',   tone: 'snow' },
      { id: 'metadata',   group: 'cloud', label: 'Metadata Store',       detail: 'FoundationDB · ACID · global',                tone: 'cyan' },
      { id: 'security',   group: 'cloud', label: 'Security Manager',     detail: 'RBAC · masking · row-access policies',        tone: 'amber' },
      { id: 'horizon',    group: 'cloud', label: 'Horizon Catalog',      detail: 'lineage · classification · discovery',        tone: 'cyan' },
      { id: 'mp',         group: 'cloud', label: 'Marketplace + Sharing', detail: 'zero-copy outbound + Marketplace listings',  tone: 'signal' },
    ],
  },
  {
    key: 'compute',
    title: 'COMPUTE · virtual warehouses (per-workload)',
    instances: [
      { id: 'wh-ops',   group: 'compute', label: 'WH_OPS · M (auto)',         detail: 'operator queries · 1–3 clusters · 60 s auto-suspend', tone: 'cyan' },
      { id: 'wh-ml',    group: 'compute', label: 'WH_ML · L',                 detail: 'Cortex retraining · nightly · 1 cluster',           tone: 'cyan' },
      { id: 'wh-bi',    group: 'compute', label: 'WH_BI · XS',                detail: 'BI dashboards · result-set cache',                  tone: 'cyan' },
      { id: 'wh-load',  group: 'compute', label: 'WH_LOAD · M',               detail: 'Snowpipe ingest workers',                           tone: 'cyan' },
      { id: 'spcs',     group: 'compute', label: 'Snowpark Container Services', detail: 'M-2node · PuLP, scikit-learn, custom Weibull',  tone: 'amber' },
      { id: 'spark',    group: 'compute', label: 'Cortex Serverless',         detail: 'FORECAST · ANOMALY · ANALYST · AGENTS',             tone: 'flare' },
    ],
  },
  {
    key: 'storage',
    title: 'STORAGE · cloud blob · micro-partitioned',
    instances: [
      { id: 'gold',     group: 'storage', label: 'GOLD · semantic',     detail: '~64 dynamic tables · governed',                   tone: 'cyan' },
      { id: 'silver',   group: 'storage', label: 'SILVER · staging',    detail: '~18 dynamic tables · 1m TARGET_LAG',              tone: 'snow' },
      { id: 'bronze',   group: 'storage', label: 'BRONZE · raw',        detail: 'zero-copy + Snowpipe landing · 90d Time Travel',  tone: 'snow' },
      { id: 'shares',   group: 'storage', label: 'INBOUND SHARES',      detail: 'Cognite + SAP BDC',                               tone: 'signal' },
      { id: 'iceberg',  group: 'storage', label: 'Iceberg Tables',      detail: 'open-format option · exit-ready',                 tone: 'snow' },
      { id: 'stage',    group: 'storage', label: 'External Stages',     detail: 'S3 · Sirion JSON · MFT inbound',                  tone: 'snow' },
    ],
  },
  {
    key: 'data-cloud',
    title: 'DATA CLOUD · regions + marketplace',
    instances: [
      { id: 'us-east-2', group: 'cloud', label: 'AWS us-east-2',        detail: 'primary deployment',                              tone: 'cyan' },
      { id: 'us-west-2', group: 'cloud', label: 'AWS us-west-2',        detail: 'DR replica · cross-region replication',           tone: 'amber' },
      { id: 'azure-we',  group: 'cloud', label: 'Azure West Europe',    detail: 'optional · regulatory boundary',                  tone: 'snow' },
      { id: 'marketplace', group: 'cloud', label: 'Marketplace shares', detail: 'AccuWeather · S&P · Moody\'s · Cybersyn · OFAC',  tone: 'signal' },
    ],
  },
  {
    key: 'security',
    title: 'SECURITY · perimeter + identity',
    instances: [
      { id: 'pl',       group: 'sec', label: 'PrivateLink',          detail: 'no public endpoints · VPC peered',          tone: 'amber' },
      { id: 'byok',     group: 'sec', label: 'Tri-Secret Secure · BYOK', detail: 'AWS KMS customer-managed keys',          tone: 'flare' },
      { id: 'scim',     group: 'sec', label: 'SCIM + SAML',          detail: 'Azure Entra ID · auto-provision',           tone: 'cyan' },
      { id: 'audit',    group: 'sec', label: 'Audit · QUERY_HISTORY', detail: '1-yr retention · 7-yr cold via clones',    tone: 'snow' },
      { id: 'mask',     group: 'sec', label: 'Dynamic Masking',      detail: 'counterparty · PII · MNPI',                 tone: 'amber' },
      { id: 'rap',     group: 'sec', label: 'Row-Access Policies',  detail: 'unit-scoped operator views',                tone: 'amber' },
    ],
  },
]

const SF_DETAILS: Record<string, { summary: string; bullets: string[] }> = {
  auth:       { summary: 'Identity gateway. SAML + OAuth + key-pair. MFA enforced for human accounts; key-pair for service principals.', bullets: ['Azure Entra federation', 'SCIM auto-provision', 'session policies'] },
  optimizer:  { summary: 'Cost-based query optimizer. Builds an adaptive query graph based on micro-partition statistics.', bullets: ['~50 ms plan', 'partition pruning', 'join order rewrite'] },
  metadata:   { summary: 'Globally-replicated metadata store backing every table, share, and Time-Travel pointer.', bullets: ['FoundationDB-class', 'ACID', 'no separate index to manage'] },
  security:   { summary: 'Centralized policy engine. RBAC + masking + row-access policies + secure UDFs.', bullets: ['27 roles', '14 masking policies', '8 row-access policies'] },
  horizon:    { summary: 'Column-level lineage from source to recommendation. Auto-classification for PII/MNPI/ITAR.', bullets: ['13.4k columns', 'replay via AT(TIMESTAMP)', 'tag-based discovery'] },
  mp:         { summary: 'Outbound zero-copy + Marketplace listings. Customer retains ownership.', bullets: ['shares to Cognite + Quorum writeback', 'CDP/TCFD outbound'] },
  'wh-ops':   { summary: 'Operator console workload. M-size, auto-scaled 1–3 clusters, 60 s auto-suspend.', bullets: ['~192 credits/mo', '< 3 s p95', 'multi-cluster on burst'] },
  'wh-ml':    { summary: 'Nightly Cortex retraining + Weibull fits + LP solves.', bullets: ['~96 credits/mo', 'L-size single cluster'] },
  'wh-bi':    { summary: 'BI dashboards via Sigma / Tableau / Streamlit. Heavy caching.', bullets: ['~16 credits/mo', 'result-set cache 24 h'] },
  'wh-load':  { summary: 'Snowpipe Streaming ingest workers. Auto-scaled.', bullets: ['Quorum/Endur Kafka', '5k events/s typical'] },
  spcs:       { summary: 'Snowpark Container Services. PuLP/HiGHS/scikit-learn inside the Snowflake security boundary.', bullets: ['blend-opt:1.4', 'pump-health:2.1', 'vrp-route:1.2'] },
  spark:      { summary: 'Cortex serverless functions. FORECAST, ANOMALY_DETECTION, SENTIMENT, SEARCH, Analyst, Agents.', bullets: ['~12k calls/mo', 'p95 < 2 s'] },
  gold:       { summary: 'Semantic refinery ontology. Dynamic tables refreshed at 5–15 min TARGET_LAG.', bullets: ['UNIT_MARGINS', 'PUMP_FEATURES', 'CONTRACT_DELIVERY'] },
  silver:     { summary: 'Cleaned, deduplicated and harmonized records. 1-min TARGET_LAG.', bullets: ['lineage attached', 'idempotent'] },
  bronze:     { summary: 'Raw landing. Zero-copy shares + Snowpipe destinations. 90-day Time Travel.', bullets: ['no transformation', 'idempotent ingest'] },
  shares:     { summary: 'Inbound zero-copy shares from Cognite Data Fusion and SAP Business Data Cloud.', bullets: ['no ETL', 'governed view'] },
  iceberg:    { summary: 'Iceberg-format tables option. Customer retains exit-readiness.', bullets: ['open format', 'compatible with Athena, Trino, Spark'] },
  stage:      { summary: 'External stages on S3 / Azure / GCS for file-based ingest.', bullets: ['Sirion JSON exports', 'MFT inbound'] },
  'us-east-2':{ summary: 'Primary deployment. AWS us-east-2.', bullets: ['multi-AZ', 'PrivateLink to TxR VPC'] },
  'us-west-2':{ summary: 'Disaster recovery replica. Cross-region replication.', bullets: ['15-min RPO', '1-h RTO'] },
  'azure-we': { summary: 'Optional Azure West Europe deployment for European regulatory boundary.', bullets: ['Cross-cloud replication', 'Cognite federation supported'] },
  marketplace:{ summary: 'One-click Marketplace subscriptions. Zero storage cost.', bullets: ['AccuWeather', 'S&P Capital IQ', 'Moody\'s', 'Cybersyn', 'OFAC'] },
  pl:         { summary: 'PrivateLink termination. No public endpoint.', bullets: ['VPC peered', 'no internet egress'] },
  byok:       { summary: 'Tri-Secret Secure. Customer-managed keys via AWS KMS.', bullets: ['HSM-backed', 'customer-owned'] },
  scim:       { summary: 'SCIM + SAML federation. Auto-provision and de-provision.', bullets: ['Azure Entra', 'group-mapped to roles'] },
  audit:      { summary: 'QUERY_HISTORY · LOGIN_HISTORY · ACCESS_HISTORY. 1-year hot.', bullets: ['append-only', 'replayable'] },
  mask:       { summary: 'Dynamic data masking on counterparty names, MNPI, PII.', bullets: ['policy-driven', 'role-aware'] },
  rap:        { summary: 'Row-access policies on operators (unit-scoped) and traders (desk-scoped).', bullets: ['unit-scoped', 'desk-scoped'] },
}

function SnowflakeDeploymentModal({ onClose }: { onClose: () => void }) {
  const [activeId, setActiveId] = useState<string | null>(null)

  const active = useMemo(() => {
    if (!activeId) return null
    for (const g of SF_GROUPS) {
      const inst = g.instances.find((i) => i.id === activeId)
      if (inst) return { inst, detail: SF_DETAILS[inst.id] }
    }
    return null
  }, [activeId])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed left-[228px] right-0 z-50 flex justify-center pointer-events-none"
      style={{ top: 'calc(92px + 12px)', bottom: 'calc(36px + 12px)' }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="pointer-events-auto bg-bg-base/95 backdrop-blur-sm border border-edge-subtle shadow-2xl flex flex-col w-full max-w-[1500px] mx-4 overflow-hidden"
        style={{ height: 'min(90vh, calc(100vh - 92px - 36px - 24px))' }}
      >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-edge-subtle shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <SnowflakeIcon className="w-7 h-7 text-snow" strokeWidth={1.5} />
            <span className="absolute inset-0 blur-md opacity-50">
              <SnowflakeIcon className="w-7 h-7 text-snow" strokeWidth={1.5} />
            </span>
          </div>
          <div className="leading-tight">
            <div className="tag text-ink-muted">SNOWFLAKE AI DATA CLOUD · DEPLOYMENT MAP</div>
            <div className="font-display text-xl font-bold tracking-tight">All instance types · click any node</div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="inline-flex items-center gap-2 px-3 py-2 border border-edge-strong text-ink-dim hover:border-cyan hover:text-cyan transition-colors"
        >
          <X className="w-4 h-4" />
          <span className="font-cond text-[11px] uppercase tracking-[0.16em]">close · ESC</span>
        </button>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-[1fr_400px] gap-4 p-4 flex-1 min-h-0 overflow-hidden">
        {/* Groups */}
        <div className="space-y-4 overflow-y-auto min-h-0 pr-1">
          {SF_GROUPS.map((g) => (
            <Panel key={g.key}>
              <PanelHeader label={g.title} hint={`${g.instances.length} instances`}>
                <Badge tone="cyan">click any</Badge>
              </PanelHeader>
              <div className="p-3 grid grid-cols-2 lg:grid-cols-3 gap-2">
                {g.instances.map((inst) => {
                  const isSel = activeId === inst.id
                  const toneCls =
                    inst.tone === 'amber'  ? 'border-amber/60 text-amber' :
                    inst.tone === 'signal' ? 'border-signal/60 text-signal' :
                    inst.tone === 'snow'   ? 'border-snow/60 text-snow' :
                    inst.tone === 'flare'  ? 'border-flare/60 text-flare' :
                                              'border-cyan/60 text-cyan'
                  return (
                    <button
                      key={inst.id}
                      onClick={() => setActiveId(inst.id)}
                      className={cn(
                        'group text-left p-3 border bg-bg-panel/60 transition-all',
                        isSel ? 'border-cyan bg-cyan/10' : `${toneCls} hover:bg-bg-panel/90`,
                      )}
                    >
                      <div className="font-cond text-[13px] font-semibold leading-tight">{inst.label}</div>
                      <div className="font-mono text-[10px] text-ink-muted mt-1 leading-relaxed">{inst.detail}</div>
                    </button>
                  )
                })}
              </div>
            </Panel>
          ))}
        </div>

        {/* Detail pane */}
        <Panel className="flex flex-col min-h-0 overflow-hidden">
          <PanelHeader label="INSTANCE DETAIL" hint={active?.inst.label ?? 'pick a node'}>
            {active && <Badge tone="cyan">{active.inst.id}</Badge>}
          </PanelHeader>
          <div className="p-4 flex-1 min-h-0 overflow-y-auto">
            {!active && (
              <div className="text-ink-muted font-mono text-[11px]">
                Click any instance tile on the left to see what it does and how it&apos;s deployed.
              </div>
            )}
            {active && (
              <div className="space-y-3">
                <div className="font-display text-lg font-bold tracking-tight">{active.inst.label}</div>
                <div className="font-mono text-[11px] text-ink-muted leading-relaxed">{active.detail?.summary}</div>
                {active.detail && (
                  <ul className="space-y-1 font-mono text-[11px]">
                    {active.detail.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-2 border-b border-edge-subtle/60 last:border-b-0 py-1">
                        <span className="led led-green animate-pulse-soft mt-1" />
                        <span className="text-ink">{b}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </Panel>
      </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   DELTAV DEPLOYMENT — DCS with CHARM panel
   ════════════════════════════════════════════════════════════════════ */

interface DvNode {
  id: string
  label: string
  sub?: string
  kind: 'pro-plus' | 'station' | 'controller' | 'switch' | 'charms-cu' | 'wireless-io' | 'remote' | 'historian'
  x: number
  y: number
}

const DV_W = 1240
const DV_H = 480

const DV_NODES: DvNode[] = [
  /* App / engineering layer */
  { id: 'pro-plus',  label: 'ProfessionalPLUS', sub: 'master DB · engineering',  kind: 'pro-plus',   x: 120, y: 60 },
  { id: 'app-srv',   label: 'Application Stn',   sub: 'OPC UA · ODBC · history',  kind: 'station',    x: 320, y: 60 },
  { id: 'hist-dv',   label: 'DeltaV Historian',  sub: 'continuous + event',       kind: 'historian',  x: 520, y: 60 },
  { id: 'web-srv',   label: 'DeltaV Web Server', sub: 'remote ops · iOps',        kind: 'station',    x: 720, y: 60 },
  { id: 'asset-mgr', label: 'AMS Device Mgr',    sub: 'HART · diagnostics',       kind: 'station',    x: 920, y: 60 },
  { id: 'cyber',     label: 'Cyber DeltaV Smart Switch', sub: 'mgmt + IDS',       kind: 'switch',     x: 1120, y: 60 },

  /* Operator layer */
  { id: 'op1',       label: 'Operator Stn #1',   sub: 'control rm A · CDU',       kind: 'station',    x: 220, y: 180 },
  { id: 'op2',       label: 'Operator Stn #2',   sub: 'control rm A · FCC',       kind: 'station',    x: 420, y: 180 },
  { id: 'op3',       label: 'Operator Stn #3',   sub: 'control rm B · utilities', kind: 'station',    x: 620, y: 180 },
  { id: 'remote-1',  label: 'Remote Operator',   sub: 'iOps · Houston',           kind: 'remote',     x: 820, y: 180 },
  { id: 'sw-acn',    label: 'Area Control Network', sub: 'ACN · GE/Cisco · redundant', kind: 'switch', x: 1020, y: 180 },

  /* Control network / controllers */
  { id: 'mx-ctlr',   label: 'M-series MX',       sub: 'CDU train · primary',      kind: 'controller', x: 120, y: 320 },
  { id: 'sx-ctlr',   label: 'S-series SX',       sub: 'FCC train',                kind: 'controller', x: 320, y: 320 },
  { id: 'sd-ctlr',   label: 'SD Plus',           sub: 'utilities · CHARMs host',  kind: 'controller', x: 520, y: 320 },
  { id: 'safe-ctlr', label: 'SIS Logic Solver',  sub: 'SLS 1500 · TÜV-cert SIL-3', kind: 'controller', x: 720, y: 320 },
  { id: 'cu1',       label: 'CHARM I/O Cabinet 1', sub: '96 CIOC channels',       kind: 'charms-cu',  x: 920, y: 320 },
  { id: 'cu2',       label: 'CHARM I/O Cabinet 2', sub: '96 CIOC channels',       kind: 'charms-cu',  x: 1120, y: 320 },

  /* Wireless / remote IO */
  { id: 'wio',       label: 'Wireless I/O Gateway', sub: 'WirelessHART · 1410',   kind: 'wireless-io', x: 320, y: 420 },
  { id: 'rio',       label: 'Remote I/O · ZL', sub: 'fiber loop · long-haul',     kind: 'wireless-io', x: 520, y: 420 },
]

const DV_EDGES: { from: string; to: string; tone?: 'cyan' | 'snow' | 'amber' | 'signal' | 'flare' }[] = [
  /* Plant ACN backbone */
  { from: 'pro-plus',  to: 'app-srv', tone: 'cyan' },
  { from: 'app-srv',   to: 'hist-dv', tone: 'cyan' },
  { from: 'hist-dv',   to: 'web-srv', tone: 'cyan' },
  { from: 'web-srv',   to: 'asset-mgr', tone: 'cyan' },
  { from: 'asset-mgr', to: 'cyber',    tone: 'cyan' },

  { from: 'pro-plus', to: 'op1', tone: 'snow' },
  { from: 'pro-plus', to: 'op2', tone: 'snow' },
  { from: 'pro-plus', to: 'op3', tone: 'snow' },
  { from: 'web-srv',  to: 'remote-1', tone: 'amber' },
  { from: 'op3',      to: 'sw-acn', tone: 'snow' },

  /* Controllers */
  { from: 'sw-acn',  to: 'mx-ctlr',  tone: 'cyan' },
  { from: 'sw-acn',  to: 'sx-ctlr',  tone: 'cyan' },
  { from: 'sw-acn',  to: 'sd-ctlr',  tone: 'cyan' },
  { from: 'sw-acn',  to: 'safe-ctlr', tone: 'flare' },

  /* CHARMs cabinets to SD controller */
  { from: 'sd-ctlr', to: 'cu1', tone: 'signal' },
  { from: 'sd-ctlr', to: 'cu2', tone: 'signal' },

  /* Wireless + remote IO into MX/SX */
  { from: 'mx-ctlr', to: 'wio', tone: 'snow' },
  { from: 'sx-ctlr', to: 'rio', tone: 'snow' },
]

interface DvDetail {
  subtitle: string
  summary: string
  facts: { label: string; value: string }[]
}

const DV_DETAILS: Record<string, DvDetail> = {
  'pro-plus': { subtitle: 'ProfessionalPLUS · master engineering DB',
    summary: 'Master node for the DeltaV system database. Owns control modules, displays, history config and user roles. One per system.',
    facts: [
      { label: 'role',      value: 'master · authoritative' },
      { label: 'redundancy', value: 'cold-standby + nightly backup' },
      { label: 'os',        value: 'Windows Server 2022 LTSC' },
    ],
  },
  'app-srv':  { subtitle: 'Application Station · OPC UA + ODBC',
    summary: 'Exposes DeltaV data over OPC UA, ODBC and the OEE / Batch services to Snowflake, MES and SCADA.',
    facts: [{ label: 'protocols', value: 'OPC UA · ODBC · OPC DA' }, { label: 'role', value: 'data gateway' }],
  },
  'hist-dv':  { subtitle: 'DeltaV Continuous + Event Historian',
    summary: 'Sub-second continuous history + event chronological. Replicates to Aspen IP21 via OPC UA, then to Snowflake.',
    facts: [{ label: 'retention', value: '12 mo local · forever in cloud' }, { label: 'tag count', value: '~13.4k' }],
  },
  'web-srv':  { subtitle: 'DeltaV Web Server · iOps',
    summary: 'Browser-based remote operations. Read-only on OT data; full audit trail of operator actions.',
    facts: [{ label: 'platform', value: 'IIS · TLS 1.3' }, { label: 'auth', value: 'AD federated · MFA' }],
  },
  'asset-mgr': { subtitle: 'AMS Device Manager · HART',
    summary: 'Smart-device diagnostics for HART/Fieldbus instruments. Feeds Cortex anomaly via DeltaV historian.',
    facts: [{ label: 'devices', value: '4,820' }, { label: 'protocols', value: 'HART · FF · PROFIBUS' }],
  },
  'cyber':    { subtitle: 'Cyber DeltaV Smart Switch',
    summary: 'Hardened, OT-aware managed switch. NetFlow + Modbus DPI to the SOC.',
    facts: [{ label: 'platform', value: 'Cisco IE-3300 + Claroty sensor' }],
  },
  'op1':      { subtitle: 'Operator Station #1 · Control Room A · CDU',
    summary: 'Primary CDU operator console. Two displays.', facts: [{ label: 'shift', value: 'B · J. Wheeler' }],
  },
  'op2':      { subtitle: 'Operator Station #2 · Control Room A · FCC',
    summary: 'Primary FCC operator console.', facts: [{ label: 'shift', value: 'B · S. Ortiz' }],
  },
  'op3':      { subtitle: 'Operator Station #3 · Control Room B · Utilities',
    summary: 'Secondary console — utilities, tank farm, flare.', facts: [{ label: 'shift', value: 'B · M. Rivera' }],
  },
  'remote-1': { subtitle: 'Remote Operator · iOps · Houston',
    summary: 'Read-only iOps client at the remote control facility. Cannot write to controllers.',
    facts: [{ label: 'distance', value: '38 mi' }, { label: 'auth', value: 'iOps · MFA' }],
  },
  'sw-acn':   { subtitle: 'Area Control Network · redundant',
    summary: 'Ring-fenced VLAN on Cisco IE switches. PRP redundancy for primary controllers.',
    facts: [{ label: 'protocol', value: 'IEEE 62439-3 PRP' }],
  },
  'mx-ctlr':  { subtitle: 'M-series MX Controller · CDU train',
    summary: 'Primary controller for CDU-100. Hot-redundant pair.',
    facts: [{ label: 'platform', value: 'DeltaV MX' }, { label: 'redundant', value: 'yes · hot-standby' }],
  },
  'sx-ctlr':  { subtitle: 'S-series SX Controller · FCC train',
    summary: 'Primary controller for FCC + fractionator. Hot-redundant pair.',
    facts: [{ label: 'platform', value: 'DeltaV SX' }, { label: 'I/O', value: 'classic + remote' }],
  },
  'sd-ctlr':  { subtitle: 'SD Plus Controller · CHARMs host',
    summary: 'Hosts the two CHARM I/O cabinets. 192 channels of universal I/O. Click for CHARM front/back interfaces.',
    facts: [{ label: 'platform', value: 'DeltaV SD Plus' }, { label: 'CHARM count', value: '192' }],
  },
  'safe-ctlr': { subtitle: 'SIS Logic Solver · SLS 1500',
    summary: 'TÜV-certified SIL-3 safety logic solver. Independent of BPCS.',
    facts: [{ label: 'platform', value: 'DeltaV SLS 1500' }, { label: 'SIL', value: '3' }],
  },
  'cu1':      { subtitle: 'CHARM I/O Cabinet 1',
    summary: 'Modular CHARM enclosure. 96 universal I/O channels. Click controller for front/back wiring view.',
    facts: [{ label: 'channels', value: '96' }, { label: 'baseplates', value: '12 × 8' }],
  },
  'cu2':      { subtitle: 'CHARM I/O Cabinet 2',
    summary: 'Modular CHARM enclosure. 96 universal I/O channels.',
    facts: [{ label: 'channels', value: '96' }, { label: 'baseplates', value: '12 × 8' }],
  },
  'wio':      { subtitle: 'Wireless I/O Gateway · 1410',
    summary: 'WirelessHART gateway for non-critical instruments.',
    facts: [{ label: 'instruments', value: '~84 wireless' }],
  },
  'rio':      { subtitle: 'Remote I/O · Zone Logic',
    summary: 'Fiber-loop remote I/O. Long-haul to outbuildings.',
    facts: [{ label: 'distance', value: 'up to 1.5 km' }],
  },
}

function DvIcon({ kind }: { kind: DvNode['kind'] }) {
  switch (kind) {
    case 'pro-plus':
      return (
        <g>
          <rect x="-18" y="-14" width="36" height="28" fill={C.bg} stroke={C.amber} strokeWidth="1.5" />
          <text fontSize="8" fill={C.amber} textAnchor="middle" dy="3">PRO+</text>
        </g>
      )
    case 'station':
      return (
        <g>
          <rect x="-16" y="-12" width="32" height="22" fill={C.bg} stroke={C.snow} strokeWidth="1.4" />
          <rect x="-3" y="10" width="6" height="3" fill={C.snow} />
          <rect x="-9" y="13" width="18" height="2" fill={C.snow} />
        </g>
      )
    case 'historian':
      return (
        <g>
          <rect x="-15" y="-13" width="30" height="26" fill={C.bg} stroke={C.amber} strokeWidth="1.4" />
          {[-9, -4, 1, 6].map((y, i) => <ellipse key={i} cx="0" cy={y} rx="11" ry="2" fill="none" stroke={C.amber} strokeWidth="0.7" />)}
        </g>
      )
    case 'switch':
      return (
        <g>
          <rect x="-18" y="-10" width="36" height="20" fill={C.bg} stroke={C.cyan} strokeWidth="1.4" />
          {[-12, -4, 4, 12].map((x, i) => <rect key={i} x={x - 1.5} y="-6" width="3" height="12" fill={C.cyan} />)}
        </g>
      )
    case 'controller':
      return (
        <g>
          <rect x="-18" y="-13" width="36" height="26" fill={C.bg} stroke={C.copper} strokeWidth="1.6" />
          <rect x="-15" y="-10" width="6" height="20" fill={C.copper} opacity="0.5" />
          <rect x="-7"  y="-10" width="4" height="20" fill={C.copper} opacity="0.7" />
          <rect x="-1"  y="-10" width="4" height="20" fill={C.copper} opacity="0.5" />
          <rect x="5"   y="-10" width="4" height="20" fill={C.copper} opacity="0.7" />
          <rect x="11"  y="-10" width="4" height="20" fill={C.copper} opacity="0.5" />
        </g>
      )
    case 'charms-cu':
      return (
        <g>
          <rect x="-18" y="-14" width="36" height="28" fill={C.bg} stroke={C.signal} strokeWidth="1.5" />
          {Array.from({ length: 4 }).map((_, r) =>
            Array.from({ length: 4 }).map((_, c) => (
              <rect key={`${r},${c}`} x={-15 + c * 7} y={-12 + r * 7} width="6" height="6" fill={C.signal} opacity="0.55" />
            )),
          )}
        </g>
      )
    case 'wireless-io':
      return (
        <g>
          <circle r="3" fill={C.snow} />
          <path d="M-10,5 A 11 11 0 0 1 10,5" fill="none" stroke={C.snow} strokeWidth="1.2" />
          <path d="M-15,9 A 17 17 0 0 1 15,9" fill="none" stroke={C.snow} strokeWidth="1.2" opacity="0.7" />
        </g>
      )
    case 'remote':
      return (
        <g>
          <rect x="-18" y="-12" width="36" height="22" fill={C.bg} stroke={C.flare} strokeWidth="1.4" />
          <text fontSize="8" fill={C.flare} textAnchor="middle" dy="3">RDP</text>
        </g>
      )
    default:
      return null
  }
}

function DeltaVDeployment() {
  const [phase, setPhase] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [charmOpen, setCharmOpen] = useState(false)
  // Make every DeltaV node draggable: positions live in state.
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>(() =>
    Object.fromEntries(DV_NODES.map((n) => [n.id, { x: n.x, y: n.y }])),
  )
  const dragRef = useRef<{ id: string; dx: number; dy: number; moved: boolean } | null>(null)
  const svgRef = useRef<SVGSVGElement | null>(null)

  useEffect(() => {
    let raf = 0
    const start = performance.now()
    const tick = () => {
      const t = (performance.now() - start) / 1000
      setPhase((t / 2.8) % 1)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  function svgPoint(evt: { clientX: number; clientY: number }) {
    const svg = svgRef.current
    if (!svg) return { x: 0, y: 0 }
    const pt = svg.createSVGPoint()
    pt.x = evt.clientX
    pt.y = evt.clientY
    const ctm = svg.getScreenCTM()
    if (!ctm) return { x: 0, y: 0 }
    const inv = ctm.inverse()
    const p = pt.matrixTransform(inv)
    return { x: p.x, y: p.y }
  }

  function onPointerDown(e: React.PointerEvent<SVGGElement>, id: string) {
    ;(e.currentTarget as SVGGElement).setPointerCapture(e.pointerId)
    const cur = positions[id]
    const p = svgPoint(e)
    dragRef.current = { id, dx: p.x - cur.x, dy: p.y - cur.y, moved: false }
  }
  function onPointerMove(e: React.PointerEvent<SVGGElement>) {
    if (!dragRef.current) return
    const p = svgPoint(e)
    const nx = Math.max(40, Math.min(DV_W - 40, p.x - dragRef.current.dx))
    const ny = Math.max(40, Math.min(DV_H - 40, p.y - dragRef.current.dy))
    const { id } = dragRef.current
    setPositions((prev) => {
      const cur = prev[id]
      if (cur.x === nx && cur.y === ny) return prev
      dragRef.current!.moved = true
      return { ...prev, [id]: { x: nx, y: ny } }
    })
  }
  function onPointerUp(e: React.PointerEvent<SVGGElement>, id: string) {
    ;(e.currentTarget as SVGGElement).releasePointerCapture(e.pointerId)
    const moved = dragRef.current?.moved ?? false
    dragRef.current = null
    // Only treat as click if no drag occurred
    if (!moved) handleClick(id)
  }

  function handleClick(id: string) {
    setSelected(id)
    if (id === 'sd-ctlr' || id === 'mx-ctlr' || id === 'sx-ctlr' || id === 'safe-ctlr') {
      setCharmOpen(true)
    }
  }

  const sel = selected ? { node: DV_NODES.find((n) => n.id === selected)!, detail: DV_DETAILS[selected] } : null

  /** Helper to read live position of a node by id */
  const pos = (id: string) => positions[id] ?? { x: 0, y: 0 }

  return (
    <>
      <div className="flex items-end justify-between flex-wrap gap-3 mt-4">
        <div>
          <div className="tag">DCS · DELTAV DEPLOYMENT</div>
          <h2 className="font-display text-xl font-bold tracking-tight mt-1">Emerson DeltaV topology · ACN · CHARMs · SIS</h2>
          <div className="tag mt-1 text-ink-muted">
            Click any device. Click any controller to open the CHARM front/back wiring panel.
          </div>
        </div>
        <div className="flex gap-2">
          <Badge tone="signal">CHARMs</Badge>
          <Badge tone="flare">SIL-3 SIS</Badge>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_380px] gap-4 items-stretch">
        <Panel className="flex flex-col">
          <PanelHeader label="DELTAV · APPLICATION + CONTROL LAYERS" hint="click any node">
            <Badge tone="cyan">SVG</Badge>
          </PanelHeader>
          <div className="p-2 flex-1 min-h-0">
            <svg
              ref={svgRef}
              viewBox={`0 0 ${DV_W} ${DV_H}`}
              className="w-full bg-bg-base touch-none select-none"
            >
              {/* Edges */}
              {DV_EDGES.map((e, i) => {
                const a = pos(e.from)
                const b = pos(e.to)
                const color = toneColor(e.tone)
                return (
                  <line key={i}
                        x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                        stroke={color} strokeOpacity="0.5" strokeWidth="1.2" />
                )
              })}
              {/* Animated packets */}
              {DV_EDGES.map((e, i) => {
                const a = pos(e.from)
                const b = pos(e.to)
                const p = (phase + i * 0.07) % 1
                const x = a.x + (b.x - a.x) * p
                const y = a.y + (b.y - a.y) * p
                return <circle key={`p${i}`} cx={x} cy={y} r="2.6" fill={toneColor(e.tone)} opacity="0.95" />
              })}
              {/* Nodes — draggable */}
              {DV_NODES.map((n) => {
                const isSel = selected === n.id
                const p = pos(n.id)
                return (
                  <g key={n.id}
                     transform={`translate(${p.x},${p.y})`}
                     className="cursor-grab active:cursor-grabbing"
                     onPointerDown={(e) => onPointerDown(e, n.id)}
                     onPointerMove={onPointerMove}
                     onPointerUp={(e) => onPointerUp(e, n.id)}>
                    <circle r="24" fill="transparent" />
                    {isSel && <circle r="22" fill="none" stroke={C.cyan} strokeWidth="1.5"
                                      style={{ filter: 'drop-shadow(0 0 6px #4ee2f4)' }} />}
                    <DvIcon kind={n.kind} />
                    <text y="26" fontSize="9.5" fill={isSel ? C.cyan : C.ink} textAnchor="middle">{n.label}</text>
                    {n.sub && <text y="38" fontSize="8" fill={C.inkDim} textAnchor="middle">{n.sub}</text>}
                  </g>
                )
              })}
              {/* Drag hint */}
              <text x="20" y={DV_H - 10} fontSize="9" fill={C.inkDim}>
                drag any node · click to inspect · click controller for CHARM panel
              </text>
            </svg>
          </div>
        </Panel>

        {/* Detail panel */}
        <Panel className="flex flex-col">
          <PanelHeader label="NODE DETAIL" hint={sel?.detail?.subtitle ?? 'pick a node'}>
            {sel && <Badge tone="cyan">{sel.node.id}</Badge>}
            {sel && <button onClick={() => setSelected(null)} className="ml-1 p-1 text-ink-muted hover:text-cyan transition-colors"><X className="w-3.5 h-3.5" /></button>}
          </PanelHeader>
          <div className="p-4 overflow-y-auto">
            {!sel && (
              <div className="text-ink-muted font-mono text-[11px]">
                Click any DeltaV node to see role, redundancy and protocols.
              </div>
            )}
            {sel && (
              <div className="space-y-3">
                <div className="font-display text-base font-bold tracking-tight">{sel.node.label}</div>
                <div className="font-mono text-[10.5px] text-ink leading-relaxed">{sel.detail.summary}</div>
                <div className="py-1">
                  {sel.detail.facts.map((f) => <DataRow key={f.label} label={f.label} value={f.value} />)}
                </div>
                {(sel.node.id === 'sd-ctlr' || sel.node.id === 'mx-ctlr' || sel.node.id === 'sx-ctlr' || sel.node.id === 'safe-ctlr') && (
                  <button
                    onClick={() => setCharmOpen(true)}
                    className="inline-flex items-center gap-2 px-3 py-1.5 border border-signal text-signal bg-signal/10 hover:bg-signal/20 font-cond text-[11px] uppercase tracking-[0.16em] font-semibold"
                  >
                    Open CHARM front / back interfaces
                  </button>
                )}
              </div>
            )}
          </div>
        </Panel>
      </div>

      {charmOpen && <CharmPanelModal onClose={() => setCharmOpen(false)} controllerLabel={sel?.node.label ?? 'Controller'} />}
    </>
  )
}

/* ─── CHARM panel modal: front + back interfaces ─────────────────── */

interface CharmSlot {
  index: number
  /** I/O type */
  ioType: 'AI-HART' | 'AO-HART' | 'DI' | 'DO' | 'TC' | 'RTD' | 'OPEN'
  tag?: string
  value?: string
}

function buildCharmBaseplate(): CharmSlot[] {
  // 12 baseplates of 8 = 96 slots. We render a single 96-slot grid (8 × 12) for clarity.
  const pattern: CharmSlot['ioType'][] = [
    'AI-HART','AI-HART','AI-HART','AO-HART','AO-HART','DI','DO','TC',
    'AI-HART','AI-HART','RTD','AO-HART','DI','DI','DO','OPEN',
    'AI-HART','AI-HART','TC','AI-HART','DO','DO','OPEN','OPEN',
    'AI-HART','AI-HART','AI-HART','AO-HART','DI','DI','DI','TC',
    'AI-HART','RTD','AI-HART','AO-HART','DI','DO','OPEN','OPEN',
    'AI-HART','AI-HART','AI-HART','AI-HART','DO','DI','TC','OPEN',
    'AI-HART','AO-HART','RTD','AI-HART','DI','DI','OPEN','OPEN',
    'AI-HART','AI-HART','TC','AO-HART','DO','DO','OPEN','OPEN',
    'AI-HART','AI-HART','AI-HART','AO-HART','DI','DO','OPEN','OPEN',
    'AI-HART','AI-HART','RTD','AI-HART','DI','DO','TC','OPEN',
    'AI-HART','AI-HART','AI-HART','AO-HART','DO','DO','OPEN','OPEN',
    'AI-HART','AI-HART','TC','AI-HART','DI','DO','OPEN','OPEN',
  ]
  return pattern.map((io, i) => {
    if (io === 'OPEN') return { index: i, ioType: io }
    const sampleTags = ['PT-101','PT-102','TT-101','TT-102','TT-201','FT-101','FT-102','LT-501','LT-502','FV-101','HV-101','PSV-101']
    const tag = sampleTags[i % sampleTags.length] + (io === 'TC' || io === 'RTD' ? '-T' : '')
    return { index: i, ioType: io, tag, value: io.startsWith('AI') ? `${(Math.random()*100).toFixed(1)} %` : io.startsWith('AO') ? `${(Math.random()*100).toFixed(1)} %` : io === 'DI' ? (Math.random() > 0.5 ? '1' : '0') : io === 'DO' ? (Math.random() > 0.5 ? 'ON' : 'OFF') : `${(Math.random()*200+20).toFixed(0)} °C` }
  })
}

const CHARM_TONE: Record<CharmSlot['ioType'], string> = {
  'AI-HART': '#4ee2f4',
  'AO-HART': '#ffb627',
  'DI':      '#1ea7ff',
  'DO':      '#34d57b',
  'TC':      '#ff6b35',
  'RTD':     '#c79a4a',
  'OPEN':    '#3a4a64',
}

function CharmPanelModal({ onClose, controllerLabel }: { onClose: () => void; controllerLabel: string }) {
  const [face, setFace] = useState<'front' | 'back'>('front')
  const [slots] = useState<CharmSlot[]>(() => buildCharmBaseplate())
  const [selSlot, setSelSlot] = useState<CharmSlot | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    // Bounded box: starts below the global header chrome (CommandBar h-14 + TickerStrip h-9 = 92 px)
    // and ends above the StatusBar (h-9 = 36 px). Sized to 90vh max with a comfortable cap so
    // it never extends behind the top header bar regardless of viewport height.
    <div
      className="fixed left-[228px] right-0 z-50 flex justify-center pointer-events-none"
      style={{
        top: 'calc(92px + 12px)',
        bottom: 'calc(36px + 12px)',
      }}
    >
      <div className="pointer-events-auto bg-bg-base/95 backdrop-blur-sm border border-edge-subtle shadow-2xl flex flex-col w-full max-w-[1500px] mx-4 overflow-hidden"
           style={{ height: 'min(90vh, calc(100vh - 92px - 36px - 24px))' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-edge-subtle shrink-0">
          <div>
            <div className="tag text-ink-muted">CHARM I/O · 96 CHANNELS · FRONT &amp; BACK</div>
            <div className="font-display text-xl font-bold tracking-tight">{controllerLabel} · CHARM panel</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="inline-flex border border-edge-subtle">
              {(['front', 'back'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFace(f)}
                  className={cn(
                    'px-3 py-1.5 font-cond text-[11px] uppercase tracking-[0.16em] transition-colors',
                    face === f ? 'bg-cyan/15 text-cyan' : 'text-ink-muted hover:text-ink',
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
            <button onClick={onClose} className="inline-flex items-center gap-2 px-3 py-2 border border-edge-strong text-ink-dim hover:border-cyan hover:text-cyan transition-colors">
              <X className="w-4 h-4" />
              <span className="font-cond text-[11px] uppercase tracking-[0.16em]">close · ESC</span>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="grid grid-cols-[1fr_360px] gap-4 p-4 flex-1 min-h-0 overflow-hidden">
          {/* Cabinet face — scaled to fit */}
          <Panel className="flex flex-col min-h-0 overflow-hidden">
            <PanelHeader label={face === 'front' ? 'FRONT FACE · LED status + tag labels' : 'BACK FACE · field-side terminals + cable run'} hint="click any CHARM" />
            <div className="p-3 flex-1 min-h-0 overflow-auto">
              <div className="grid grid-cols-8 gap-1.5 auto-rows-fr h-full">
                {slots.map((s) => (
                  <button
                    key={s.index}
                    onClick={() => setSelSlot(s)}
                    className={cn(
                      'border bg-bg-base/60 p-1.5 text-left hover:border-cyan transition-colors',
                      'flex flex-col justify-between min-h-0',
                      selSlot?.index === s.index ? 'border-cyan' : 'border-edge-subtle',
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[9px] text-ink-muted">CH{(s.index + 1).toString().padStart(2, '0')}</span>
                      {face === 'front' ? (
                        <span className={cn('led', s.ioType === 'OPEN' ? 'led-off' : 'led-green animate-pulse-soft')} />
                      ) : (
                        <span className="font-mono text-[9px] text-ink-muted">
                          {s.ioType === 'OPEN' ? '—' : 'TB'}{(s.index + 1).toString().padStart(2,'0')}
                        </span>
                      )}
                    </div>
                    <div className="font-cond text-[9.5px] uppercase tracking-wide mt-1" style={{ color: CHARM_TONE[s.ioType] }}>
                      {s.ioType === 'OPEN' ? 'open' : s.ioType}
                    </div>
                    {face === 'front'
                      ? (
                        <div className="font-mono text-[9.5px] text-ink mt-0.5 truncate">
                          {s.tag ?? '—'}
                        </div>
                      )
                      : (
                        <div className="font-mono text-[9px] text-ink-dim mt-0.5">
                          {s.ioType === 'OPEN' ? '—' : `wire: ${(s.index % 12) + 1}A / ${(s.index % 12) + 1}B`}
                        </div>
                      )
                    }
                  </button>
                ))}
              </div>
            </div>
          </Panel>

          {/* Channel detail — scrolls independently if it overflows */}
          <Panel className="flex flex-col min-h-0 overflow-hidden">
            <PanelHeader label="CHANNEL DETAIL" hint={selSlot ? `CH${(selSlot.index + 1).toString().padStart(2,'0')}` : 'pick a CHARM'} />
            <div className="p-4 flex-1 min-h-0 overflow-y-auto">
              {!selSlot && (
                <div className="font-mono text-[11px] text-ink-muted">
                  Click any CHARM channel on the left to see its I/O type, tag, and field-side terminal wiring.
                </div>
              )}
              {selSlot && (
                <div className="space-y-2 font-mono text-[11px]">
                  <DataRow label="channel"      value={`CH${(selSlot.index + 1).toString().padStart(2,'0')}`} tone="cyan" />
                  <DataRow label="I/O type"     value={selSlot.ioType} tone={selSlot.ioType === 'OPEN' ? 'snow' : 'cyan'} />
                  <DataRow label="tag"          value={selSlot.tag ?? '(unassigned)'} />
                  <DataRow label="value"        value={selSlot.value ?? '—'} tone="signal" />
                  <DataRow label="hart status"  value={selSlot.ioType.includes('HART') ? 'good · diagnostics ok' : 'n/a'} tone="signal" />
                  <DataRow label="terminal"     value={selSlot.ioType === 'OPEN' ? '—' : `TB${(selSlot.index + 1).toString().padStart(2,'0')}`} />
                  <DataRow label="wire pair"    value={selSlot.ioType === 'OPEN' ? '—' : `${(selSlot.index % 12) + 1}A / ${(selSlot.index % 12) + 1}B`} />
                  <DataRow label="last cal"     value={selSlot.ioType === 'OPEN' ? '—' : `${(selSlot.index * 7) % 120}d ago`} />
                </div>
              )}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  )
}
