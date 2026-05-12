import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Text } from '@react-three/drei'
import * as THREE from 'three'
import { useStreamStore } from '@/store/streamStore'

// Palette constants — keep verbatim with the SRD aesthetic.
const COLOR = {
  fog:     '#080e18',
  snow:    '#1ea7ff',
  cyan:    '#4ee2f4',
  amber:   '#ffb627',
  signal:  '#34d57b',
  alarm:   '#ef4444',
  copper:  '#c79a4a',
  flare:   '#ff6b35',
  steel:   '#4a5d80',
  steelDk: '#3a4a64',
  steelXd: '#2a3954',
} as const

interface Cut {
  name: string
  color: string
  yieldPct: number
  height: number
}

// Side-stream cuts, top → bottom (LPG light at top, RESID heavy at bottom).
const CUTS: Cut[] = [
  { name: 'LPG',     color: COLOR.cyan,   yieldPct:  4, height:  4.2 },
  { name: 'NAPHTHA', color: COLOR.amber,  yieldPct: 21, height:  2.8 },
  { name: 'JET',     color: COLOR.signal, yieldPct: 18, height:  1.2 },
  { name: 'DIESEL',  color: COLOR.copper, yieldPct: 27, height: -0.4 },
  { name: 'AGO',     color: COLOR.flare,  yieldPct: 12, height: -2.0 },
  { name: 'RESID',   color: COLOR.alarm,  yieldPct: 18, height: -3.6 },
]

const COLUMN_HEIGHT = 11
const COLUMN_RADIUS = 1.4

function CutRing({ cut }: { cut: Cut }) {
  const ringRef = useRef<THREE.Mesh>(null)
  useFrame((state) => {
    if (ringRef.current) {
      const m = ringRef.current.material as THREE.MeshStandardMaterial
      m.emissiveIntensity = 0.35 + 0.15 * Math.sin(state.clock.elapsedTime * 1.3 + cut.height)
    }
  })

  const barLength = Math.max(0.4, cut.yieldPct / 10)

  return (
    <group position={[0, cut.height, 0]}>
      {/* Glowing torus ring around column */}
      <mesh ref={ringRef}>
        <torusGeometry args={[COLUMN_RADIUS + 0.04, 0.06, 12, 48]} />
        <meshStandardMaterial
          color={cut.color}
          emissive={cut.color}
          emissiveIntensity={0.45}
          metalness={0.6}
          roughness={0.35}
        />
      </mesh>

      {/* Side takeoff pipe */}
      <mesh position={[COLUMN_RADIUS + 0.55, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.09, 0.09, 1.1, 12]} />
        <meshStandardMaterial color={COLOR.copper} metalness={0.7} roughness={0.45} />
      </mesh>

      {/* Yield bar (length scales with yield %) */}
      <mesh position={[COLUMN_RADIUS + 1.1 + barLength / 2, 0, 0]}>
        <boxGeometry args={[barLength, 0.22, 0.22]} />
        <meshStandardMaterial
          color={cut.color}
          emissive={cut.color}
          emissiveIntensity={0.25}
          metalness={0.55}
          roughness={0.4}
        />
      </mesh>

      {/* Label */}
      <Text
        position={[COLUMN_RADIUS + 1.2 + barLength, 0.42, 0]}
        fontSize={0.22}
        color={cut.color}
        anchorX="left"
        anchorY="middle"
      >
        {cut.name}  {cut.yieldPct}%
      </Text>
    </group>
  )
}

function ColumnScene() {
  const groupRef = useRef<THREE.Group>(null)
  const tempArr = useStreamStore(s => s.streams['CDU-100:temperature'] || [])
  const temp = tempArr[tempArr.length - 1]?.value ?? 358

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.06
    }
  })

  return (
    <group ref={groupRef}>
      {/* Main column body */}
      <mesh>
        <cylinderGeometry args={[COLUMN_RADIUS, COLUMN_RADIUS, COLUMN_HEIGHT, 32]} />
        <meshStandardMaterial color={COLOR.steel} metalness={0.7} roughness={0.4} />
      </mesh>

      {/* Wireframe schematic overlay */}
      <mesh>
        <cylinderGeometry args={[COLUMN_RADIUS + 0.01, COLUMN_RADIUS + 0.01, COLUMN_HEIGHT, 24, 18]} />
        <meshBasicMaterial color={COLOR.cyan} wireframe transparent opacity={0.18} />
      </mesh>

      {/* Top dome */}
      <mesh position={[0, COLUMN_HEIGHT / 2, 0]}>
        <sphereGeometry args={[COLUMN_RADIUS, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={COLOR.steel} metalness={0.7} roughness={0.4} />
      </mesh>

      {/* Top vapor stack */}
      <mesh position={[0, COLUMN_HEIGHT / 2 + 0.6, 0]}>
        <cylinderGeometry args={[0.25, 0.25, 1.0, 16]} />
        <meshStandardMaterial color={COLOR.copper} metalness={0.7} roughness={0.45} />
      </mesh>

      {/* Bottom inlet pipe (crude feed) */}
      <mesh position={[-COLUMN_RADIUS - 0.7, -COLUMN_HEIGHT / 2 + 0.6, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.18, 0.18, 1.8, 14]} />
        <meshStandardMaterial
          color={COLOR.copper}
          emissive={COLOR.flare}
          emissiveIntensity={0.18}
          metalness={0.7}
          roughness={0.45}
        />
      </mesh>

      {/* Base skirt */}
      <mesh position={[0, -COLUMN_HEIGHT / 2 - 0.3, 0]}>
        <cylinderGeometry args={[COLUMN_RADIUS + 0.25, COLUMN_RADIUS + 0.35, 0.5, 24]} />
        <meshStandardMaterial color={COLOR.steelDk} metalness={0.6} roughness={0.5} />
      </mesh>

      {/* Side-stream cuts */}
      {CUTS.map(c => <CutRing key={c.name} cut={c} />)}

      {/* Header label */}
      <Text
        position={[0, COLUMN_HEIGHT / 2 + 2.0, 0]}
        fontSize={0.42}
        color={COLOR.snow}
        anchorX="center"
        anchorY="middle"
      >
        CDU-100
      </Text>
      <Text
        position={[0, COLUMN_HEIGHT / 2 + 1.5, 0]}
        fontSize={0.22}
        color={COLOR.amber}
        anchorX="center"
        anchorY="middle"
      >
        {`T ${temp.toFixed(1)} °C · atmospheric column`}
      </Text>
    </group>
  )
}

export function CDUColumn() {
  return (
    <Canvas camera={{ position: [10, 4, 12], fov: 38 }} dpr={[1, 1.8]}>
      <color attach="background" args={[COLOR.fog]} />
      {/* Fog pushed out so the tall column isn't washed at typical zoom */}
      <fog attach="fog" args={[COLOR.fog, 28, 90]} />

      {/* Bright ambient + hemisphere for global fill */}
      <ambientLight intensity={1.35} />
      <hemisphereLight args={['#e6efff', '#1a2638', 1.0]} />

      {/* Key directional from front-upper-right (daylight white) */}
      <directionalLight position={[12, 18, 10]} intensity={2.1} color="#ffffff" />
      {/* Warm fill from rear-left so the column body reads */}
      <directionalLight position={[-12, 8, -8]} intensity={1.0} color={COLOR.amber} />

      {/* Cool rim from front-left to define silhouette */}
      <pointLight position={[-8, 4, 10]} intensity={1.2} color={COLOR.cyan} distance={32} decay={2} />
      {/* Snow fill underglow so the base doesn't go pitch-black */}
      <pointLight position={[0, -1, 8]}  intensity={1.0} color={COLOR.snow} distance={20} decay={2} />
      {/* Top accent on the dome */}
      <pointLight position={[2, 10, 4]}  intensity={1.2} color="#ffffff"   distance={22} decay={2} />

      <ColumnScene />
      <OrbitControls
        enablePan
        screenSpacePanning
        minDistance={4}
        maxDistance={80}
        minPolarAngle={0.05}
        maxPolarAngle={Math.PI - 0.05}
      />
    </Canvas>
  )
}
