/**
 * RefineryTab — full process-train overview.
 *
 * Shows the 13 canonical refinery devices in series, as they would appear
 * in a real plant from crude receipt to final product / utilities. Two
 * complementary views:
 *
 *   1. A wide React Flow diagram: every device as a clickable node, with
 *      animated edges showing material flow. The user can click any node
 *      to inspect the device (uses the global FlowInspector + flowDetails
 *      pattern — but the details are inline here so we don't need a new
 *      entry in flowDetails.ts).
 *
 *   2. A 3D refinery panorama: a combined R3F scene with all 13 devices
 *      placed on a shared baseplate in process order, so the relative
 *      scale and spatial flow read at a glance.
 *
 *   3. A device strip below: jump-buttons that switch directly into the
 *      Devices tab focused on the selected device.
 */

import { useMemo, useRef } from 'react'
import type { Node, Edge } from '@xyflow/react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Text } from '@react-three/drei'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'

import { Panel, PanelHeader, Kpi } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { FlowCanvas } from '@/components/FlowCanvas'
import { FlowInspector } from '@/components/FlowInspector'
import { useUiStore } from '@/store/uiStore'
import { useInspectorStore } from '@/store/inspectorStore'
import { cn } from '@/lib/utils'
import type { NodeInspectorDetails } from '@/store/inspectorStore'

/* ─── device train (process order) ─────────────────────────────── */

interface TrainDevice {
  id: string
  code: string
  label: string
  family: string
  kind: 'source' | 'process' | 'ai' | 'output' | 'sink' | 'risk'
  meta: string
  details: NodeInspectorDetails
}

const TRAIN: TrainDevice[] = [
  { id: 'tk',   code: 'TK-501',      label: 'Crude Storage',     family: 'STORAGE',   kind: 'source',
    meta: '220 kbbl · API-650',
    details: {
      subsystem: 'STORAGE',
      summary: 'Crude inventory · floating roof · gauge to Cognite. Feeds PUMP-401 on demand.',
      kpis: [{ label: 'inventory', value: '167 kbbl', tone: 'cyan' }, { label: 'level', value: '18.2 m', tone: 'snow' }],
    } },
  { id: 'pump', code: 'PUMP-401',    label: 'Charge Pump',       family: 'ROTATING',  kind: 'process',
    meta: '1,450 gpm · API-610',
    details: {
      subsystem: 'ROTATING EQUIPMENT',
      summary: 'API-610 OH2 horizontal end-suction. Live vibration to Cortex anomaly detection.',
      streamKey: 'PUMP-401:vibration', streamUnit: 'mm/s', streamWarn: 5, streamThreshold: 6,
      kpis: [{ label: 'vibration', value: '4.81', tone: 'amber' }, { label: 'flow', value: '1,450 gpm', tone: 'cyan' }],
    } },
  { id: 'hx',   code: 'HX-205',      label: 'Preheat HX',        family: 'HEAT XFR',  kind: 'process',
    meta: '2.4 MW · TEMA AES',
    details: {
      subsystem: 'HEAT TRANSFER',
      summary: 'Crude vs atmospheric residue shell-and-tube. Fouling resistance live-tracked.',
      kpis: [{ label: 'duty', value: '2.4 MW', tone: 'cyan' }, { label: 'R_f', value: '4.6e-4', tone: 'amber' }],
    } },
  { id: 'fh',   code: 'F-101',       label: 'Charge Heater',     family: 'FIRED',     kind: 'process',
    meta: '120 MMBtu/h',
    details: {
      subsystem: 'FIRED HEATER',
      summary: 'Vertical box fired heater. Brings crude to 370 °C CDU inlet.',
      kpis: [{ label: 'duty', value: '118', tone: 'cyan' }, { label: 'stack T', value: '412 °C', tone: 'amber' }],
    } },
  { id: 'cdu',  code: 'CDU-100',     label: 'CDU Tower',         family: 'SEPARATION', kind: 'process',
    meta: '220 kbbl/d · 48 trays',
    details: {
      subsystem: 'DISTILLATION',
      summary: 'Atmospheric crude distillation. Naphtha/Kero/LGO/HGO/AGO/AR side draws.',
      streamKey: 'CDU-100:temperature', streamUnit: '°C', streamWarn: 365, streamThreshold: 372,
      kpis: [{ label: 'top T', value: '128 °C', tone: 'cyan' }, { label: 'bottom T', value: '358 °C', tone: 'amber' }],
    } },
  { id: 'vdu',  code: 'VDU-200',     label: 'Vacuum Tower',      family: 'SEPARATION', kind: 'process',
    meta: 'AR feed · vacuum',
    details: {
      subsystem: 'DISTILLATION',
      summary: 'Vacuum distillation of atmospheric resid into VGO and vacuum resid. 28 trays.',
      kpis: [{ label: 'top P', value: '40 mmHg', tone: 'cyan' }, { label: 'feed T', value: '388 °C', tone: 'amber' }],
    } },
  { id: 'fcc',  code: 'FCC-FRAC',    label: 'FCC + Fractionator', family: 'CHEMISTRY', kind: 'process',
    meta: 'gasoline producer',
    details: {
      subsystem: 'CONVERSION',
      summary: 'Fluid catalytic cracker — converts VGO to gasoline, LCO, slurry. Riser-style.',
      kpis: [{ label: 'conv', value: '74%', tone: 'signal' }, { label: 'cat circ', value: '8.4 kt/h', tone: 'snow' }],
    } },
  { id: 'rx',   code: 'RX-HDT-01',   label: 'Hydrotreater',      family: 'CHEMISTRY', kind: 'process',
    meta: 'fixed-bed · ULSD',
    details: {
      subsystem: 'REACTOR',
      summary: 'Single-stage diesel hydrotreater. Co-Mo catalyst. ULSD spec.',
      kpis: [{ label: 'bed T', value: '342 °C', tone: 'amber' }, { label: 'product S', value: '8 ppm', tone: 'signal' }],
    } },
  { id: 'ko',   code: 'KO-DRUM-301', label: 'KO Drum',           family: 'SEPARATION', kind: 'process',
    meta: '3-phase · 24 bar',
    details: {
      subsystem: 'SEPARATION',
      summary: 'Horizontal 3-phase separator. Splits HDT effluent into recycle gas, oil, sour water.',
      kpis: [{ label: 'level', value: '62 %', tone: 'cyan' }, { label: 'P_op', value: '24 bar', tone: 'amber' }],
    } },
  { id: 'comp', code: 'COMP-301',    label: 'Wet Gas Comp',      family: 'ROTATING',  kind: 'process',
    meta: '12 MW · 5-stage',
    details: {
      subsystem: 'ROTATING EQUIPMENT',
      summary: 'Recycle gas compressor — multi-stage centrifugal, turbine-driven.',
      streamKey: 'COMP-301:flow', streamUnit: 'kbbl/d', streamWarn: 152, streamThreshold: 158,
      kpis: [{ label: 'discharge', value: '36 bar', tone: 'amber' }, { label: 'speed', value: '9,180 RPM', tone: 'cyan' }],
    } },
  { id: 'am',   code: 'AMINE-401',   label: 'Amine Treat',       family: 'CHEMISTRY', kind: 'process',
    meta: 'MDEA · H₂S strip',
    details: {
      subsystem: 'TREATMENT',
      summary: 'Absorber + regenerator. Removes H₂S/CO₂ from sour gas. Acid gas to SRU.',
      kpis: [{ label: 'H₂S out', value: '4 ppm', tone: 'signal' }, { label: 'amine', value: '85 gpm', tone: 'cyan' }],
    } },
  { id: 'sph',  code: 'SPH-LPG-01',  label: 'LPG Sphere',        family: 'STORAGE',   kind: 'sink',
    meta: '25,000 m³',
    details: {
      subsystem: 'STORAGE',
      summary: 'Pressurized C3/C4 storage. 6-leg sphere. PSV protected.',
      kpis: [{ label: 'inventory', value: '64 %', tone: 'cyan' }, { label: 'P', value: '7.2 barg', tone: 'amber' }],
    } },
  { id: 'flr',  code: 'FLR-1',       label: 'Flare',             family: 'SAFETY',    kind: 'risk',
    meta: 'elevated · 200 ft',
    details: {
      subsystem: 'SAFETY',
      summary: 'Elevated steam-assisted smokeless flare. PSV header destination.',
      kpis: [{ label: 'pilot', value: 'LIT', tone: 'signal' }, { label: 'flow', value: '210 kg/h', tone: 'amber' }],
    } },
]

/* ─── React Flow graph for the train (process order) ─────────────── */

const TRAIN_FLOW: { nodes: Node[]; edges: Edge[] } = (() => {
  const cols = TRAIN.length
  const W = 1240
  const margin = 40
  const stepX = (W - margin * 2) / (cols - 1)
  const baseY = 100

  const nodes: Node[] = TRAIN.map((d, i) => ({
    id: d.id,
    type: 'schematic',
    position: { x: margin + i * stepX, y: i % 2 === 0 ? baseY : baseY + 60 },
    data: { code: d.code, label: d.label, kind: d.kind, status: 'ok', meta: d.meta, details: d.details },
  }))

  const edges: Edge[] = TRAIN.slice(0, -1).map((d, i) => ({
    id: `e-${d.id}-${TRAIN[i + 1].id}`,
    source: d.id,
    target: TRAIN[i + 1].id,
    animated: true,
    style: { stroke: i < 4 ? '#c79a4a' : i < 8 ? '#4ee2f4' : '#34d57b' },
    data: {
      details: {
        subsystem: 'PROCESS FLOW',
        contract: `${d.code} → ${TRAIN[i + 1].code}`,
        format: 'piping · 8" to 36" depending on segment',
        latency: 'continuous',
        analysis: `Material flows from ${d.label} into ${TRAIN[i + 1].label}. Cognite sensors track flow, pressure and temperature on every connecting line.`,
      },
    },
  }))

  // utility loops (flare from KO/comp; LPG sphere from amine; flare from sphere PSV)
  edges.push({
    id: 'e-ko-flr',
    source: 'ko', target: 'flr', animated: true,
    style: { stroke: '#ff6b35', strokeDasharray: '4 3' },
    data: { details: { subsystem: 'RELIEF', contract: 'KO-DRUM-301 PSV → FLR-1', latency: 'event' } },
  })
  edges.push({
    id: 'e-sph-flr',
    source: 'sph', target: 'flr', animated: true,
    style: { stroke: '#ff6b35', strokeDasharray: '4 3' },
    data: { details: { subsystem: 'RELIEF', contract: 'SPH-LPG-01 PSV × 4 → FLR-1', latency: 'event' } },
  })

  return { nodes, edges }
})()

/* ─── 3D refinery panorama — every device on one baseplate ───────── */

function RefineryPanorama() {
  // Place each device along the X axis, alternating Y for visual flow
  const positions = useMemo(() => {
    return TRAIN.map((_, i) => {
      const x = -16 + i * 2.6
      const y = i % 2 === 0 ? 0 : 0
      const z = i % 2 === 0 ? 0 : -1.2
      return { x, y, z }
    })
  }, [])

  const controlsRef = useRef<OrbitControlsImpl | null>(null)

  return (
    // Start the camera *far* — the CameraDolly will ease it in to the framed view.
    <Canvas camera={{ position: [60, 48, 100], fov: 38 }} dpr={[1, 1.6]}>
      <color attach="background" args={['#080e18']} />
      <fog attach="fog" args={['#080e18', 24, 90]} />
      <ambientLight intensity={1.2} />
      <hemisphereLight args={['#e6efff', '#1a2638', 1.0]} />
      <directionalLight position={[10, 16, 12]} intensity={1.8} color="#ffffff" />
      <pointLight position={[-8, 6, -5]} intensity={0.7} color="#1ea7ff" />

      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.6, 0]}>
        <planeGeometry args={[60, 18]} />
        <meshStandardMaterial color="#0c1424" roughness={0.95} metalness={0.05} />
      </mesh>

      {/* Pipe-rack spine (running the length of the plant) */}
      <mesh position={[0, -0.2, 1.4]}>
        <boxGeometry args={[36, 0.12, 0.18]} />
        <meshStandardMaterial color="#3a4a64" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[0, -0.4, 1.4]}>
        <boxGeometry args={[36, 0.12, 0.18]} />
        <meshStandardMaterial color="#3a4a64" metalness={0.6} roughness={0.4} />
      </mesh>

      {/* Devices as simple parametric shapes */}
      {TRAIN.map((d, i) => {
        const p = positions[i]
        return <DeviceMarker key={d.id} device={d} x={p.x} y={p.y} z={p.z} />
      })}

      {/* Cinematic intro dolly — eases the camera from far to framed view */}
      <CameraDolly
        target={[8, 9, 22]}
        durationMs={2400}
        controlsRef={controlsRef}
      />

      <OrbitControls
        ref={controlsRef}
        enablePan
        screenSpacePanning
        minDistance={5}
        maxDistance={120}
        minPolarAngle={0.05}
        maxPolarAngle={Math.PI - 0.05}
        target={[0, 0, 0]}
      />
    </Canvas>
  )
}

/**
 * CameraDolly — animates the active camera from its initial position to
 * `target` over `durationMs` using easeOutCubic. While the animation is
 * running, OrbitControls user input is suppressed (controlsRef.enabled =
 * false); once complete, controls are re-enabled so the user can orbit
 * naturally.
 */
function CameraDolly({
  target,
  durationMs,
  controlsRef,
}: {
  target: [number, number, number]
  durationMs: number
  controlsRef: React.MutableRefObject<OrbitControlsImpl | null>
}) {
  const { camera } = useThree()
  const startRef = useRef<{ t0: number; from: [number, number, number] } | null>(null)
  const doneRef = useRef(false)

  useFrame(() => {
    if (doneRef.current) return
    const now = performance.now()
    if (!startRef.current) {
      startRef.current = { t0: now, from: [camera.position.x, camera.position.y, camera.position.z] }
      if (controlsRef.current) controlsRef.current.enabled = false
    }
    const { t0, from } = startRef.current
    const t = Math.min(1, (now - t0) / durationMs)
    // easeOutCubic
    const e = 1 - Math.pow(1 - t, 3)
    camera.position.set(
      from[0] + (target[0] - from[0]) * e,
      from[1] + (target[1] - from[1]) * e,
      from[2] + (target[2] - from[2]) * e,
    )
    camera.lookAt(0, 0, 0)
    if (t >= 1) {
      doneRef.current = true
      if (controlsRef.current) {
        controlsRef.current.enabled = true
        controlsRef.current.update()
      }
    }
  })
  return null
}

function DeviceMarker({ device, x, y, z }: { device: TrainDevice; x: number; y: number; z: number }) {
  const selectNode = useInspectorStore((s) => s.selectNode)
  const active = useInspectorStore((s) => s.active)
  const isSelected =
    active && active.kind === 'node' && active.flowKey === 'refinery-3d' && active.id === device.id

  function handleClick(e: { stopPropagation: () => void }) {
    e.stopPropagation()
    selectNode({
      kind: 'node',
      flowKey: 'refinery-3d',
      id: device.id,
      label: device.label,
      code: device.code,
      details: device.details,
    })
  }

  // Render a stylized icon for each family
  const renderShape = () => {
    switch (device.family) {
      case 'STORAGE':
        return (
          <mesh>
            <cylinderGeometry args={[0.9, 0.9, 1.8, 28]} />
            <meshStandardMaterial color="#586984" metalness={0.5} roughness={0.5} />
          </mesh>
        )
      case 'ROTATING':
        return (
          <>
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.45, 0.45, 1.4, 24]} />
              <meshStandardMaterial color="#4a5d80" metalness={0.6} roughness={0.4} />
            </mesh>
            <mesh position={[0, 0.45, 0]}>
              <cylinderGeometry args={[0.12, 0.12, 0.5, 12]} />
              <meshStandardMaterial color="#c79a4a" metalness={0.7} roughness={0.4} />
            </mesh>
          </>
        )
      case 'HEAT XFR':
        return (
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.45, 0.45, 2.0, 24]} />
            <meshStandardMaterial color="#9aa0aa" metalness={0.3} roughness={0.7} />
          </mesh>
        )
      case 'FIRED':
        return (
          <>
            <mesh>
              <boxGeometry args={[1.2, 1.6, 1.2]} />
              <meshStandardMaterial color="#586984" metalness={0.45} roughness={0.55} />
            </mesh>
            <mesh position={[0, 1.4, 0]}>
              <cylinderGeometry args={[0.25, 0.25, 1.0, 16]} />
              <meshStandardMaterial color="#3a4a64" metalness={0.5} roughness={0.55} />
            </mesh>
          </>
        )
      case 'SEPARATION':
        // Column-ish tall cylinder
        return (
          <mesh position={[0, 0.4, 0]}>
            <cylinderGeometry args={[0.5, 0.5, 2.4, 24]} />
            <meshStandardMaterial color="#586984" metalness={0.55} roughness={0.45} />
          </mesh>
        )
      case 'CHEMISTRY':
        return (
          <mesh position={[0, 0.4, 0]}>
            <cylinderGeometry args={[0.6, 0.6, 1.8, 24]} />
            <meshStandardMaterial color="#4a5d80" metalness={0.55} roughness={0.45} />
          </mesh>
        )
      case 'SAFETY':
        return (
          <>
            <mesh position={[0, 0.8, 0]}>
              <cylinderGeometry args={[0.16, 0.2, 2.8, 16]} />
              <meshStandardMaterial color="#3a4a64" metalness={0.5} roughness={0.55} />
            </mesh>
            <mesh position={[0, 2.4, 0]}>
              <coneGeometry args={[0.3, 0.7, 16]} />
              <meshStandardMaterial color="#ff6b35" emissive="#ff6b35" emissiveIntensity={1.5} transparent opacity={0.9} />
            </mesh>
          </>
        )
      default:
        return (
          <mesh>
            <boxGeometry args={[0.8, 1.2, 0.8]} />
            <meshStandardMaterial color="#586984" />
          </mesh>
        )
    }
  }

  return (
    <group
      position={[x, y, z]}
      onClick={handleClick}
      onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer' }}
      onPointerOut={(e)  => { e.stopPropagation(); document.body.style.cursor = 'default' }}
      scale={isSelected ? 1.18 : 1.0}
    >
      {renderShape()}
      {/* Selection halo */}
      {isSelected && (
        <mesh position={[0, -1.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.0, 1.15, 32]} />
          <meshStandardMaterial color="#4ee2f4" emissive="#4ee2f4" emissiveIntensity={1.4} transparent opacity={0.9} />
        </mesh>
      )}
      <Text
        position={[0, -1.1, 0]}
        fontSize={0.22}
        color={isSelected ? '#4ee2f4' : '#1ea7ff'}
        anchorX="center"
        outlineWidth={0.03}
        outlineColor="#080e18"
        renderOrder={999}
        onUpdate={(self: object) => {
          const obj = self as { traverse: (cb: (c: { material?: { depthTest?: boolean; depthWrite?: boolean; transparent?: boolean; needsUpdate?: boolean } | unknown[]; renderOrder?: number }) => void) => void }
          obj.traverse((c: { material?: unknown; renderOrder?: number }) => {
            const mat = (c as { material?: unknown }).material
            if (!mat) return
            const apply = (m: { depthTest?: boolean; depthWrite?: boolean; transparent?: boolean; needsUpdate?: boolean }) => {
              m.depthTest = false; m.depthWrite = false; m.transparent = true; m.needsUpdate = true
            }
            Array.isArray(mat) ? mat.forEach(apply) : apply(mat as { depthTest?: boolean; depthWrite?: boolean; transparent?: boolean; needsUpdate?: boolean })
            ;(c as { renderOrder?: number }).renderOrder = 999
          })
        }}
      >
        {device.code}
      </Text>
    </group>
  )
}

/* ─── TAB ROOT ──────────────────────────────────────────────────── */

export function RefineryTab() {
  const goTo = useUiStore((s) => s.setTab)

  return (
    <div className="px-6 pb-8 space-y-4 animate-reveal-up">
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <div className="tag">PROCESS TRAIN · END-TO-END</div>
          <h1 className="font-display text-2xl font-bold tracking-tight mt-1">
            Texas Refining · 13-device process train
          </h1>
          <div className="tag mt-1 text-ink-muted">
            All thirteen canonical refinery devices in process order — from crude tank to LPG sphere and flare. Click any node for telemetry. Open a device in the Catalog tab for its 3D model and spec sheet.
          </div>
        </div>
        <div className="flex gap-2">
          <Badge tone="cyan">React Flow</Badge>
          <Badge tone="snow">3D · R3F</Badge>
          <Badge tone="signal">live</Badge>
        </div>
      </div>

      {/* Headline KPIs (plant-level) */}
      <div className="grid grid-cols-4 gap-3">
        <Kpi label="Crude throughput"  value="220" unit="kbbl/d" tone="cyan"   delta="+4 vs LP" />
        <Kpi label="Gasoline yield"    value="51.2" unit="%"      tone="signal" delta="+0.4" />
        <Kpi label="Energy intensity"  value="38.4" unit="kBTU/bbl" tone="amber" />
        <Kpi label="ULSD spec margin"  value="8" unit="ppm S"    tone="signal" />
      </div>

      {/* React Flow process-train */}
      <div className="grid grid-cols-[1fr_360px] gap-4 items-stretch">
        <Panel className="flex flex-col">
          <PanelHeader label="PROCESS TRAIN · 13 DEVICES IN SERIES" hint="click nodes/edges to inspect">
            <Badge tone="cyan">animated · draggable</Badge>
          </PanelHeader>
          <div className="p-2 flex-1 min-h-0">
            <FlowCanvas
              flowKey="refinery"
              nodes={TRAIN_FLOW.nodes}
              edges={TRAIN_FLOW.edges}
              height={420}
            />
          </div>
        </Panel>
        <FlowInspector />
      </div>

      {/* 3D panorama + inspector — height matches the workflow diagram row above */}
      <div className="grid grid-cols-[1fr_360px] gap-4 items-stretch">
        <Panel className="flex flex-col min-h-[480px]">
          <PanelHeader label="3D PLANT PANORAMA · all 13 devices on one baseplate" hint="click any device · orbit · pan · zoom">
            <Badge tone="cyan">interactive</Badge>
            <Badge tone="copper">3D · R3F</Badge>
          </PanelHeader>
          <div className="relative flex-1 min-h-[420px]">
            <RefineryPanorama />
            <div className="absolute top-3 left-3 panel-elev px-3 py-2">
              <div className="tag">CLICK · ORBIT · PAN · ZOOM</div>
            </div>
            <div className="absolute top-3 right-3 panel-elev px-3 py-2">
              <div className="tag">PROCESS FLOW · CRUDE → LPG / FLARE</div>
            </div>
          </div>
        </Panel>
        <FlowInspector />
      </div>

      {/* Device strip — quick-jump to Catalog */}
      <Panel>
        <PanelHeader label="JUMP TO DEVICE · open Catalog tab" hint="13 devices">
          <Badge tone="cyan">CATALOG</Badge>
        </PanelHeader>
        <div className="p-4 grid grid-cols-3 md:grid-cols-4 xl:grid-cols-7 gap-2">
          {TRAIN.map((d) => (
            <button
              key={d.id}
              onClick={() => goTo('devices')}
              className={cn(
                'group flex flex-col items-start gap-1 px-3 py-2 border border-edge-subtle text-left transition-all',
                'hover:border-cyan/60 hover:bg-bg-panel/80',
              )}
              title={`Open Catalog · ${d.code}`}
            >
              <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-cyan">{d.code}</span>
              <span className="font-cond text-[12px] text-ink leading-tight">{d.label}</span>
              <span className="font-mono text-[9.5px] text-ink-muted leading-tight">{d.meta}</span>
            </button>
          ))}
        </div>
      </Panel>
    </div>
  )
}
