import { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Text, Edges } from '@react-three/drei'
import * as THREE from 'three'
import { useStreamStore } from '@/store/streamStore'

/**
 * PUMP-401 · API-610 OH2 horizontal end-suction centrifugal charge pump.
 *
 * Layout (X = horizontal along shaft, Y = vertical, Z = axial depth):
 *
 *      [ MOTOR ]──coupling──[ BEARING HSG ]──[ STUFFING BOX ]──[ VOLUTE ]──suction nozzle (forward, +Z)
 *           │ TEFC frame                       │ mech seal
 *           │ junction box                     │ gland piping
 *           └── all bolted to common steel baseplate on grout pad
 *
 * The model is built from a parametric set of cylinders / boxes / torus so it
 * reads as an actual API-610 pump from any angle — not the abstract
 * volute-on-pad of the original placeholder.
 */

const COLOR = {
  fog:        '#080e18',
  snow:       '#1ea7ff',
  cyan:       '#4ee2f4',
  amber:      '#ffb627',
  signal:     '#34d57b',
  alarm:      '#ef4444',
  copper:     '#c79a4a',
  flare:      '#ff6b35',
  // body / casting tones
  motorBody:  '#4a5d80',
  motorFin:   '#2a3954',
  baseplate:  '#1c2a3e',
  grout:      '#5a4838',
  pumpCasing: '#4a5d80',
  pumpDark:   '#2a3954',
  shaftSteel: '#c8d4e6',
  pipeSteel:  '#6d7d95',
  flangeRing: '#586984',
  gauge:      '#e8edf5',
  nameplate:  '#c79a4a',
  edge:       '#0a1220',
} as const

function severity(vib: number): 'OK' | 'WARN' | 'ALARM' {
  if (vib >= 6) return 'ALARM'
  if (vib >= 4.5) return 'WARN'
  return 'OK'
}
function severityColor(sev: 'OK' | 'WARN' | 'ALARM'): string {
  if (sev === 'ALARM') return COLOR.alarm
  if (sev === 'WARN') return COLOR.amber
  return COLOR.signal
}

/* ────────────────────── HELPER PIECES ────────────────────── */

/** Bolt pattern for a flange / motor face. */
function BoltCircle({
  radius,
  count = 8,
  size = 0.05,
  z = 0,
}: {
  radius: number
  count?: number
  size?: number
  z?: number
}) {
  const bolts = []
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2
    bolts.push(
      <mesh key={i} position={[Math.cos(a) * radius, Math.sin(a) * radius, z]}>
        <cylinderGeometry args={[size, size, 0.04, 8]} />
        <meshStandardMaterial color="#101824" metalness={0.6} roughness={0.55} />
      </mesh>,
    )
  }
  return <group rotation={[Math.PI / 2, 0, 0]}>{bolts}</group>
}

/** RF flange (raised-face): hub + raised face + bolt circle. */
function Flange({
  od,
  hub,
  thick = 0.15,
  bolts = 8,
}: {
  od: number
  hub: number
  thick?: number
  bolts?: number
}) {
  return (
    <group>
      {/* hub face */}
      <mesh>
        <cylinderGeometry args={[od, od, thick, 36]} />
        <meshStandardMaterial color={COLOR.flangeRing} metalness={0.78} roughness={0.32} />
      </mesh>
      {/* raised face */}
      <mesh position={[0, thick / 2 + 0.015, 0]}>
        <cylinderGeometry args={[hub * 1.6, hub * 1.6, 0.03, 36]} />
        <meshStandardMaterial color={COLOR.pumpDark} metalness={0.7} roughness={0.42} />
      </mesh>
      <BoltCircle radius={od * 0.78} count={bolts} size={0.045} z={thick / 2 + 0.005} />
    </group>
  )
}

/** Pressure gauge — round face with needle (cosmetic). */
function PressureGauge({ readingDeg = 35 }: { readingDeg?: number }) {
  return (
    <group>
      <mesh>
        <cylinderGeometry args={[0.16, 0.16, 0.08, 24]} />
        <meshStandardMaterial color={COLOR.shaftSteel} metalness={0.7} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.045, 0]}>
        <cylinderGeometry args={[0.14, 0.14, 0.01, 24]} />
        <meshStandardMaterial color={COLOR.gauge} metalness={0.05} roughness={0.7} />
      </mesh>
      {/* needle */}
      <mesh
        position={[0, 0.052, 0]}
        rotation={[0, THREE.MathUtils.degToRad(-readingDeg), 0]}
      >
        <boxGeometry args={[0.11, 0.005, 0.012]} />
        <meshStandardMaterial color={COLOR.flare} emissive={COLOR.flare} emissiveIntensity={0.4} />
      </mesh>
    </group>
  )
}

/* ────────────────────── SUB-ASSEMBLIES ────────────────────── */

/** TEFC motor frame: cylinder body + cooling fins + cooling fan cowl + terminal box. */
function MotorAssembly({ length = 2.2, radius = 0.78 }: { length?: number; radius?: number }) {
  // Place along +X so motor sits to the LEFT (negative X) of the pump in the parent.
  return (
    <group rotation={[0, 0, Math.PI / 2]}>
      {/* body */}
      <mesh>
        <cylinderGeometry args={[radius, radius, length, 36]} />
        <meshStandardMaterial color={COLOR.motorBody} metalness={0.55} roughness={0.5} />
      </mesh>
      {/* cooling fins — rings along the body */}
      {Array.from({ length: 10 }).map((_, i) => {
        const y = -length / 2 + 0.18 + (i * (length - 0.36)) / 9
        return (
          <mesh key={i} position={[0, y, 0]}>
            <cylinderGeometry args={[radius * 1.05, radius * 1.05, 0.03, 36]} />
            <meshStandardMaterial color={COLOR.motorFin} metalness={0.6} roughness={0.45} />
          </mesh>
        )
      })}
      {/* end bells */}
      <mesh position={[0,  length / 2 + 0.06, 0]}>
        <cylinderGeometry args={[radius * 0.95, radius * 0.78, 0.18, 36]} />
        <meshStandardMaterial color={COLOR.motorBody} metalness={0.6} roughness={0.45} />
      </mesh>
      <mesh position={[0, -length / 2 - 0.06, 0]}>
        <cylinderGeometry args={[radius * 0.78, radius * 0.95, 0.18, 36]} />
        <meshStandardMaterial color={COLOR.motorBody} metalness={0.6} roughness={0.45} />
      </mesh>
      {/* fan cowl (drive-end opposite, so + side) */}
      <group position={[0, -length / 2 - 0.32, 0]}>
        <mesh>
          <cylinderGeometry args={[radius * 0.62, radius * 0.62, 0.36, 28]} />
          <meshStandardMaterial color={COLOR.motorFin} metalness={0.5} roughness={0.6} />
        </mesh>
        {/* radial slots */}
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i / 12) * Math.PI * 2
          return (
            <mesh
              key={i}
              position={[Math.cos(a) * radius * 0.62, 0, Math.sin(a) * radius * 0.62]}
              rotation={[0, a, 0]}
            >
              <boxGeometry args={[0.02, 0.3, 0.06]} />
              <meshStandardMaterial color="#0a0f18" />
            </mesh>
          )
        })}
      </group>
      {/* terminal box (junction box) on top */}
      <group position={[radius + 0.18, 0, 0]}>
        <mesh>
          <boxGeometry args={[0.36, 0.5, 0.5]} />
          <meshStandardMaterial color={COLOR.motorFin} metalness={0.55} roughness={0.55} />
        </mesh>
        <mesh position={[0.0, 0, 0.26]}>
          <boxGeometry args={[0.34, 0.48, 0.02]} />
          <meshStandardMaterial color="#1c2a3e" metalness={0.45} roughness={0.6} />
        </mesh>
      </group>
      {/* nameplate */}
      <mesh position={[radius * 0.7, length * 0.18, radius * 0.55]} rotation={[0, 0.0, 0]}>
        <boxGeometry args={[0.06, 0.24, 0.36]} />
        <meshStandardMaterial color={COLOR.nameplate} metalness={0.6} roughness={0.4} />
      </mesh>
      {/* feet to baseplate */}
      <mesh position={[0, -length / 2 + 0.05, -radius * 0.95]}>
        <boxGeometry args={[0.7, 0.2, 0.4]} />
        <meshStandardMaterial color={COLOR.motorFin} metalness={0.5} roughness={0.6} />
      </mesh>
      <mesh position={[0,  length / 2 - 0.05, -radius * 0.95]}>
        <boxGeometry args={[0.7, 0.2, 0.4]} />
        <meshStandardMaterial color={COLOR.motorFin} metalness={0.5} roughness={0.6} />
      </mesh>
    </group>
  )
}

/** Coupling guard between motor and pump — slotted cover. */
function CouplingGuard() {
  return (
    <group>
      <mesh>
        <cylinderGeometry args={[0.32, 0.32, 0.55, 24]} />
        <meshStandardMaterial color={COLOR.amber} metalness={0.55} roughness={0.45} />
      </mesh>
      {/* expanded-metal slots */}
      {Array.from({ length: 8 }).map((_, i) => {
        const a = (i / 8) * Math.PI * 2
        return (
          <mesh key={i} position={[Math.cos(a) * 0.31, 0, Math.sin(a) * 0.31]} rotation={[0, a, 0]}>
            <boxGeometry args={[0.005, 0.42, 0.06]} />
            <meshStandardMaterial color="#1a1408" />
          </mesh>
        )
      })}
    </group>
  )
}

/** Bearing housing — frame between coupling and stuffing box. */
function BearingHousing() {
  return (
    <group>
      {/* housing body */}
      <mesh>
        <cylinderGeometry args={[0.42, 0.5, 0.95, 32]} />
        <meshStandardMaterial color={COLOR.pumpCasing} metalness={0.65} roughness={0.4} />
      </mesh>
      {/* oil-level sight glass */}
      <mesh position={[0.42, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.07, 0.07, 0.03, 16]} />
        <meshStandardMaterial color={COLOR.amber} emissive={COLOR.amber} emissiveIntensity={0.5} transparent opacity={0.85} />
      </mesh>
      {/* lube oil reservoir top */}
      <mesh position={[0, 0.05, 0.46]}>
        <boxGeometry args={[0.32, 0.6, 0.18]} />
        <meshStandardMaterial color={COLOR.pumpDark} metalness={0.6} roughness={0.5} />
      </mesh>
    </group>
  )
}

/** Stuffing box / mechanical seal section. */
function StuffingBox() {
  return (
    <group>
      <mesh>
        <cylinderGeometry args={[0.38, 0.42, 0.32, 28]} />
        <meshStandardMaterial color={COLOR.pumpDark} metalness={0.7} roughness={0.4} />
      </mesh>
      {/* gland follower */}
      <mesh position={[0, 0.21, 0]}>
        <cylinderGeometry args={[0.45, 0.42, 0.08, 28]} />
        <meshStandardMaterial color={COLOR.copper} metalness={0.85} roughness={0.25} />
      </mesh>
      {/* gland bolts */}
      <BoltCircle radius={0.38} count={4} size={0.035} z={0.21} />
    </group>
  )
}

/** Volute casing — toroidal sweeping spiral with discharge throat. */
function Volute({ sevColor }: { sevColor: string }) {
  return (
    <group>
      {/* main toroidal body */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.62, 0.36, 22, 48]} />
        <meshStandardMaterial color={COLOR.pumpCasing} metalness={0.7} roughness={0.42} emissive={sevColor} emissiveIntensity={0.04} />
      </mesh>
      {/* spiral fill — slightly larger ring offset */}
      <mesh position={[0.08, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.66, 0.34, 22, 48, Math.PI * 1.5]} />
        <meshStandardMaterial color={COLOR.pumpDark} metalness={0.68} roughness={0.45} />
      </mesh>
      {/* front cover plate */}
      <mesh position={[0, 0, 0.42]}>
        <cylinderGeometry args={[0.95, 0.95, 0.08, 36]} />
        <meshStandardMaterial color={COLOR.pumpCasing} metalness={0.7} roughness={0.4} />
      </mesh>
      <BoltCircle radius={0.86} count={12} z={0.46} />
      {/* casting ribs */}
      {Array.from({ length: 4 }).map((_, i) => {
        const a = (i / 4) * Math.PI * 2
        return (
          <mesh
            key={i}
            position={[Math.cos(a) * 0.86, Math.sin(a) * 0.86, 0]}
            rotation={[0, 0, a]}
          >
            <boxGeometry args={[0.04, 0.12, 0.42]} />
            <meshStandardMaterial color={COLOR.pumpDark} metalness={0.65} roughness={0.45} />
          </mesh>
        )
      })}
    </group>
  )
}

/* ────────────────────── ASSEMBLY ────────────────────── */

function PumpAssembly() {
  const rootRef       = useRef<THREE.Group>(null)
  const impellerRef   = useRef<THREE.Group>(null)
  const motorBodyRef  = useRef<THREE.Group>(null)
  const haloRef       = useRef<THREE.Mesh>(null)
  const dischargeRef  = useRef<THREE.Mesh>(null)

  const vibArr = useStreamStore(s => s.streams['PUMP-401:vibration'] || [])
  const vib = vibArr[vibArr.length - 1]?.value ?? 4.8
  const sev = severity(vib)
  const sevColor = severityColor(sev)

  // Discharge throat is vertical (up). Suction is horizontal forward (+Z).
  // Motor sits behind pump (-X). Everything mounted on common baseplate (Y = -1.4).
  const motorCenterX  = -2.4
  const couplingX     = -1.15
  const bearingX      = -0.55
  const stuffingX     = -0.04
  const voluteX       =  0.45

  useFrame((state) => {
    const t = state.clock.elapsedTime

    if (impellerRef.current) {
      // 1740 RPM ≈ 182 rad/s; scaled for visibility, modulated by vibration
      impellerRef.current.rotation.x = t * (8 + vib * 0.6)
    }
    if (motorBodyRef.current) {
      // Tiny axial wobble in alarm only
      const j = vib > 5 ? (vib - 5) * 0.008 : 0
      motorBodyRef.current.position.y = Math.sin(t * 32) * j
    }
    if (rootRef.current && vib > 5) {
      const j = (vib - 5) * 0.012
      rootRef.current.position.y = -1.0 + Math.sin(t * 30) * j * 0.4
    } else if (rootRef.current) {
      rootRef.current.position.y = -1.0
    }
    if (haloRef.current) {
      const pulse = 0.9 + 0.22 * Math.sin(t * (sev === 'ALARM' ? 6 : sev === 'WARN' ? 3 : 1.6))
      haloRef.current.scale.set(pulse, pulse, pulse)
      const m = haloRef.current.material as THREE.MeshStandardMaterial
      m.color.set(sevColor)
      m.emissive.set(sevColor)
      m.emissiveIntensity = 0.42 + 0.35 * Math.sin(t * 2.4)
    }
    if (dischargeRef.current) {
      const m = dischargeRef.current.material as THREE.MeshStandardMaterial
      m.color.set(sev === 'ALARM' ? '#5a1d1d' : sev === 'WARN' ? '#4a3614' : COLOR.pipeSteel)
    }
  })

  // Precompute foundation pad mesh
  const foundation = useMemo(
    () => (
      <group position={[-0.6, -1.55, 0]}>
        {/* concrete pad */}
        <mesh>
          <boxGeometry args={[4.6, 0.32, 2.1]} />
          <meshStandardMaterial color={COLOR.grout} roughness={0.95} metalness={0.05} />
        </mesh>
        {/* steel baseplate */}
        <mesh position={[0, 0.21, 0]}>
          <boxGeometry args={[4.4, 0.12, 1.9]} />
          <meshStandardMaterial color={COLOR.baseplate} metalness={0.45} roughness={0.55} />
          <Edges color={COLOR.edge} threshold={20} />
        </mesh>
        {/* baseplate channel ribs */}
        {[-1.6, -0.8, 0, 0.8, 1.6].map((x) => (
          <mesh key={x} position={[x, 0.27, 0]}>
            <boxGeometry args={[0.06, 0.06, 1.9]} />
            <meshStandardMaterial color={COLOR.motorFin} metalness={0.4} roughness={0.65} />
          </mesh>
        ))}
        {/* drip lip / drain pan tab */}
        <mesh position={[2.05, 0.12, 0]}>
          <boxGeometry args={[0.18, 0.08, 1.6]} />
          <meshStandardMaterial color={COLOR.motorFin} metalness={0.3} roughness={0.7} />
        </mesh>
      </group>
    ),
    [],
  )

  return (
    <group ref={rootRef}>
      {foundation}

      {/* ─── Motor ─── */}
      <group ref={motorBodyRef} position={[motorCenterX, 0.05, 0]}>
        <MotorAssembly length={2.2} radius={0.78} />
      </group>

      {/* ─── Coupling guard ─── */}
      <group position={[couplingX, 0.05, 0]} rotation={[0, 0, Math.PI / 2]}>
        <CouplingGuard />
      </group>

      {/* ─── Shaft (visible inside guard at runtime, through cutouts) ─── */}
      <mesh position={[couplingX, 0.05, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.085, 0.085, 0.6, 16]} />
        <meshStandardMaterial color={COLOR.shaftSteel} metalness={0.85} roughness={0.25} />
      </mesh>

      {/* ─── Bearing housing ─── */}
      <group position={[bearingX, 0.05, 0]} rotation={[0, 0, Math.PI / 2]}>
        <BearingHousing />
      </group>

      {/* ─── Stuffing box / seal ─── */}
      <group position={[stuffingX, 0.05, 0]} rotation={[0, 0, Math.PI / 2]}>
        <StuffingBox />
      </group>

      {/* ─── Volute ─── */}
      <group position={[voluteX, 0.05, 0]}>
        <Volute sevColor={sevColor} />
        {/* spinning impeller hub visible through the front cover */}
        <group ref={impellerRef} position={[0, 0, 0.46]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.2, 0.2, 0.06, 16]} />
            <meshStandardMaterial color={COLOR.amber} emissive={COLOR.amber} emissiveIntensity={0.35} metalness={0.8} roughness={0.3} />
          </mesh>
        </group>
        {/* halo */}
        <mesh ref={haloRef} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.25, 0.025, 8, 56]} />
          <meshStandardMaterial color={sevColor} emissive={sevColor} emissiveIntensity={0.6} transparent opacity={0.7} />
        </mesh>
      </group>

      {/* ─── Suction nozzle (forward, +Z) ─── */}
      <group position={[voluteX, 0.05, 1.15]} rotation={[Math.PI / 2, 0, 0]}>
        <mesh>
          <cylinderGeometry args={[0.32, 0.32, 1.0, 24]} />
          <meshStandardMaterial color={COLOR.pipeSteel} metalness={0.6} roughness={0.45} />
        </mesh>
        {/* suction flange at end */}
        <group position={[0, -0.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <Flange od={0.5} hub={0.32} thick={0.14} bolts={8} />
        </group>
        {/* reducer onto larger suction header */}
        <group position={[0, 0.55, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <mesh>
            <cylinderGeometry args={[0.42, 0.32, 0.4, 24]} />
            <meshStandardMaterial color={COLOR.pipeSteel} metalness={0.6} roughness={0.45} />
          </mesh>
        </group>
      </group>

      {/* ─── Discharge (top of volute, vertical up then 90° elbow) ─── */}
      <group position={[voluteX, 1.0, 0]}>
        <mesh ref={dischargeRef}>
          <cylinderGeometry args={[0.25, 0.25, 0.9, 24]} />
          <meshStandardMaterial color={COLOR.pipeSteel} metalness={0.6} roughness={0.45} />
        </mesh>
        {/* discharge flange */}
        <group position={[0, 0.5, 0]}>
          <Flange od={0.42} hub={0.25} thick={0.12} bolts={6} />
        </group>
        {/* elbow */}
        <mesh position={[0.4, 0.62, 0]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.36, 0.24, 14, 24, Math.PI / 2]} />
          <meshStandardMaterial color={COLOR.pipeSteel} metalness={0.6} roughness={0.45} />
        </mesh>
        {/* horizontal pipe leaving */}
        <mesh position={[0.96, 0.98, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.24, 0.24, 0.9, 24]} />
          <meshStandardMaterial color={COLOR.pipeSteel} metalness={0.6} roughness={0.45} />
        </mesh>
      </group>

      {/* ─── Pressure gauges on suction + discharge ─── */}
      <group position={[voluteX, 0.4, 0.6]}>
        <PressureGauge readingDeg={-40} />
      </group>
      <group position={[voluteX + 0.1, 0.95, 0.34]}>
        <PressureGauge readingDeg={sev === 'ALARM' ? 95 : sev === 'WARN' ? 75 : 55} />
      </group>

      {/* ─── Gland-cooling tubing (small tube + tee) ─── */}
      <mesh position={[stuffingX, 0.62, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.035, 0.035, 0.7, 12]} />
        <meshStandardMaterial color={COLOR.copper} metalness={0.85} roughness={0.3} />
      </mesh>
      <mesh position={[stuffingX, 0.62, 0.3]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.035, 0.035, 0.6, 12]} />
        <meshStandardMaterial color={COLOR.copper} metalness={0.85} roughness={0.3} />
      </mesh>

      {/* ─── Anchor bolts visible at corners ─── */}
      {[-2.0, -0.4, 1.4].map((x) =>
        [-0.85, 0.85].map((z) => (
          <mesh key={`${x},${z}`} position={[x, -1.38, z]}>
            <cylinderGeometry args={[0.06, 0.06, 0.18, 10]} />
            <meshStandardMaterial color="#161e2c" metalness={0.55} roughness={0.6} />
          </mesh>
        )),
      )}

      {/* ─── Tag plate ─── */}
      <group position={[bearingX, 0.85, 0]}>
        <mesh>
          <boxGeometry args={[0.55, 0.3, 0.04]} />
          <meshStandardMaterial color={COLOR.nameplate} metalness={0.6} roughness={0.4} />
        </mesh>
        <Text
          position={[0, 0, 0.025]}
          fontSize={0.13}
          color="#1a120a"
          anchorX="center"
          anchorY="middle"
        >
          PUMP-401
        </Text>
      </group>

      {/* ─── Floating labels — always rendered on top of the geometry ─── */}
      <FloatingLabel position={[motorCenterX, 2.45, 0]} color={COLOR.snow}>
        MOTOR · 250 HP · 4 kV · TEFC
      </FloatingLabel>
      <FloatingLabel position={[voluteX + 0.6, 2.45, 0]} color={sevColor}>
        {`VIB ${vib.toFixed(2)} mm/s · ${sev}`}
      </FloatingLabel>
      <FloatingLabel position={[voluteX, -2.2, 0]} color={COLOR.snow} fontSize={0.16}>
        API-610 OH2 · ANSI B73.1 · 1740 RPM
      </FloatingLabel>
    </group>
  )
}

/**
 * FloatingLabel — drei <Text> that always renders on top of the geometry
 * (depthTest = false, depthWrite = false, high renderOrder), with a
 * billboard-style faux backing plate so the text stays legible regardless
 * of camera angle.
 */
function FloatingLabel({
  position,
  color,
  fontSize = 0.22,
  children,
}: {
  position: [number, number, number]
  color: string
  fontSize?: number
  children: React.ReactNode
}) {
  return (
    <group position={position} renderOrder={999}>
      <Text
        fontSize={fontSize}
        color={color}
        anchorX="center"
        anchorY="middle"
        outlineWidth={fontSize * 0.16}
        outlineColor="#080e18"
        outlineOpacity={0.95}
        renderOrder={999}
        onUpdate={(self: THREE.Object3D) => {
          // Walk the drei text's children and set their materials to
          // depthTest=false so the text draws over any geometry behind it.
          self.traverse((child) => {
            const mesh = child as THREE.Mesh
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
        {children}
      </Text>
    </group>
  )
}

export function PumpModel() {
  return (
    <Canvas camera={{ position: [5, 3.6, 6.5], fov: 38 }} dpr={[1, 1.8]}>
      <color attach="background" args={[COLOR.fog]} />
      {/* Fog pushed much further out so the model isn't washed out at typical zoom levels */}
      <fog attach="fog" args={[COLOR.fog, 22, 70]} />

      {/* Strong ambient — every face has baseline illumination */}
      <ambientLight intensity={1.35} />
      {/* Hemisphere fill: warm-ish floodlight from above + cool reflected from below */}
      <hemisphereLight args={['#e6efff', '#1a2638', 1.0]} />

      {/* Key light: bright daylight directional from front-upper-right */}
      <directionalLight position={[8, 12, 8]} intensity={2.1} color="#ffffff" />
      {/* Warm fill from rear/left so the motor side reads */}
      <directionalLight position={[-9, 6, -6]} intensity={1.0} color={COLOR.amber} />
      {/* Cool rim from front-left to define silhouette */}
      <pointLight position={[-6, 3, 7]}  intensity={1.4} color={COLOR.cyan} distance={28} decay={2} />
      {/* Underglow so the baseplate doesn't go pitch-black */}
      <pointLight position={[0, -1, 5]}  intensity={0.9} color={COLOR.snow}  distance={18} decay={2} />
      {/* Top accent on the volute/discharge */}
      <pointLight position={[2, 6, 2]}   intensity={1.2} color="#ffffff"     distance={20} decay={2} />

      <PumpAssembly />
      <OrbitControls
        enablePan
        screenSpacePanning
        minDistance={2}
        maxDistance={40}
        minPolarAngle={0.05}
        maxPolarAngle={Math.PI - 0.05}
        target={[0, 0, 0]}
      />
    </Canvas>
  )
}
