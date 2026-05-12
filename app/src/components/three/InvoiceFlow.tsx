import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Text } from '@react-three/drei'
import * as THREE from 'three'

const COLOR = {
  fog:    '#080e18',
  snow:   '#1ea7ff',
  cyan:   '#4ee2f4',
  amber:  '#ffb627',
  signal: '#34d57b',
  alarm:  '#ef4444',
  copper: '#c79a4a',
  flare:  '#ff6b35',
  steel:  '#1e3049',
  steelDk:'#132033',
  inkDim: '#8aa0c5',
} as const

const TRAVEL_X = 8         // from x = -4 to x = +4
const SPEED = 0.45

interface Doc {
  index: number
  offset: number     // phase offset, 0..1
  yLane: number      // vertical lane
  fraud: boolean
}

const DOCS: Doc[] = [
  { index: 0, offset: 0.00, yLane:  0.6, fraud: false },
  { index: 1, offset: 0.18, yLane: -0.3, fraud: false },
  { index: 2, offset: 0.34, yLane:  0.2, fraud: false },
  { index: 3, offset: 0.50, yLane:  0.9, fraud: true  },
  { index: 4, offset: 0.68, yLane: -0.6, fraud: false },
  { index: 5, offset: 0.84, yLane: -0.1, fraud: false },
]

function InvoiceCard({ doc }: { doc: Doc }) {
  const ref = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (!ref.current) return
    const t = state.clock.elapsedTime * SPEED + doc.offset * 2
    const phase = ((t % 2) + 2) % 2          // 0..2
    const fwd = phase < 1 ? phase : 2 - phase // ping-pong-like sample of 0..1
    // We actually want left → right loop (saw wave), not ping-pong.
    const saw = ((state.clock.elapsedTime * SPEED * 0.5 + doc.offset) % 1)
    const x = -TRAVEL_X / 2 + saw * TRAVEL_X
    const y = doc.yLane + Math.sin(state.clock.elapsedTime * 1.2 + doc.offset * 6) * 0.18

    ref.current.position.set(x, y, Math.sin(state.clock.elapsedTime * 0.6 + doc.offset * 5) * 0.2)
    ref.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.9 + doc.offset * 4) * 0.08

    // Fade at edges
    const edgeFade = Math.max(0, Math.min(1, Math.min(saw / 0.12, (1 - saw) / 0.12, 1)))
    const baseOpacity = doc.fraud ? 0.95 : 0.88
    ref.current.traverse((obj) => {
      const mesh = obj as THREE.Mesh
      if (mesh.isMesh) {
        const mat = mesh.material as THREE.MeshStandardMaterial
        if (mat && 'opacity' in mat) {
          mat.opacity = edgeFade * baseOpacity
        }
      }
    })
    // Suppress unused 'fwd' lint
    void fwd
  })

  const cardColor = doc.fraud ? COLOR.alarm : '#1a2a40'
  const emissive  = doc.fraud ? COLOR.alarm : COLOR.snow
  const emisInt   = doc.fraud ? 0.55 : 0.15

  return (
    <group ref={ref}>
      {/* Invoice card body */}
      <mesh>
        <boxGeometry args={[0.7, 0.5, 0.04]} />
        <meshStandardMaterial
          color={cardColor}
          emissive={emissive}
          emissiveIntensity={emisInt}
          metalness={0.4}
          roughness={0.55}
          transparent
          opacity={0.88}
        />
      </mesh>
      {/* Invoice stripes (lines that suggest text rows) */}
      {[0.14, 0.06, -0.02, -0.10, -0.18].map((y, i) => (
        <mesh key={i} position={[0, y, 0.025]}>
          <boxGeometry args={[0.5 - i * 0.04, 0.025, 0.005]} />
          <meshStandardMaterial
            color={doc.fraud ? '#ffe6e6' : COLOR.cyan}
            emissive={doc.fraud ? COLOR.alarm : COLOR.cyan}
            emissiveIntensity={0.35}
            transparent
            opacity={0.85}
          />
        </mesh>
      ))}
      {/* Header bar */}
      <mesh position={[0, 0.21, 0.026]}>
        <boxGeometry args={[0.62, 0.03, 0.005]} />
        <meshStandardMaterial
          color={doc.fraud ? COLOR.alarm : COLOR.amber}
          emissive={doc.fraud ? COLOR.alarm : COLOR.amber}
          emissiveIntensity={0.5}
          transparent
          opacity={0.9}
        />
      </mesh>
      {doc.fraud && (
        <Text
          position={[0, -0.38, 0.05]}
          fontSize={0.1}
          color={COLOR.alarm}
          anchorX="center"
          anchorY="middle"
        >
          FRAUD FLAG
        </Text>
      )}
    </group>
  )
}

function SnowflakeHub() {
  const ref = useRef<THREE.Mesh>(null)
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.x = state.clock.elapsedTime * 0.4
      ref.current.rotation.y = state.clock.elapsedTime * 0.55
      const m = ref.current.material as THREE.MeshStandardMaterial
      m.emissiveIntensity = 0.55 + 0.2 * Math.sin(state.clock.elapsedTime * 2)
    }
  })
  return (
    <group position={[0, 0, 0]}>
      <mesh ref={ref}>
        <octahedronGeometry args={[1.1, 0]} />
        <meshStandardMaterial
          color={COLOR.snow}
          emissive={COLOR.snow}
          emissiveIntensity={0.6}
          wireframe
          transparent
          opacity={0.85}
        />
      </mesh>
      {/* Inner core */}
      <mesh>
        <octahedronGeometry args={[0.55, 0]} />
        <meshStandardMaterial
          color={COLOR.cyan}
          emissive={COLOR.cyan}
          emissiveIntensity={0.45}
          metalness={0.4}
          roughness={0.4}
        />
      </mesh>
      <Text position={[0, -1.5, 0]} fontSize={0.22} color={COLOR.snow} anchorX="center">
        SNOWFLAKE · CORTEX
      </Text>
    </group>
  )
}

function FlowScene() {
  return (
    <group>
      {/* Left: Quorum */}
      <group position={[-3.6, 0, 0]}>
        <mesh>
          <boxGeometry args={[1.1, 1.1, 1.1]} />
          <meshStandardMaterial
            color={COLOR.copper}
            emissive={COLOR.copper}
            emissiveIntensity={0.25}
            metalness={0.7}
            roughness={0.4}
          />
        </mesh>
        <mesh>
          <boxGeometry args={[1.12, 1.12, 1.12]} />
          <meshBasicMaterial color={COLOR.amber} wireframe transparent opacity={0.25} />
        </mesh>
        <Text position={[0, -0.95, 0]} fontSize={0.22} color={COLOR.copper} anchorX="center">
          QUORUM
        </Text>
        <Text position={[0, -1.25, 0]} fontSize={0.14} color={COLOR.inkDim} anchorX="center">
          batch · ticket
        </Text>
      </group>

      {/* Right: SAP / Cash */}
      <group position={[3.6, 0, 0]}>
        <mesh>
          <boxGeometry args={[1.1, 1.1, 1.1]} />
          <meshStandardMaterial
            color={COLOR.signal}
            emissive={COLOR.signal}
            emissiveIntensity={0.28}
            metalness={0.65}
            roughness={0.4}
          />
        </mesh>
        <mesh>
          <boxGeometry args={[1.12, 1.12, 1.12]} />
          <meshBasicMaterial color={COLOR.signal} wireframe transparent opacity={0.25} />
        </mesh>
        <Text position={[0, -0.95, 0]} fontSize={0.22} color={COLOR.signal} anchorX="center">
          SAP · CASH
        </Text>
        <Text position={[0, -1.25, 0]} fontSize={0.14} color={COLOR.inkDim} anchorX="center">
          posting · settle
        </Text>
      </group>

      {/* Central Snowflake hub */}
      <SnowflakeHub />

      {/* Flowing invoices */}
      {DOCS.map(d => <InvoiceCard key={d.index} doc={d} />)}

      {/* Direction hint arrow text */}
      <Text position={[0, 2.4, 0]} fontSize={0.18} color={COLOR.cyan} anchorX="center">
        contract → invoice → cash
      </Text>
    </group>
  )
}

export function InvoiceFlow() {
  return (
    <Canvas camera={{ position: [0, 2, 9], fov: 45 }} dpr={[1, 1.6]}>
      <color attach="background" args={[COLOR.fog]} />
      <fog attach="fog" args={[COLOR.fog, 8, 24]} />
      <ambientLight intensity={0.5} />
      <pointLight position={[6, 5, 5]} intensity={0.9} color={COLOR.amber} />
      <pointLight position={[-6, 3, 3]} intensity={0.7} color={COLOR.snow} />
      <FlowScene />
      <OrbitControls
        enablePan
        screenSpacePanning
        minDistance={3}
        maxDistance={60}
        minPolarAngle={0.05}
        maxPolarAngle={Math.PI - 0.05}
      />
    </Canvas>
  )
}
