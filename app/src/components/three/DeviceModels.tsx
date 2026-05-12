/**
 * DeviceModels.tsx — small R3F primitives for every major refinery device
 * class. Each component is a self-contained <Canvas> that the DevicesTab
 * mounts inside a panel.
 *
 * Devices implemented here:
 *   StorageTankModel        · API-650 floating-roof tank
 *   HeatExchangerModel      · TEMA AES shell-and-tube
 *   FiredHeaterModel        · vertical box furnace with stack
 *   DistillationColumnModel · packed/trayed column with reboiler
 *   ReactorModel            · vertical fixed-bed reactor with internals hint
 *   KODrumModel             · horizontal knock-out drum
 *   CompressorModel         · centrifugal compressor on baseplate
 *   CoolingTowerModel       · induced-draft counterflow cooling tower
 *   FlareStackModel         · ground flare with elevated tip + pilot
 *   AmineTreaterModel       · absorber + regenerator column pair
 *   LpgSphereModel          · spherical LPG storage vessel on legs
 *   ControlValveModel       · globe-style control valve with actuator
 *
 * Existing CDUColumn, PumpModel, Smokestack stay in their own files and
 * are referenced by the DevicesTab as device viewers.
 */

import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Text } from '@react-three/drei'
import * as THREE from 'three'

const C = {
  fog:        '#080e18',
  steel:      '#586984',
  steelDk:    '#3a4a64',
  cyan:       '#4ee2f4',
  snow:       '#1ea7ff',
  amber:      '#ffb627',
  signal:     '#34d57b',
  alarm:      '#ef4444',
  copper:     '#c79a4a',
  flare:      '#ff6b35',
  insulation: '#9aa0aa',
}

/* ─── reusable orbit controls + lighting ───────────────────────────── */
function StandardCanvas({
  children,
  cameraPos = [4, 3, 6],
  fov = 40,
}: {
  children: React.ReactNode
  cameraPos?: [number, number, number]
  fov?: number
}) {
  return (
    <Canvas camera={{ position: cameraPos, fov }} dpr={[1, 1.8]}>
      <color attach="background" args={[C.fog]} />
      <fog attach="fog" args={[C.fog, 22, 70]} />
      <ambientLight intensity={1.35} />
      <hemisphereLight args={['#e6efff', '#1a2638', 1.0]} />
      <directionalLight position={[8, 12, 8]} intensity={2.0} color="#ffffff" />
      <pointLight position={[-6, 4, -5]} intensity={0.9} color={C.snow} />
      <pointLight position={[5, 3, 6]}  intensity={0.9} color={C.cyan} />
      {children}
      <OrbitControls
        enablePan
        screenSpacePanning
        minDistance={2}
        maxDistance={60}
        minPolarAngle={0.05}
        maxPolarAngle={Math.PI - 0.05}
      />
    </Canvas>
  )
}

function Floor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.5, 0]} receiveShadow>
      <planeGeometry args={[30, 30]} />
      <meshStandardMaterial color="#0c1424" roughness={0.95} metalness={0.05} />
    </mesh>
  )
}

function NameLabel({ y, text, color = C.snow }: { y: number; text: string; color?: string }) {
  return (
    <Text
      position={[0, y, 0]}
      fontSize={0.22}
      color={color}
      anchorX="center"
      anchorY="middle"
      outlineWidth={0.035}
      outlineColor="#080e18"
      renderOrder={999}
      onUpdate={(self: THREE.Object3D) => {
        self.traverse((c) => {
          const mesh = c as THREE.Mesh
          const mat = mesh.material as THREE.Material | THREE.Material[] | undefined
          if (!mat) return
          const apply = (m: THREE.Material) => {
            m.depthTest = false
            m.depthWrite = false
            m.transparent = true
            m.needsUpdate = true
          }
          Array.isArray(mat) ? mat.forEach(apply) : apply(mat)
          mesh.renderOrder = 999
        })
      }}
    >
      {text}
    </Text>
  )
}

/* ─── 1 · Floating-roof storage tank ─────────────────────────────── */
export function StorageTankModel({ label = 'TK-501', fill = 0.76 }: { label?: string; fill?: number }) {
  return (
    <StandardCanvas cameraPos={[5, 4, 6]} fov={40}>
      <Floor />
      <group position={[0, -0.5, 0]}>
        {/* shell */}
        <mesh>
          <cylinderGeometry args={[1.6, 1.6, 2.2, 32, 1, true]} />
          <meshStandardMaterial color={C.steel} metalness={0.45} roughness={0.55} side={THREE.DoubleSide} />
        </mesh>
        {/* shell rings (welded courses) */}
        {[-0.6, 0, 0.6].map((y, i) => (
          <mesh key={i} position={[0, y, 0]}>
            <torusGeometry args={[1.6, 0.02, 4, 32]} />
            <meshStandardMaterial color={C.steelDk} metalness={0.5} roughness={0.5} />
          </mesh>
        ))}
        {/* fluid level / floating roof */}
        <mesh position={[0, -1.1 + 2.2 * fill, 0]}>
          <cylinderGeometry args={[1.55, 1.55, 0.06, 32]} />
          <meshStandardMaterial color={C.amber} metalness={0.3} roughness={0.6} emissive={C.amber} emissiveIntensity={0.18} />
        </mesh>
        {/* top rim */}
        <mesh position={[0, 1.12, 0]}>
          <torusGeometry args={[1.6, 0.05, 6, 32]} />
          <meshStandardMaterial color={C.steelDk} metalness={0.55} roughness={0.45} />
        </mesh>
        {/* spiral stairs */}
        {Array.from({ length: 14 }).map((_, i) => {
          const a = (i / 14) * Math.PI * 1.4
          return (
            <mesh
              key={i}
              position={[Math.cos(a) * 1.65, -1.0 + (i / 14) * 2.1, Math.sin(a) * 1.65]}
              rotation={[0, -a + Math.PI / 2, 0]}
            >
              <boxGeometry args={[0.4, 0.04, 0.16]} />
              <meshStandardMaterial color={C.steelDk} metalness={0.5} roughness={0.5} />
            </mesh>
          )
        })}
        {/* manway */}
        <mesh position={[1.65, -0.8, 0]}>
          <cylinderGeometry args={[0.18, 0.18, 0.1, 16]} />
          <meshStandardMaterial color={C.copper} metalness={0.7} roughness={0.4} />
        </mesh>
      </group>
      <NameLabel y={2.4} text={`${label} · API-650 · 220 kbbl`} />
    </StandardCanvas>
  )
}

/* ─── 2 · Shell-and-tube heat exchanger (TEMA AES) ─────────────────── */
export function HeatExchangerModel({ label = 'HX-205' }: { label?: string }) {
  return (
    <StandardCanvas cameraPos={[5, 3, 6]} fov={40}>
      <Floor />
      <group rotation={[0, 0, Math.PI / 2]} position={[0, -0.3, 0]}>
        {/* shell */}
        <mesh>
          <cylinderGeometry args={[0.7, 0.7, 3.6, 28]} />
          <meshStandardMaterial color={C.steel} metalness={0.55} roughness={0.45} />
        </mesh>
        {/* insulation jacket — slightly larger and matte */}
        <mesh>
          <cylinderGeometry args={[0.82, 0.82, 3.0, 28, 1, true]} />
          <meshStandardMaterial color={C.insulation} metalness={0.1} roughness={0.85} side={THREE.DoubleSide} />
        </mesh>
        {/* channel / bonnet (left) */}
        <mesh position={[0, 1.9, 0]}>
          <cylinderGeometry args={[0.78, 0.78, 0.5, 28]} />
          <meshStandardMaterial color={C.steelDk} metalness={0.6} roughness={0.45} />
        </mesh>
        {/* rear head (right) */}
        <mesh position={[0, -1.9, 0]}>
          <sphereGeometry args={[0.78, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color={C.steelDk} metalness={0.6} roughness={0.45} />
        </mesh>
        {/* nozzles — shell side (in/out) */}
        <mesh position={[0, 1.3, 0.85]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.16, 0.16, 0.5, 16]} />
          <meshStandardMaterial color={C.copper} metalness={0.7} roughness={0.4} />
        </mesh>
        <mesh position={[0, -1.3, -0.85]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.16, 0.16, 0.5, 16]} />
          <meshStandardMaterial color={C.copper} metalness={0.7} roughness={0.4} />
        </mesh>
        {/* tube-side nozzles */}
        <mesh position={[0, 2.05, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.16, 0.16, 0.4, 16]} />
          <meshStandardMaterial color={C.copper} metalness={0.7} roughness={0.4} />
        </mesh>
        <mesh position={[0, 2.2, 0.6]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.16, 0.16, 0.3, 16]} />
          <meshStandardMaterial color={C.copper} metalness={0.7} roughness={0.4} />
        </mesh>
        {/* saddle supports */}
        <mesh position={[0, 1.2, -0.65]} rotation={[Math.PI / 2, 0, 0]}>
          <boxGeometry args={[0.7, 0.2, 0.6]} />
          <meshStandardMaterial color={C.steelDk} metalness={0.5} roughness={0.55} />
        </mesh>
        <mesh position={[0, -1.2, -0.65]} rotation={[Math.PI / 2, 0, 0]}>
          <boxGeometry args={[0.7, 0.2, 0.6]} />
          <meshStandardMaterial color={C.steelDk} metalness={0.5} roughness={0.55} />
        </mesh>
      </group>
      <NameLabel y={2.0} text={`${label} · TEMA AES · 2.4 MW`} />
    </StandardCanvas>
  )
}

/* ─── 3 · Vertical box-type fired heater ───────────────────────────── */
function FurnaceInternals() {
  const flameRef = useRef<THREE.Mesh>(null)
  useFrame((state) => {
    if (flameRef.current) {
      const t = state.clock.elapsedTime
      flameRef.current.scale.y = 1 + Math.sin(t * 6) * 0.18 + Math.random() * 0.05
      const m = flameRef.current.material as THREE.MeshStandardMaterial
      m.emissiveIntensity = 1.2 + Math.sin(t * 8) * 0.4
    }
  })
  return (
    <group position={[0, -1.2, 0]}>
      {/* convection box top */}
      <mesh position={[0, 2.0, 0]}>
        <boxGeometry args={[1.6, 1.0, 1.6]} />
        <meshStandardMaterial color={C.steelDk} metalness={0.45} roughness={0.6} />
      </mesh>
      {/* radiant section (refractory-lined firebox) */}
      <mesh position={[0, 0.7, 0]}>
        <boxGeometry args={[2.0, 1.6, 2.0]} />
        <meshStandardMaterial color={C.steel} metalness={0.45} roughness={0.55} />
      </mesh>
      {/* burner port (visible glow) */}
      <mesh ref={flameRef} position={[0, 0.0, 0]}>
        <coneGeometry args={[0.5, 0.9, 16]} />
        <meshStandardMaterial color={C.flare} emissive={C.flare} emissiveIntensity={1.4} transparent opacity={0.85} />
      </mesh>
      {/* stack */}
      <mesh position={[0, 3.0, 0]}>
        <cylinderGeometry args={[0.4, 0.4, 1.4, 24]} />
        <meshStandardMaterial color={C.steelDk} metalness={0.45} roughness={0.55} />
      </mesh>
      {/* observation door */}
      <mesh position={[1.0, 0.2, 1.01]}>
        <boxGeometry args={[0.3, 0.3, 0.05]} />
        <meshStandardMaterial color={C.copper} metalness={0.6} roughness={0.4} />
      </mesh>
      {/* feed nozzle */}
      <mesh position={[-1.1, 1.2, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.12, 0.12, 0.5, 16]} />
        <meshStandardMaterial color={C.copper} metalness={0.7} roughness={0.4} />
      </mesh>
    </group>
  )
}
export function FiredHeaterModel({ label = 'F-101' }: { label?: string }) {
  return (
    <StandardCanvas cameraPos={[6, 4, 6]} fov={40}>
      <Floor />
      <FurnaceInternals />
      <NameLabel y={3.0} text={`${label} · BOX FURNACE · 120 MMBtu/h`} />
    </StandardCanvas>
  )
}

/* ─── 4 · Distillation column (generic) ───────────────────────────── */
export function ColumnModel({ label = 'COL-200', height = 3.6, trays = 24 }: { label?: string; height?: number; trays?: number }) {
  return (
    <StandardCanvas cameraPos={[5, 3.5, 6.5]} fov={36}>
      <Floor />
      <group position={[0, -1.2, 0]}>
        {/* shell */}
        <mesh position={[0, height / 2, 0]}>
          <cylinderGeometry args={[0.6, 0.6, height, 32]} />
          <meshStandardMaterial color={C.steel} metalness={0.55} roughness={0.45} />
        </mesh>
        {/* tray indications */}
        {Array.from({ length: trays }).map((_, i) => {
          const y = 0.15 + (i / (trays - 1)) * (height - 0.3)
          return (
            <mesh key={i} position={[0, y, 0]}>
              <torusGeometry args={[0.6, 0.014, 4, 28]} />
              <meshStandardMaterial color={C.copper} metalness={0.6} roughness={0.5} />
            </mesh>
          )
        })}
        {/* top dome */}
        <mesh position={[0, height + 0.15, 0]}>
          <sphereGeometry args={[0.6, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color={C.steelDk} metalness={0.55} roughness={0.5} />
        </mesh>
        {/* overhead pipe */}
        <mesh position={[0.9, height + 0.15, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.14, 0.14, 0.8, 16]} />
          <meshStandardMaterial color={C.copper} metalness={0.7} roughness={0.4} />
        </mesh>
        {/* feed nozzle (middle) */}
        <mesh position={[0.85, height * 0.55, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.1, 0.1, 0.5, 16]} />
          <meshStandardMaterial color={C.copper} metalness={0.7} roughness={0.4} />
        </mesh>
        {/* bottoms */}
        <mesh position={[0, -0.05, 0]}>
          <sphereGeometry args={[0.6, 24, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
          <meshStandardMaterial color={C.steelDk} metalness={0.55} roughness={0.5} />
        </mesh>
        {/* skirt */}
        <mesh position={[0, -0.55, 0]}>
          <cylinderGeometry args={[0.55, 0.7, 0.6, 28]} />
          <meshStandardMaterial color={C.steelDk} metalness={0.45} roughness={0.6} />
        </mesh>
      </group>
      <NameLabel y={height + 0.7} text={`${label} · ${trays}-tray · packed bed`} />
    </StandardCanvas>
  )
}

/* ─── 5 · Vertical fixed-bed reactor ──────────────────────────────── */
export function ReactorModel({ label = 'RX-HDT-01' }: { label?: string }) {
  return (
    <StandardCanvas cameraPos={[5, 3.5, 6]} fov={38}>
      <Floor />
      <group position={[0, -1.2, 0]}>
        {/* shell with semi-elliptical heads */}
        <mesh position={[0, 1.4, 0]}>
          <cylinderGeometry args={[0.75, 0.75, 2.6, 32]} />
          <meshStandardMaterial color={C.steel} metalness={0.55} roughness={0.45} />
        </mesh>
        {/* insulation band */}
        <mesh position={[0, 1.4, 0]}>
          <cylinderGeometry args={[0.85, 0.85, 2.2, 28, 1, true]} />
          <meshStandardMaterial color={C.insulation} metalness={0.1} roughness={0.85} side={THREE.DoubleSide} />
        </mesh>
        {/* top head */}
        <mesh position={[0, 2.7, 0]}>
          <sphereGeometry args={[0.75, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color={C.steelDk} metalness={0.55} roughness={0.45} />
        </mesh>
        {/* bottom head */}
        <mesh position={[0, 0.1, 0]}>
          <sphereGeometry args={[0.75, 24, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
          <meshStandardMaterial color={C.steelDk} metalness={0.55} roughness={0.45} />
        </mesh>
        {/* skirt */}
        <mesh position={[0, -0.5, 0]}>
          <cylinderGeometry args={[0.7, 0.85, 0.6, 28]} />
          <meshStandardMaterial color={C.steelDk} metalness={0.45} roughness={0.6} />
        </mesh>
        {/* feed nozzle top */}
        <mesh position={[0, 3.0, 0]}>
          <cylinderGeometry args={[0.16, 0.16, 0.5, 16]} />
          <meshStandardMaterial color={C.copper} metalness={0.7} roughness={0.4} />
        </mesh>
        {/* outlet nozzle bottom */}
        <mesh position={[0, -0.1, 0]}>
          <cylinderGeometry args={[0.16, 0.16, 0.5, 16]} />
          <meshStandardMaterial color={C.copper} metalness={0.7} roughness={0.4} />
        </mesh>
        {/* hand-holes / catalyst access */}
        <mesh position={[0.85, 1.4, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.18, 0.18, 0.15, 16]} />
          <meshStandardMaterial color={C.copper} metalness={0.7} roughness={0.4} />
        </mesh>
      </group>
      <NameLabel y={3.6} text={`${label} · FIXED BED · catalyst Co-Mo`} />
    </StandardCanvas>
  )
}

/* ─── 6 · Horizontal knock-out drum ───────────────────────────────── */
export function KODrumModel({ label = 'KO-DRUM-301' }: { label?: string }) {
  return (
    <StandardCanvas cameraPos={[5, 3, 6]} fov={40}>
      <Floor />
      <group position={[0, 0.3, 0]} rotation={[0, 0, Math.PI / 2]}>
        <mesh>
          <cylinderGeometry args={[0.7, 0.7, 3.0, 32]} />
          <meshStandardMaterial color={C.steel} metalness={0.55} roughness={0.45} />
        </mesh>
        {/* dished heads */}
        <mesh position={[0, 1.5, 0]}>
          <sphereGeometry args={[0.7, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color={C.steelDk} metalness={0.55} roughness={0.45} />
        </mesh>
        <mesh position={[0, -1.5, 0]}>
          <sphereGeometry args={[0.7, 24, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
          <meshStandardMaterial color={C.steelDk} metalness={0.55} roughness={0.45} />
        </mesh>
        {/* inlet (top) */}
        <mesh position={[0, 0, 0.8]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.16, 0.16, 0.5, 16]} />
          <meshStandardMaterial color={C.copper} metalness={0.7} roughness={0.4} />
        </mesh>
        {/* gas outlet (top end) */}
        <mesh position={[1.2, 0, 0.5]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.12, 0.12, 0.4, 16]} />
          <meshStandardMaterial color={C.copper} metalness={0.7} roughness={0.4} />
        </mesh>
        {/* liquid outlet (bottom end) */}
        <mesh position={[-1.2, 0, -0.5]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.12, 0.12, 0.4, 16]} />
          <meshStandardMaterial color={C.copper} metalness={0.7} roughness={0.4} />
        </mesh>
      </group>
      {/* saddles */}
      <mesh position={[-1.0, -0.6, 0]}>
        <boxGeometry args={[0.4, 0.5, 1.0]} />
        <meshStandardMaterial color={C.steelDk} metalness={0.5} roughness={0.55} />
      </mesh>
      <mesh position={[1.0, -0.6, 0]}>
        <boxGeometry args={[0.4, 0.5, 1.0]} />
        <meshStandardMaterial color={C.steelDk} metalness={0.5} roughness={0.55} />
      </mesh>
      <NameLabel y={1.6} text={`${label} · 3-PHASE · 360 psig`} />
    </StandardCanvas>
  )
}

/* ─── 7 · Centrifugal compressor ──────────────────────────────────── */
function CompressorInternals() {
  const rotor = useRef<THREE.Group>(null)
  useFrame((state) => {
    if (rotor.current) rotor.current.rotation.x = state.clock.elapsedTime * 12
  })
  return (
    <>
      {/* baseplate */}
      <mesh position={[0, -1.4, 0]}>
        <boxGeometry args={[4.0, 0.15, 1.6]} />
        <meshStandardMaterial color="#1c2a3e" metalness={0.5} roughness={0.55} />
      </mesh>
      {/* gas turbine driver (left) */}
      <group position={[-1.2, -0.3, 0]} rotation={[0, 0, Math.PI / 2]}>
        <mesh>
          <cylinderGeometry args={[0.45, 0.45, 1.4, 28]} />
          <meshStandardMaterial color={C.steelDk} metalness={0.55} roughness={0.5} />
        </mesh>
        {/* exhaust stack */}
        <mesh position={[0, 0.85, 0]}>
          <cylinderGeometry args={[0.18, 0.32, 0.4, 16]} />
          <meshStandardMaterial color={C.steel} metalness={0.5} roughness={0.55} />
        </mesh>
      </group>
      {/* compressor body */}
      <group position={[0.6, -0.3, 0]} rotation={[0, 0, Math.PI / 2]}>
        <mesh>
          <cylinderGeometry args={[0.55, 0.55, 1.8, 28]} />
          <meshStandardMaterial color={C.steel} metalness={0.6} roughness={0.45} />
        </mesh>
        {/* impeller hub through cover */}
        <group ref={rotor}>
          <mesh>
            <cylinderGeometry args={[0.2, 0.2, 0.06, 16]} />
            <meshStandardMaterial color={C.amber} metalness={0.8} roughness={0.3} emissive={C.amber} emissiveIntensity={0.3} />
          </mesh>
        </group>
        {/* suction nozzle */}
        <mesh position={[0, -0.4, 0.7]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.18, 0.18, 0.5, 16]} />
          <meshStandardMaterial color={C.copper} metalness={0.7} roughness={0.4} />
        </mesh>
        {/* discharge */}
        <mesh position={[0, 0.4, 0]}>
          <cylinderGeometry args={[0.16, 0.16, 0.8, 16]} />
          <meshStandardMaterial color={C.copper} metalness={0.7} roughness={0.4} />
        </mesh>
      </group>
    </>
  )
}
export function CompressorModel({ label = 'COMP-301' }: { label?: string }) {
  return (
    <StandardCanvas cameraPos={[5, 3.5, 6]} fov={40}>
      <Floor />
      <CompressorInternals />
      <NameLabel y={1.4} text={`${label} · WET GAS · 12 MW`} />
    </StandardCanvas>
  )
}

/* ─── 8 · Induced-draft cooling tower ─────────────────────────────── */
function CoolingTowerInternals() {
  const fan = useRef<THREE.Group>(null)
  useFrame((state) => {
    if (fan.current) fan.current.rotation.y = state.clock.elapsedTime * 4
  })
  return (
    <group position={[0, -1.2, 0]}>
      {/* basin */}
      <mesh position={[0, 0.15, 0]}>
        <boxGeometry args={[2.6, 0.3, 2.6]} />
        <meshStandardMaterial color={C.steelDk} metalness={0.4} roughness={0.65} />
      </mesh>
      {/* fill / louvered body */}
      <mesh position={[0, 1.3, 0]}>
        <boxGeometry args={[2.4, 2.0, 2.4]} />
        <meshStandardMaterial color={C.steel} metalness={0.4} roughness={0.55} />
      </mesh>
      {/* louvers */}
      {Array.from({ length: 6 }).map((_, i) => (
        <mesh key={i} position={[1.21, 0.5 + i * 0.32, 0]}>
          <boxGeometry args={[0.05, 0.06, 2.2]} />
          <meshStandardMaterial color={C.steelDk} metalness={0.5} roughness={0.6} />
        </mesh>
      ))}
      {/* fan cylinder */}
      <mesh position={[0, 2.5, 0]}>
        <cylinderGeometry args={[1.0, 1.0, 0.4, 28]} />
        <meshStandardMaterial color={C.steelDk} metalness={0.5} roughness={0.5} />
      </mesh>
      {/* fan blades */}
      <group ref={fan} position={[0, 2.55, 0]}>
        {Array.from({ length: 4 }).map((_, i) => {
          const a = (i / 4) * Math.PI * 2
          return (
            <mesh key={i} position={[Math.cos(a) * 0.45, 0, Math.sin(a) * 0.45]} rotation={[0, a, 0.18]}>
              <boxGeometry args={[0.9, 0.04, 0.18]} />
              <meshStandardMaterial color={C.copper} metalness={0.7} roughness={0.4} />
            </mesh>
          )
        })}
        <mesh>
          <cylinderGeometry args={[0.18, 0.18, 0.18, 16]} />
          <meshStandardMaterial color={C.amber} metalness={0.7} roughness={0.4} />
        </mesh>
      </group>
    </group>
  )
}
export function CoolingTowerModel({ label = 'CT-901' }: { label?: string }) {
  return (
    <StandardCanvas cameraPos={[5, 3.5, 6]} fov={38}>
      <Floor />
      <CoolingTowerInternals />
      <NameLabel y={2.0} text={`${label} · INDUCED-DRAFT · 1.4 MW heat`} />
    </StandardCanvas>
  )
}

/* ─── 9 · Ground flare with elevated tip ──────────────────────────── */
function FlareInternals() {
  const flame = useRef<THREE.Mesh>(null)
  useFrame((state) => {
    if (flame.current) {
      const t = state.clock.elapsedTime
      flame.current.scale.y = 1 + Math.sin(t * 7) * 0.25 + Math.random() * 0.1
      const m = flame.current.material as THREE.MeshStandardMaterial
      m.emissiveIntensity = 1.6 + Math.sin(t * 5) * 0.5
    }
  })
  return (
    <group position={[0, -1.4, 0]}>
      {/* stack */}
      <mesh position={[0, 2.0, 0]}>
        <cylinderGeometry args={[0.18, 0.22, 4.0, 24]} />
        <meshStandardMaterial color={C.steelDk} metalness={0.5} roughness={0.55} />
      </mesh>
      {/* tip */}
      <mesh position={[0, 4.05, 0]}>
        <cylinderGeometry args={[0.28, 0.18, 0.4, 16]} />
        <meshStandardMaterial color={C.steel} metalness={0.5} roughness={0.5} />
      </mesh>
      {/* flame */}
      <mesh ref={flame} position={[0, 4.7, 0]}>
        <coneGeometry args={[0.42, 1.4, 16]} />
        <meshStandardMaterial color={C.flare} emissive={C.flare} emissiveIntensity={1.8} transparent opacity={0.92} />
      </mesh>
      {/* guy wires (3) */}
      {[0, Math.PI * 2 / 3, Math.PI * 4 / 3].map((a, i) => (
        <mesh
          key={i}
          position={[Math.cos(a) * 1.5, 1.0, Math.sin(a) * 1.5]}
          rotation={[0, -a, Math.PI / 3]}
        >
          <cylinderGeometry args={[0.012, 0.012, 4.4, 4]} />
          <meshStandardMaterial color={C.steelDk} metalness={0.6} roughness={0.5} />
        </mesh>
      ))}
    </group>
  )
}
export function FlareModel({ label = 'FLR-1' }: { label?: string }) {
  return (
    <StandardCanvas cameraPos={[5, 4, 6]} fov={36}>
      <Floor />
      <FlareInternals />
      <NameLabel y={5.6} text={`${label} · ELEVATED FLARE · 200 ft`} />
    </StandardCanvas>
  )
}

/* ─── 10 · Amine treater (absorber + regenerator pair) ─────────────── */
export function AmineTreaterModel({ label = 'AMINE-401' }: { label?: string }) {
  return (
    <StandardCanvas cameraPos={[6, 3.5, 6]} fov={40}>
      <Floor />
      {/* Absorber (taller, left) */}
      <group position={[-1.2, -1.2, 0]}>
        <mesh position={[0, 1.8, 0]}>
          <cylinderGeometry args={[0.5, 0.5, 3.4, 28]} />
          <meshStandardMaterial color={C.steel} metalness={0.55} roughness={0.45} />
        </mesh>
        {Array.from({ length: 12 }).map((_, i) => (
          <mesh key={i} position={[0, 0.4 + i * 0.26, 0]}>
            <torusGeometry args={[0.5, 0.012, 4, 24]} />
            <meshStandardMaterial color={C.copper} metalness={0.6} roughness={0.5} />
          </mesh>
        ))}
        <mesh position={[0, 3.6, 0]}>
          <sphereGeometry args={[0.5, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color={C.steelDk} metalness={0.55} roughness={0.5} />
        </mesh>
      </group>
      {/* Regenerator (right) */}
      <group position={[1.2, -1.2, 0]}>
        <mesh position={[0, 1.4, 0]}>
          <cylinderGeometry args={[0.55, 0.55, 2.6, 28]} />
          <meshStandardMaterial color={C.steel} metalness={0.55} roughness={0.45} />
        </mesh>
        {Array.from({ length: 8 }).map((_, i) => (
          <mesh key={i} position={[0, 0.4 + i * 0.28, 0]}>
            <torusGeometry args={[0.55, 0.012, 4, 24]} />
            <meshStandardMaterial color={C.copper} metalness={0.6} roughness={0.5} />
          </mesh>
        ))}
        <mesh position={[0, 2.85, 0]}>
          <sphereGeometry args={[0.55, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color={C.steelDk} metalness={0.55} roughness={0.5} />
        </mesh>
      </group>
      {/* cross-piping */}
      <mesh position={[0, 0.4, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.1, 0.1, 2.4, 16]} />
        <meshStandardMaterial color={C.copper} metalness={0.7} roughness={0.4} />
      </mesh>
      <NameLabel y={3.6} text={`${label} · ABSORBER + REGENERATOR`} />
    </StandardCanvas>
  )
}

/* ─── 11 · LPG storage sphere on legs ─────────────────────────────── */
export function LpgSphereModel({ label = 'SPH-LPG-01' }: { label?: string }) {
  return (
    <StandardCanvas cameraPos={[5, 3.5, 6]} fov={38}>
      <Floor />
      <group position={[0, 0.2, 0]}>
        <mesh>
          <sphereGeometry args={[1.3, 32, 24]} />
          <meshStandardMaterial color={C.steel} metalness={0.55} roughness={0.4} />
        </mesh>
        {/* welded segment rings */}
        {[-Math.PI / 4, 0, Math.PI / 4].map((tilt, i) => (
          <mesh key={i} rotation={[tilt, 0, 0]}>
            <torusGeometry args={[1.3, 0.012, 4, 32]} />
            <meshStandardMaterial color={C.steelDk} metalness={0.5} roughness={0.5} />
          </mesh>
        ))}
        {/* nozzle on top */}
        <mesh position={[0, 1.35, 0]}>
          <cylinderGeometry args={[0.14, 0.14, 0.32, 16]} />
          <meshStandardMaterial color={C.copper} metalness={0.7} roughness={0.4} />
        </mesh>
        {/* PSV stack */}
        <mesh position={[0.0, 1.65, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 0.4, 12]} />
          <meshStandardMaterial color={C.alarm} metalness={0.5} roughness={0.5} />
        </mesh>
        {/* legs (6) */}
        {Array.from({ length: 6 }).map((_, i) => {
          const a = (i / 6) * Math.PI * 2
          return (
            <mesh
              key={i}
              position={[Math.cos(a) * 0.95, -1.05, Math.sin(a) * 0.95]}
              rotation={[0, 0, Math.PI * 0.07 * Math.cos(a)]}
            >
              <cylinderGeometry args={[0.07, 0.1, 1.6, 12]} />
              <meshStandardMaterial color={C.steelDk} metalness={0.5} roughness={0.55} />
            </mesh>
          )
        })}
      </group>
      <NameLabel y={2.0} text={`${label} · LPG SPHERE · 25,000 m³`} />
    </StandardCanvas>
  )
}

/* ─── 12 · Globe-style control valve with diaphragm actuator ──────── */
export function ControlValveModel({ label = 'FV-101' }: { label?: string }) {
  return (
    <StandardCanvas cameraPos={[4, 3, 5]} fov={40}>
      <Floor />
      <group position={[0, 0, 0]}>
        {/* valve body */}
        <mesh>
          <sphereGeometry args={[0.45, 24, 16]} />
          <meshStandardMaterial color={C.steel} metalness={0.55} roughness={0.45} />
        </mesh>
        {/* end connections */}
        <mesh position={[-0.7, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.2, 0.2, 0.6, 24]} />
          <meshStandardMaterial color={C.steel} metalness={0.55} roughness={0.45} />
        </mesh>
        <mesh position={[0.7, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.2, 0.2, 0.6, 24]} />
          <meshStandardMaterial color={C.steel} metalness={0.55} roughness={0.45} />
        </mesh>
        {/* flanges */}
        {[-1.0, 1.0].map((x, i) => (
          <mesh key={i} position={[x, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.32, 0.32, 0.1, 24]} />
            <meshStandardMaterial color={C.steelDk} metalness={0.6} roughness={0.45} />
          </mesh>
        ))}
        {/* yoke */}
        <mesh position={[0, 0.55, 0]}>
          <boxGeometry args={[0.12, 0.5, 0.12]} />
          <meshStandardMaterial color={C.steelDk} metalness={0.5} roughness={0.55} />
        </mesh>
        {/* diaphragm housing */}
        <mesh position={[0, 1.05, 0]}>
          <cylinderGeometry args={[0.42, 0.42, 0.32, 28]} />
          <meshStandardMaterial color={C.signal} metalness={0.5} roughness={0.55} />
        </mesh>
        {/* positioner box */}
        <mesh position={[0.42, 0.9, 0.3]}>
          <boxGeometry args={[0.22, 0.3, 0.2]} />
          <meshStandardMaterial color="#1c2a3e" metalness={0.45} roughness={0.6} />
        </mesh>
        {/* instrument air tubing */}
        <mesh position={[0.55, 0.6, 0.15]} rotation={[0, 0, Math.PI / 3]}>
          <cylinderGeometry args={[0.018, 0.018, 0.6, 8]} />
          <meshStandardMaterial color={C.copper} metalness={0.85} roughness={0.25} />
        </mesh>
      </group>
      <NameLabel y={1.7} text={`${label} · GLOBE · diaphragm actuator`} />
    </StandardCanvas>
  )
}
