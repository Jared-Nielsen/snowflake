/**
 * DevicesTab — refinery device catalog browser.
 *
 * Renders an internal sub-nav of every major refinery device type, with a
 * dedicated panel per device showing:
 *   - 3D R3F render (orbit / pan)
 *   - 2-3 live KPIs
 *   - StreamChart (where applicable)
 *   - React Flow workflow showing this device's place in the train
 *     (clickable nodes → FlowInspector)
 *   - Snowflake/Cortex query panel with mock SQL + result
 *
 * Devices map 1:1 to a canonical taxonomy used in refinery design:
 *  tank · pump · exchanger · furnace · column · reactor · drum ·
 *  compressor · cooling-tower · flare · treater · sphere · valve
 *
 * For pumps and the FCC stack we reuse the existing PumpModel / Smokestack
 * so the demo stays consistent with the Maintenance and Sustainability tabs.
 */

import { useMemo, useState } from 'react'
import {
  Cylinder,
  Flame,
  Gauge,
  Beaker,
  Container,
  Fan,
  Wind,
  Droplets,
  Settings,
  Activity,
  Boxes,
} from 'lucide-react'
import type { Node, Edge } from '@xyflow/react'

import { Panel, PanelHeader, Kpi, DataRow } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { FlowCanvas } from '@/components/FlowCanvas'
import { FlowInspector } from '@/components/FlowInspector'
import { QueryPanel } from '@/components/QueryPanel'
import { StreamChart } from '@/components/StreamChart'
import { PumpModel } from '@/components/three/PumpModel'
import { Smokestack } from '@/components/three/Smokestack'
import {
  StorageTankModel,
  HeatExchangerModel,
  FiredHeaterModel,
  ColumnModel,
  ReactorModel,
  KODrumModel,
  CompressorModel,
  CoolingTowerModel,
  FlareModel,
  AmineTreaterModel,
  LpgSphereModel,
  ControlValveModel,
} from '@/components/three/DeviceModels'
import { cn } from '@/lib/utils'
import type { NodeInspectorDetails, EdgeInspectorDetails } from '@/store/inspectorStore'

/* ─────────────────── DEVICE CATALOG ─────────────────────────────── */

type DeviceKey =
  | 'tank'
  | 'pump'
  | 'exchanger'
  | 'furnace'
  | 'column'
  | 'reactor'
  | 'drum'
  | 'compressor'
  | 'cooling'
  | 'flare'
  | 'treater'
  | 'sphere'
  | 'valve'

interface DeviceEntry {
  key: DeviceKey
  code: string
  family: string
  title: string
  tagline: string
  icon: React.ReactNode
  /** Asset ID used in upstream tabs */
  assetId: string
  /** R3F viewer component */
  Viewer: () => JSX.Element
  /** Live stream key (if any) from useStreamStore subscriptions */
  streamKey?: string
  streamUnit?: string
  streamWarn?: number
  streamThreshold?: number
  /** KPI strip */
  kpis: { label: string; value: string; unit?: string; tone?: 'cyan' | 'amber' | 'signal' | 'snow' | 'alarm'; delta?: string }[]
  /** Static spec sheet rows */
  specs: { label: string; value: string }[]
  /** Mock Snowflake query */
  sql: string
  mock: Record<string, unknown>
  /** ROI tag */
  roi: string
  /** Inline workflow nodes / edges (this device sits in the middle) */
  workflow: { nodes: Node[]; edges: Edge[] }
}

const PUMP_VIEWER = () => <PumpModel />
const STACK_VIEWER = () => <Smokestack />

function flow(
  upstream: { code: string; label: string; meta?: string },
  device:   { code: string; label: string; meta?: string; details?: NodeInspectorDetails },
  downstream: { code: string; label: string; meta?: string },
  edgeNotes: { up?: EdgeInspectorDetails; down?: EdgeInspectorDetails } = {},
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [
    {
      id: 'up',
      type: 'schematic',
      position: { x: 0, y: 80 },
      data: { code: upstream.code, label: upstream.label, kind: 'source', status: 'ok', meta: upstream.meta },
    },
    {
      id: 'dev',
      type: 'schematic',
      position: { x: 280, y: 80 },
      data: {
        code: device.code, label: device.label, kind: 'process', status: 'ok', meta: device.meta,
        details: device.details,
      },
    },
    {
      id: 'down',
      type: 'schematic',
      position: { x: 560, y: 80 },
      data: { code: downstream.code, label: downstream.label, kind: 'output', status: 'ok', meta: downstream.meta },
    },
  ]
  const edges: Edge[] = [
    { id: 'eu', source: 'up',  target: 'dev',  animated: true, style: { stroke: '#c79a4a' }, data: { details: edgeNotes.up } },
    { id: 'ed', source: 'dev', target: 'down', animated: true, style: { stroke: '#34d57b' }, data: { details: edgeNotes.down } },
  ]
  return { nodes, edges }
}

const DEVICES: DeviceEntry[] = [
  /* ── tank ── */
  {
    key: 'tank',
    code: 'TK-501',
    family: 'STORAGE',
    title: 'Storage Tank · Floating-Roof',
    tagline: 'API-650 atmospheric crude tank. Pontoon-style floating roof. Strapped capacity 220 kbbl.',
    icon: <Container className="w-3.5 h-3.5" />,
    assetId: 'TK-501',
    Viewer: () => <StorageTankModel label="TK-501" fill={0.76} />,
    streamKey: 'TK-501:level',
    streamUnit: 'm',
    streamWarn: 21,
    streamThreshold: 23,
    kpis: [
      { label: 'level',     value: '18.2', unit: 'm', tone: 'cyan'   },
      { label: 'utilization', value: '76',   unit: '%', tone: 'signal' },
      { label: 'inventory', value: '167',  unit: 'kbbl', tone: 'snow' },
    ],
    specs: [
      { label: 'API standard',      value: 'API-650 / 653' },
      { label: 'diameter × height', value: '53 m × 18 m' },
      { label: 'capacity',          value: '220 kbbl' },
      { label: 'roof type',         value: 'pontoon floating' },
      { label: 'service',           value: 'sweet crude' },
      { label: 'instruments',       value: 'radar level · servo + density' },
    ],
    sql: `SELECT  tank_id, level_m, density_kg_m3,
        level_m * 4.13 AS inventory_kbbl
  FROM  cognite.gold.tank_state_1m
 WHERE  tank_id = 'TK-501'
   AND  ts > DATEADD(hour, -1, CURRENT_TIMESTAMP())
 ORDER BY ts DESC LIMIT 1;`,
    mock: { tank_id: 'TK-501', level_m: 18.2, density_kg_m3: 837.5, inventory_kbbl: 167.4, headspace_m: 5.8 },
    roi: 'inventory accuracy · loss control',
    workflow: flow(
      { code: 'CRUDE · PIPE', label: 'Crude Pipeline',     meta: 'WTI feed' },
      { code: 'TK-501',       label: 'Storage Tank',       meta: '167 kbbl' },
      { code: 'PUMP-401',     label: 'Charge Pump',        meta: 'to CDU-100' },
    ),
  },

  /* ── pump ── */
  {
    key: 'pump',
    code: 'PUMP-401',
    family: 'ROTATING',
    title: 'Centrifugal Pump · API-610 OH2',
    tagline: 'End-suction charge pump. Variable-speed via 4 kV TEFC motor and VFD. Feeds CDU-100.',
    icon: <Activity className="w-3.5 h-3.5" />,
    assetId: 'PUMP-401',
    Viewer: PUMP_VIEWER,
    streamKey: 'PUMP-401:vibration',
    streamUnit: 'mm/s',
    streamWarn: 5,
    streamThreshold: 6,
    kpis: [
      { label: 'vibration',  value: '4.81', unit: 'mm/s', tone: 'amber' },
      { label: 'flow',       value: '1,450', unit: 'gpm', tone: 'cyan' },
      { label: 'discharge',  value: '8.18', unit: 'bar', tone: 'snow' },
    ],
    specs: [
      { label: 'standard',   value: 'API-610 OH2 · ANSI B73.1' },
      { label: 'motor',      value: '250 HP · 4 kV · TEFC' },
      { label: 'speed',      value: '1,740 RPM · VFD-driven' },
      { label: 'seal',       value: 'single mechanical · plan 11' },
      { label: 'bearings',   value: 'DE deep-groove · NDE thrust' },
      { label: 'service',    value: 'crude charge to CDU-100' },
    ],
    sql: `SELECT  ts, asset_id, sensor, value
  FROM  cognite.silver.timeseries_1m
 WHERE  asset_id = 'PUMP-401'
   AND  ts > DATEADD(minute, -5, CURRENT_TIMESTAMP())
 ORDER BY ts DESC LIMIT 12;`,
    mock: { asset_id: 'PUMP-401', vibration: 4.81, discharge_psi: 119, flow_gpm: 1450, motor_amps: 142 },
    roi: 'reliability · avoided trips',
    workflow: flow(
      { code: 'TK-501',  label: 'Crude Tank',        meta: 'suction' },
      { code: 'PUMP-401', label: 'Charge Pump',       meta: '1,450 gpm' },
      { code: 'HX-205',  label: 'Preheat Exchanger', meta: '+90 °C' },
    ),
  },

  /* ── exchanger ── */
  {
    key: 'exchanger',
    code: 'HX-205',
    family: 'HEAT TRANSFER',
    title: 'Shell-and-Tube Exchanger · TEMA AES',
    tagline: 'Crude vs atmospheric residue preheat. Counter-flow shell-and-tube, 2.4 MW duty.',
    icon: <Cylinder className="w-3.5 h-3.5" />,
    assetId: 'HX-205',
    Viewer: () => <HeatExchangerModel label="HX-205" />,
    streamKey: 'HX-205:pressure',
    streamUnit: 'bar',
    streamWarn: 7,
    streamThreshold: 7.4,
    kpis: [
      { label: 'shell ΔP',  value: '1.42', unit: 'bar', tone: 'amber' },
      { label: 'duty',      value: '2.4',  unit: 'MW', tone: 'cyan' },
      { label: 'U_now',     value: '612',  unit: 'W/m²K', tone: 'snow' },
    ],
    specs: [
      { label: 'TEMA type',   value: 'AES · removable bundle' },
      { label: 'area',        value: '780 m²' },
      { label: 'tubes',       value: '624 × 19 mm OD · 6 m' },
      { label: 'passes',      value: 'shell 1 · tube 4' },
      { label: 'design',      value: '40 bar / 380 °C' },
      { label: 'fouling',     value: '4.6e-4 m²K/W (vs 4.0e-4 threshold)' },
    ],
    sql: `WITH duty AS (
  SELECT AVG(t_hot_in) t_hi, AVG(t_hot_out) t_ho,
         AVG(t_cold_in) t_ci, AVG(t_cold_out) t_co, AVG(q_kw) q
    FROM cognite.silver.hx_timeseries_1m
   WHERE asset_id = 'HX-205'
     AND ts > DATEADD(hour, -1, CURRENT_TIMESTAMP())
)
SELECT  refinery_ai.lmtd(t_hi, t_ho, t_ci, t_co)              AS lmtd,
        q / (refinery_ai.lmtd(t_hi, t_ho, t_ci, t_co) * 248)  AS u_now,
        refinery_ai.fouling_resistance(u_now, 850)            AS r_f
  FROM  duty;`,
    mock: { asset_id: 'HX-205', lmtd: 38.4, u_now: 612, u_clean: 850, r_f: 4.6e-4, action: 'CLEAN_RECOMMENDED' },
    roi: 'energy · $1–2M / yr',
    workflow: flow(
      { code: 'PUMP-401', label: 'Charge Pump',     meta: 'cold side in' },
      { code: 'HX-205',   label: 'Preheat HX',      meta: 'ΔT +90 °C' },
      { code: 'F-101',    label: 'Fired Heater',    meta: 'to CDU heater' },
    ),
  },

  /* ── furnace ── */
  {
    key: 'furnace',
    code: 'F-101',
    family: 'FIRED',
    title: 'Crude Charge Heater · Box Furnace',
    tagline: 'Vertical box-type fired heater. 120 MMBtu/h. Brings crude to CDU inlet temperature.',
    icon: <Flame className="w-3.5 h-3.5" />,
    assetId: 'F-101',
    Viewer: () => <FiredHeaterModel label="F-101" />,
    kpis: [
      { label: 'duty',        value: '118',  unit: 'MMBtu/h', tone: 'cyan' },
      { label: 'stack T',     value: '412',  unit: '°C', tone: 'amber' },
      { label: 'O₂',          value: '3.1',  unit: '%', tone: 'signal' },
    ],
    specs: [
      { label: 'type',          value: 'vertical box · radiant + convection' },
      { label: 'duty rated',    value: '120 MMBtu/h' },
      { label: 'fuel',          value: 'refinery fuel gas · pilot natural gas' },
      { label: 'burners',       value: '6 · low-NOx ultra-lean premix' },
      { label: 'tube alloy',    value: 'P11 / P22' },
      { label: 'controls',      value: 'O₂ trim · draft DCS' },
    ],
    sql: `SELECT  asset_id, ts, fuel_gas_mmbtuh, stack_temp_c, o2_pct, nox_ppm
  FROM  cognite.gold.heater_perf_1m
 WHERE  asset_id = 'F-101'
   AND  ts > DATEADD(minute, -5, CURRENT_TIMESTAMP())
 ORDER BY ts DESC LIMIT 1;`,
    mock: { asset_id: 'F-101', fuel_gas_mmbtuh: 118, stack_temp_c: 412, o2_pct: 3.1, nox_ppm: 38 },
    roi: 'energy · combustion efficiency',
    workflow: flow(
      { code: 'HX-205', label: 'Preheat HX',    meta: 'feed @ 220 °C' },
      { code: 'F-101',  label: 'Fired Heater',  meta: '+ 150 °C' },
      { code: 'CDU-100', label: 'Distillation', meta: 'inlet 370 °C' },
    ),
  },

  /* ── column ── */
  {
    key: 'column',
    code: 'CDU-100',
    family: 'SEPARATION',
    title: 'Atmospheric Distillation · CDU',
    tagline: 'Primary crude distillation tower. 48 trays. Produces naphtha, kerosene, diesel, AGO and atmospheric resid.',
    icon: <Boxes className="w-3.5 h-3.5" />,
    assetId: 'CDU-100',
    Viewer: () => <ColumnModel label="CDU-100" height={4.2} trays={32} />,
    streamKey: 'CDU-100:temperature',
    streamUnit: '°C',
    streamWarn: 365,
    streamThreshold: 372,
    kpis: [
      { label: 'top T',      value: '128', unit: '°C', tone: 'cyan' },
      { label: 'bottom T',   value: '358', unit: '°C', tone: 'amber' },
      { label: 'pressure',   value: '1.2', unit: 'bar', tone: 'snow' },
    ],
    specs: [
      { label: 'type',          value: 'atmospheric · 48 trays · 4-pass reflux' },
      { label: 'diameter',      value: '5.4 m (rectifying) / 6.2 m (stripping)' },
      { label: 'side draws',    value: 'kero · LGO · HGO · AGO' },
      { label: 'design',        value: '3 bar / 400 °C' },
      { label: 'throughput',    value: '220 kbbl/d' },
      { label: 'overhead',      value: 'condenser CD-100 · reflux drum D-101' },
    ],
    sql: `SELECT  tray, AVG(temperature_c) t, AVG(pressure_bar) p
  FROM  cognite.silver.cdu_trays_1m
 WHERE  asset_id = 'CDU-100'
   AND  ts > DATEADD(minute, -5, CURRENT_TIMESTAMP())
 GROUP BY tray ORDER BY tray;`,
    mock: { asset_id: 'CDU-100', top_t_c: 128, bot_t_c: 358, p_bar: 1.2, yield_gasoline: 0.51, yield_diesel: 0.27 },
    roi: 'yield optimization · §6.1',
    workflow: flow(
      { code: 'F-101',  label: 'Fired Heater',    meta: 'feed 370 °C' },
      { code: 'CDU-100', label: 'CDU Tower',      meta: '220 kbbl/d' },
      { code: 'VDU-200', label: 'Vacuum Tower',   meta: 'AR feed' },
    ),
  },

  /* ── reactor ── */
  {
    key: 'reactor',
    code: 'RX-HDT-01',
    family: 'CHEMISTRY',
    title: 'Hydrotreater Reactor · Fixed Bed',
    tagline: 'Single-stage diesel hydrotreater. Co-Mo catalyst. Saturates olefins and removes sulfur to <10 ppm.',
    icon: <Beaker className="w-3.5 h-3.5" />,
    assetId: 'RX-HDT-01',
    Viewer: () => <ReactorModel label="RX-HDT-01" />,
    kpis: [
      { label: 'bed T',     value: '342', unit: '°C', tone: 'amber' },
      { label: 'ΔT bed',    value: '+18', unit: '°C', tone: 'cyan' },
      { label: 'product S', value: '8',   unit: 'ppm', tone: 'signal' },
    ],
    specs: [
      { label: 'service',       value: 'diesel hydrotreating · ULSD' },
      { label: 'catalyst',      value: 'Co-Mo / Al₂O₃ · 24 m³' },
      { label: 'design',        value: '85 bar / 420 °C' },
      { label: 'H₂ partial',    value: '64 bar' },
      { label: 'LHSV',          value: '1.4 h⁻¹' },
      { label: 'cycle length',  value: '24 months projected' },
    ],
    sql: `SELECT  bed, t_in, t_out, h2_partial_bar, sulfur_in_ppm, sulfur_out_ppm
  FROM  cognite.gold.reactor_bed_1m
 WHERE  asset_id = 'RX-HDT-01'
 ORDER BY ts DESC LIMIT 1;`,
    mock: { asset_id: 'RX-HDT-01', t_in_c: 324, t_out_c: 342, h2_partial_bar: 64, sulfur_in_ppm: 1820, sulfur_out_ppm: 8 },
    roi: 'spec compliance · ULSD',
    workflow: flow(
      { code: 'F-201',     label: 'Reactor Charge Heater', meta: 'pre-heat' },
      { code: 'RX-HDT-01', label: 'HDT Reactor',           meta: 'Co-Mo bed' },
      { code: 'KO-DRUM-301', label: 'KO Drum',             meta: '3-phase sep' },
    ),
  },

  /* ── drum ── */
  {
    key: 'drum',
    code: 'KO-DRUM-301',
    family: 'SEPARATION',
    title: '3-Phase Knock-Out Drum',
    tagline: 'Horizontal separator. Splits hydrotreater effluent into recycle gas, oil and sour water.',
    icon: <Container className="w-3.5 h-3.5" />,
    assetId: 'KO-DRUM-301',
    Viewer: () => <KODrumModel label="KO-DRUM-301" />,
    kpis: [
      { label: 'liquid level', value: '62', unit: '%', tone: 'cyan' },
      { label: 'P_op',         value: '24', unit: 'bar', tone: 'amber' },
      { label: 'T_op',         value: '52', unit: '°C', tone: 'snow' },
    ],
    specs: [
      { label: 'type',         value: 'horizontal · 3-phase · mesh pad' },
      { label: 'design',       value: '30 bar / 90 °C' },
      { label: 'dimensions',   value: '2.4 m ID × 9 m T/T' },
      { label: 'internals',    value: 'inlet diverter · mesh pad · boot' },
      { label: 'instruments',  value: 'LT-301/302 · LT-boot · interface' },
    ],
    sql: `SELECT  asset_id, level_pct, interface_pct, p_bar, t_c, gas_kg_h
  FROM  cognite.gold.drum_state_1m
 WHERE  asset_id = 'KO-DRUM-301'
 ORDER BY ts DESC LIMIT 1;`,
    mock: { asset_id: 'KO-DRUM-301', level_pct: 62, interface_pct: 18, p_bar: 24, t_c: 52, gas_kg_h: 1820 },
    roi: 'specification · safety',
    workflow: flow(
      { code: 'RX-HDT-01',    label: 'HDT Reactor',  meta: 'two-phase out' },
      { code: 'KO-DRUM-301',  label: 'KO Drum',      meta: '3-phase split' },
      { code: 'AMINE-401',    label: 'Amine Treat',  meta: 'recycle gas' },
    ),
  },

  /* ── compressor ── */
  {
    key: 'compressor',
    code: 'COMP-301',
    family: 'ROTATING',
    title: 'Wet-Gas Centrifugal Compressor',
    tagline: 'Multi-stage centrifugal driven by a gas turbine. 12 MW. Recycles hydrogen + light ends.',
    icon: <Fan className="w-3.5 h-3.5" />,
    assetId: 'COMP-301',
    Viewer: () => <CompressorModel label="COMP-301" />,
    streamKey: 'COMP-301:flow',
    streamUnit: 'kbbl/d',
    streamWarn: 152,
    streamThreshold: 158,
    kpis: [
      { label: 'discharge',  value: '36',   unit: 'bar', tone: 'amber' },
      { label: 'speed',      value: '9,180', unit: 'RPM', tone: 'cyan' },
      { label: 'power',      value: '11.4', unit: 'MW',  tone: 'snow' },
    ],
    specs: [
      { label: 'stages',     value: '5-stage centrifugal' },
      { label: 'driver',     value: 'gas turbine · 14 MW rated' },
      { label: 'service',    value: 'wet gas · HDT recycle' },
      { label: 'sealing',    value: 'dry gas seal · API 692' },
      { label: 'surge',      value: 'anti-surge FV-CS-301' },
      { label: 'vibration',  value: 'API 670 X-Y probes per bearing' },
    ],
    sql: `SELECT  ts, asset_id, speed_rpm, discharge_bar, power_mw, vibration_mils
  FROM  cognite.silver.comp_perf_1m
 WHERE  asset_id = 'COMP-301'
 ORDER BY ts DESC LIMIT 1;`,
    mock: { asset_id: 'COMP-301', speed_rpm: 9180, discharge_bar: 36, suction_bar: 8.4, power_mw: 11.4, vibration_mils: 1.6 },
    roi: 'reliability · throughput',
    workflow: flow(
      { code: 'KO-DRUM-301', label: 'KO Drum',     meta: 'suction gas' },
      { code: 'COMP-301',    label: 'Wet Gas Compressor', meta: '+ 28 bar' },
      { code: 'AMINE-401',   label: 'Amine Treat', meta: 'sweetened recycle' },
    ),
  },

  /* ── cooling tower ── */
  {
    key: 'cooling',
    code: 'CT-901',
    family: 'UTILITIES',
    title: 'Cooling Tower · Induced-Draft',
    tagline: 'Open-recirculating counter-flow cooling tower. 1.4 MW heat rejection. Feeds plant cooling-water loop.',
    icon: <Wind className="w-3.5 h-3.5" />,
    assetId: 'CT-901',
    Viewer: () => <CoolingTowerModel label="CT-901" />,
    kpis: [
      { label: 'approach',  value: '4.2', unit: '°C', tone: 'cyan' },
      { label: 'range',     value: '11',  unit: '°C', tone: 'snow' },
      { label: 'drift',     value: '0.01', unit: '%', tone: 'signal' },
    ],
    specs: [
      { label: 'type',         value: 'induced-draft counterflow' },
      { label: 'cells',        value: '4 cells × 1,200 GPM' },
      { label: 'design',       value: 'wet bulb 26 °C · approach 5 °C' },
      { label: 'fill',         value: 'PVC film fill' },
      { label: 'chemistry',    value: 'biocide · cor-inhib · pH 8.0' },
      { label: 'instruments',  value: 'pH · conductivity · ORP' },
    ],
    sql: `SELECT  asset_id, t_in_c, t_out_c, drift_pct, ph, conductivity_us
  FROM  cognite.gold.cooling_tower_1m
 WHERE  asset_id = 'CT-901'
 ORDER BY ts DESC LIMIT 1;`,
    mock: { asset_id: 'CT-901', t_in_c: 38, t_out_c: 27, drift_pct: 0.01, ph: 8.04, conductivity_us: 1820 },
    roi: 'water · chemistry savings',
    workflow: flow(
      { code: 'PLANT · CW return', label: 'CW Return',   meta: '38 °C in' },
      { code: 'CT-901',            label: 'Cooling Tower', meta: 'evap-cool' },
      { code: 'PLANT · CW supply', label: 'CW Supply',   meta: '27 °C out' },
    ),
  },

  /* ── flare ── */
  {
    key: 'flare',
    code: 'FLR-1',
    family: 'SAFETY',
    title: 'Elevated Flare Stack',
    tagline: 'Smokeless steam-assisted flare. Handles upset relief. Pilot continuously monitored by Cortex.',
    icon: <Flame className="w-3.5 h-3.5" />,
    assetId: 'FLR-1',
    Viewer: () => <FlareModel label="FLR-1" />,
    kpis: [
      { label: 'pilot status', value: 'LIT',  tone: 'signal' },
      { label: 'flow',         value: '210',  unit: 'kg/h', tone: 'amber' },
      { label: 'steam ratio',  value: '0.8',  tone: 'cyan' },
    ],
    specs: [
      { label: 'type',           value: 'elevated · steam-assisted smokeless' },
      { label: 'height',         value: '200 ft (60 m)' },
      { label: 'tip',            value: 'multi-point air-assisted' },
      { label: 'pilot',          value: '3 pilot burners · thermocouple monitored' },
      { label: 'header design',  value: 'flare-header rated 1,200 °F' },
      { label: 'monitoring',     value: 'Cortex CV camera + pilot TC' },
    ],
    sql: `SELECT  asset_id, pilot_status, flare_flow_kg_h, steam_ratio,
        radiation_kw_m2, smoke_index
  FROM  cognite.gold.flare_state_1m
 WHERE  asset_id = 'FLR-1'
 ORDER BY ts DESC LIMIT 1;`,
    mock: { asset_id: 'FLR-1', pilot_status: 'LIT', flare_flow_kg_h: 210, steam_ratio: 0.8, smoke_index: 0.04 },
    roi: 'safety · emissions',
    workflow: flow(
      { code: 'PSV header', label: 'Relief Header', meta: 'upset routing' },
      { code: 'FLR-1',      label: 'Elevated Flare', meta: 'combustion' },
      { code: 'ATMOSPHERE', label: 'Vented CO₂ + H₂O', meta: 'CEMS monitored' },
    ),
  },

  /* ── treater ── */
  {
    key: 'treater',
    code: 'AMINE-401',
    family: 'CHEMISTRY',
    title: 'Amine Treater · MDEA',
    tagline: 'Absorber + regenerator. Removes H₂S and CO₂ from recycle gas using methyl-diethanolamine.',
    icon: <Droplets className="w-3.5 h-3.5" />,
    assetId: 'AMINE-401',
    Viewer: () => <AmineTreaterModel label="AMINE-401" />,
    kpis: [
      { label: 'H₂S in',  value: '420', unit: 'ppm', tone: 'amber' },
      { label: 'H₂S out', value: '4',   unit: 'ppm', tone: 'signal' },
      { label: 'amine flow', value: '85', unit: 'gpm', tone: 'cyan' },
    ],
    specs: [
      { label: 'solvent',         value: '50 wt% MDEA + activator' },
      { label: 'absorber',        value: '12-tray structured packing' },
      { label: 'regenerator',     value: '8-tray + reboiler R-401' },
      { label: 'design',          value: '60 bar / 60 °C absorber' },
      { label: 'lean loading',    value: '0.012 mol H₂S / mol MDEA' },
      { label: 'reboiler duty',   value: '1.8 MW · LP steam' },
    ],
    sql: `SELECT  asset_id, h2s_in_ppm, h2s_out_ppm, co2_in_ppm, co2_out_ppm,
        amine_flow_gpm, reboiler_duty_mw, lean_loading
  FROM  cognite.gold.amine_perf_1m
 WHERE  asset_id = 'AMINE-401'
 ORDER BY ts DESC LIMIT 1;`,
    mock: { asset_id: 'AMINE-401', h2s_in_ppm: 420, h2s_out_ppm: 4, co2_in_ppm: 1240, co2_out_ppm: 32, amine_flow_gpm: 85, reboiler_duty_mw: 1.8 },
    roi: 'spec · environmental',
    workflow: flow(
      { code: 'COMP-301',  label: 'Wet Gas Comp', meta: 'sour gas' },
      { code: 'AMINE-401', label: 'Amine Treat',  meta: 'H₂S strip' },
      { code: 'SRU-501',   label: 'Sulfur Plant', meta: 'acid gas out' },
    ),
  },

  /* ── sphere ── */
  {
    key: 'sphere',
    code: 'SPH-LPG-01',
    family: 'STORAGE',
    title: 'LPG Storage Sphere',
    tagline: 'Pressurized LPG storage. 25,000 m³. Refrigerated wall keeps butane below bubble point.',
    icon: <Container className="w-3.5 h-3.5" />,
    assetId: 'SPH-LPG-01',
    Viewer: () => <LpgSphereModel label="SPH-LPG-01" />,
    kpis: [
      { label: 'inventory',  value: '64',  unit: '%', tone: 'cyan' },
      { label: 'pressure',   value: '7.2', unit: 'barg', tone: 'amber' },
      { label: 'temperature', value: '12', unit: '°C',   tone: 'snow' },
    ],
    specs: [
      { label: 'capacity',    value: '25,000 m³' },
      { label: 'diameter',    value: '36.4 m' },
      { label: 'service',     value: 'C3/C4 mix · LPG' },
      { label: 'design',      value: '14 barg / -10 °C' },
      { label: 'legs',        value: '6 column legs · fire-proofed' },
      { label: 'instruments', value: 'radar level · PT × 2 · PSV × 4' },
    ],
    sql: `SELECT  asset_id, level_pct, pressure_barg, temperature_c, c3c4_ratio
  FROM  cognite.gold.sphere_state_1m
 WHERE  asset_id = 'SPH-LPG-01'
 ORDER BY ts DESC LIMIT 1;`,
    mock: { asset_id: 'SPH-LPG-01', level_pct: 64, pressure_barg: 7.2, temperature_c: 12, c3c4_ratio: 0.68 },
    roi: 'safety · containment',
    workflow: flow(
      { code: 'DEBUT-301', label: 'Debutanizer', meta: 'C4 to storage' },
      { code: 'SPH-LPG-01', label: 'LPG Sphere',  meta: '25,000 m³' },
      { code: 'PIPE-LPG',   label: 'LPG Pipeline', meta: 'to terminal' },
    ),
  },

  /* ── valve ── */
  {
    key: 'valve',
    code: 'FV-101',
    family: 'CONTROL',
    title: 'Control Valve · Globe Diaphragm',
    tagline: 'Final element for FIC-101 discharge flow loop. Linear-trim globe with diaphragm actuator.',
    icon: <Settings className="w-3.5 h-3.5" />,
    assetId: 'FV-101',
    Viewer: () => <ControlValveModel label="FV-101" />,
    kpis: [
      { label: 'position',   value: '46',   unit: '%', tone: 'cyan' },
      { label: 'travel',     value: '1.8M', unit: 'cycles', tone: 'snow' },
      { label: 'seat leak',  value: 'CL VI', tone: 'signal' },
    ],
    specs: [
      { label: 'body type',     value: 'globe · cage-guided linear' },
      { label: 'size',          value: '8" ANSI 300# RF' },
      { label: 'trim',          value: 'hardened 316SS · CL VI' },
      { label: 'actuator',      value: 'spring-diaphragm · fail-closed' },
      { label: 'positioner',    value: 'digital · HART · diagnostics' },
      { label: 'cv',            value: '210 (linear)' },
    ],
    sql: `SELECT  asset_id, position_pct, travel_total_cycles,
        deviation_pct, sp_pct, pv_pct, supply_kpa
  FROM  cognite.gold.valve_state_1m
 WHERE  asset_id = 'FV-101'
 ORDER BY ts DESC LIMIT 1;`,
    mock: { asset_id: 'FV-101', position_pct: 46, sp_pct: 48, pv_pct: 47.3, travel_total_cycles: 1820000, supply_kpa: 138 },
    roi: 'controllability · leak prevention',
    workflow: flow(
      { code: 'FIC-101', label: 'Flow Controller', meta: 'setpoint 1,450 gpm' },
      { code: 'FV-101',  label: 'Control Valve',   meta: 'CV 210 linear' },
      { code: 'HX-205',  label: 'Preheat HX',      meta: 'downstream' },
    ),
  },
]

/* ─────────────────── TAB ROOT ───────────────────────────────────── */

export function DevicesTab() {
  const [activeKey, setActiveKey] = useState<DeviceKey>('tank')
  const device = useMemo(() => DEVICES.find((d) => d.key === activeKey) ?? DEVICES[0], [activeKey])

  return (
    <div className="px-6 pb-8 space-y-4 animate-reveal-up">
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <div className="tag">CATALOG · REFINERY DEVICES</div>
          <h1 className="font-display text-2xl font-bold tracking-tight mt-1">
            13 canonical device classes · clickable systems · live telemetry
          </h1>
          <div className="tag mt-1 text-ink-muted">
            Browse every major piece of equipment in the process train. Each panel below mounts a 3D twin, a contextual workflow, mocked Snowflake queries and the device's spec sheet.
          </div>
        </div>
        <div className="flex gap-2">
          <Badge tone="cyan">3D · R3F</Badge>
          <Badge tone="snow">React Flow</Badge>
          <Badge tone="amber">CORTEX</Badge>
        </div>
      </div>

      {/* Sub-nav: device chooser */}
      <div className="flex flex-wrap gap-1.5 border-y border-edge-subtle py-3">
        {DEVICES.map((d) => {
          const active = d.key === activeKey
          return (
            <button
              key={d.key}
              onClick={() => setActiveKey(d.key)}
              className={cn(
                'group inline-flex items-center gap-1.5 px-2.5 py-1.5 border font-mono text-[10.5px] uppercase tracking-[0.14em] transition-all',
                active
                  ? 'bg-cyan/15 border-cyan text-cyan'
                  : 'border-edge-subtle text-ink-muted hover:border-cyan/60 hover:text-ink',
              )}
            >
              <span className={cn(active ? 'text-cyan' : 'text-ink-muted group-hover:text-cyan')}>
                {d.icon}
              </span>
              <span className="font-semibold">{d.code}</span>
              <span className="text-ink-muted hidden md:inline">· {d.family}</span>
            </button>
          )
        })}
      </div>

      {/* Identity + KPIs */}
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <div className="tag text-cyan">{device.family} · {device.code}</div>
          <h2 className="font-display text-xl font-bold tracking-tight mt-1">
            {device.title}
          </h2>
          <div className="font-mono text-[11px] text-ink-muted mt-1 max-w-3xl leading-relaxed">
            {device.tagline}
          </div>
        </div>
        <Badge tone="signal">{device.roi}</Badge>
      </div>

      <div className={cn('grid gap-3', device.kpis.length === 3 ? 'grid-cols-3' : 'grid-cols-4')}>
        {device.kpis.map((k) => (
          <Kpi key={k.label} label={k.label} value={k.value} unit={k.unit} tone={k.tone} delta={k.delta} />
        ))}
      </div>

      {/* 3D + Spec / Query row */}
      <div className="grid grid-cols-[1.2fr_1fr] gap-4">
        <Panel>
          <PanelHeader label={`${device.code} · 3D MODEL`} hint="orbit · pan · zoom">
            <Badge tone="copper">3D · R3F</Badge>
          </PanelHeader>
          <div className="h-[420px] relative">
            <device.Viewer />
            <div className="absolute top-3 left-3 panel-elev px-3 py-2">
              <div className="tag">ORBIT · PAN · ZOOM</div>
            </div>
          </div>
        </Panel>

        <div className="grid grid-rows-[auto_1fr] gap-4">
          <Panel>
            <PanelHeader label="SPEC SHEET" hint="design + service">
              <Badge tone="cyan">{device.code}</Badge>
            </PanelHeader>
            <div className="py-1">
              {device.specs.map((s) => (
                <DataRow key={s.label} label={s.label} value={s.value} />
              ))}
            </div>
          </Panel>
          {device.streamKey && (
            <Panel className="p-4">
              <StreamChart
                streamKey={device.streamKey}
                label={`${device.code} · LIVE TELEMETRY`}
                unit={device.streamUnit ?? ''}
                warn={device.streamWarn}
                threshold={device.streamThreshold}
                height={140}
                compact
              />
            </Panel>
          )}
        </div>
      </div>

      {/* Workflow + Query */}
      <div className="grid grid-cols-[1fr_360px] gap-4 items-stretch">
        <Panel className="flex flex-col">
          <PanelHeader label={`${device.code} · WORKFLOW IN THE PROCESS TRAIN`} hint="click nodes to inspect">
            <Badge tone="cyan">animated · draggable</Badge>
          </PanelHeader>
          <div className="p-2 flex-1 min-h-0">
            <FlowCanvas
              flowKey={`device-${device.key}`}
              nodes={device.workflow.nodes}
              edges={device.workflow.edges}
              height={220}
            />
          </div>
        </Panel>
        <FlowInspector />
      </div>

      <QueryPanel
        title={`SNOWFLAKE · ${device.code} state query`}
        sql={device.sql}
        cortex
        mock={device.mock}
        rows={1}
      />
    </div>
  )
}
