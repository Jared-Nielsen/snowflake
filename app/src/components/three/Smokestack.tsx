import { useMemo, useRef } from 'react'
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
  smoke:  '#7a8294',
  inkDim: '#8aa0c5',
} as const

const STACK_HEIGHT = 4.6
const STACK_BASE_Y = -1.5
const STACK_TOP_Y  = STACK_BASE_Y + STACK_HEIGHT
const PARTICLE_COUNT = 120

interface ParticleState {
  initX: number
  initZ: number
  speed: number
  phase: number
  scale: number
  lifetime: number
  offset: number
}

function Plume() {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])

  const particles: ParticleState[] = useMemo(() => {
    const arr: ParticleState[] = []
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      arr.push({
        initX: (Math.random() - 0.5) * 0.3,
        initZ: (Math.random() - 0.5) * 0.3,
        speed: 0.25 + Math.random() * 0.4,
        phase: Math.random() * Math.PI * 2,
        scale: 0.08 + Math.random() * 0.16,
        lifetime: 3.5 + Math.random() * 2.5,
        offset: Math.random() * 5,
      })
    }
    return arr
  }, [])

  useFrame((state) => {
    if (!meshRef.current) return
    const t = state.clock.elapsedTime

    particles.forEach((p, i) => {
      const age = ((t + p.offset) % p.lifetime) / p.lifetime  // 0..1
      const yRise = age * 5.2
      const spread = age * 1.4
      const x = p.initX + Math.sin(t * p.speed + p.phase) * spread
      const z = p.initZ + Math.cos(t * p.speed * 0.8 + p.phase) * spread

      dummy.position.set(x, STACK_TOP_Y + 0.3 + yRise, z)
      const sz = p.scale * (0.6 + age * 1.4) * (1 - age * 0.3)
      dummy.scale.setScalar(sz)
      dummy.updateMatrix()
      meshRef.current!.setMatrixAt(i, dummy.matrix)
    })
    meshRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, PARTICLE_COUNT]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshStandardMaterial
        color={COLOR.smoke}
        emissive={COLOR.copper}
        emissiveIntensity={0.08}
        metalness={0.1}
        roughness={0.9}
        transparent
        opacity={0.35}
        depthWrite={false}
      />
    </instancedMesh>
  )
}

function StackBody() {
  return (
    <group>
      {/* Foundation block */}
      <mesh position={[0, STACK_BASE_Y - 0.3, 0]}>
        <boxGeometry args={[1.6, 0.6, 1.6]} />
        <meshStandardMaterial color={COLOR.steelDk} metalness={0.5} roughness={0.6} />
      </mesh>

      {/* Tapered cylindrical stack */}
      <mesh position={[0, STACK_BASE_Y + STACK_HEIGHT / 2, 0]}>
        <cylinderGeometry args={[0.45, 0.7, STACK_HEIGHT, 28]} />
        <meshStandardMaterial color={COLOR.steel} metalness={0.65} roughness={0.5} />
      </mesh>

      {/* Wireframe schematic overlay */}
      <mesh position={[0, STACK_BASE_Y + STACK_HEIGHT / 2, 0]}>
        <cylinderGeometry args={[0.46, 0.71, STACK_HEIGHT, 14, 8]} />
        <meshBasicMaterial color={COLOR.cyan} wireframe transparent opacity={0.18} />
      </mesh>

      {/* Banding rings */}
      {[-1.2, 0, 1.2].map((y, i) => (
        <mesh key={i} position={[0, STACK_BASE_Y + STACK_HEIGHT / 2 + y, 0]}>
          <torusGeometry args={[0.45 + (1 - (y + 1.2) / 2.4) * 0.12, 0.04, 8, 28]} />
          <meshStandardMaterial color={COLOR.copper} metalness={0.7} roughness={0.4} />
        </mesh>
      ))}

      {/* Top rim cap */}
      <mesh position={[0, STACK_TOP_Y + 0.04, 0]}>
        <torusGeometry args={[0.46, 0.06, 10, 28]} />
        <meshStandardMaterial
          color={COLOR.copper}
          emissive={COLOR.flare}
          emissiveIntensity={0.35}
          metalness={0.75}
          roughness={0.35}
        />
      </mesh>

      {/* Inner glow at the top opening */}
      <mesh position={[0, STACK_TOP_Y, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.4, 24]} />
        <meshStandardMaterial
          color={COLOR.flare}
          emissive={COLOR.flare}
          emissiveIntensity={0.7}
          transparent
          opacity={0.6}
        />
      </mesh>

      {/* Service ladder hint */}
      <mesh position={[0.55, STACK_BASE_Y + STACK_HEIGHT / 2, 0]}>
        <boxGeometry args={[0.04, STACK_HEIGHT * 0.85, 0.04]} />
        <meshStandardMaterial color={COLOR.amber} metalness={0.6} roughness={0.5} />
      </mesh>
    </group>
  )
}

function SmokestackScene() {
  return (
    <group>
      <gridHelper args={[16, 16, COLOR.steel, COLOR.steelDk]} position={[0, STACK_BASE_Y - 0.6, 0]} />
      <StackBody />
      <Plume />

      {/* Labels */}
      <Text
        position={[0, STACK_TOP_Y + 5.4, 0]}
        fontSize={0.34}
        color={COLOR.flare}
        anchorX="center"
        anchorY="middle"
      >
        CO₂ 1.42 t/hr
      </Text>
      <Text
        position={[0, STACK_TOP_Y + 4.95, 0]}
        fontSize={0.18}
        color={COLOR.inkDim}
        anchorX="center"
        anchorY="middle"
      >
        stack #3 · GHG telemetry
      </Text>
      <Text
        position={[0, STACK_BASE_Y - 0.95, 0]}
        fontSize={0.16}
        color={COLOR.cyan}
        anchorX="center"
        anchorY="middle"
      >
        emission monitoring
      </Text>
    </group>
  )
}

export function Smokestack() {
  return (
    <Canvas camera={{ position: [6, 3, 8], fov: 42 }} dpr={[1, 1.6]}>
      <color attach="background" args={[COLOR.fog]} />
      <fog attach="fog" args={[COLOR.fog, 10, 26]} />
      <ambientLight intensity={0.45} />
      <pointLight position={[6, 7, 4]} intensity={0.85} color={COLOR.amber} />
      <pointLight position={[-5, 4, -4]} intensity={0.55} color={COLOR.snow} />
      <SmokestackScene />
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
