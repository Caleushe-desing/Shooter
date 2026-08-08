import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { PORTAL } from '../../constants'
import type { PortalSpot } from '../../map/portals'

const galaxyVert = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const galaxyFrag = /* glsl */ `
  uniform float uTime;
  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  void main() {
    vec2 p = vUv * 2.0 - 1.0;
    float r = length(p);
    if (r > 0.98) discard;

    float angle = atan(p.y, p.x) + uTime * 0.18;
    float arms = 0.55 + 0.45 * sin(angle * 3.0 + r * 10.0 - uTime * 0.7);
    float core = exp(-r * 4.2) * 1.4;
    float disk = smoothstep(0.95, 0.15, r) * arms;

    vec3 nebula = mix(vec3(0.12, 0.05, 0.35), vec3(0.55, 0.2, 0.85), disk);
    nebula = mix(nebula, vec3(0.2, 0.55, 0.95), smoothstep(0.55, 0.05, r) * 0.65);
    nebula += vec3(1.0, 0.85, 0.55) * core;

    float stars = step(0.992, hash(floor(p * 48.0 + uTime * 0.05)));
    stars += step(0.997, hash(floor(p * 90.0 - uTime * 0.02))) * 0.8;
    nebula += vec3(0.95, 0.97, 1.0) * stars;

    float alpha = smoothstep(0.98, 0.2, r) * (0.55 + disk * 0.4 + core * 0.25);
    gl_FragColor = vec4(nebula, alpha);
  }
`

type Props = {
  portal: PortalSpot
}

/** Vertical stargate-like ring with a swirling galaxy disc. */
export function GalaxyPortal({ portal }: Props) {
  const galaxyMat = useRef<THREE.ShaderMaterial>(null)
  const ringRef = useRef<THREE.Mesh>(null)
  const glowRef = useRef<THREE.Mesh>(null)
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), [])

  useFrame((_, dt) => {
    if (galaxyMat.current) galaxyMat.current.uniforms.uTime.value += dt
    if (ringRef.current) ringRef.current.rotation.z += dt * 0.35
    if (glowRef.current) {
      const s = 1 + Math.sin(performance.now() * 0.003 + portal.id) * 0.04
      glowRef.current.scale.setScalar(s)
    }
  })

  return (
    <group position={[portal.x, PORTAL.radius + 0.15, portal.z]} rotation={[0, portal.yaw, 0]}>
      <mesh castShadow>
        <torusGeometry args={[PORTAL.radius, 0.22, 10, 40]} />
        <meshStandardMaterial
          color="#2A2438"
          metalness={0.65}
          roughness={0.35}
          emissive="#3A2060"
          emissiveIntensity={0.35}
        />
      </mesh>
      <mesh ref={ringRef}>
        <torusGeometry args={[PORTAL.radius, 0.12, 12, 48]} />
        <meshStandardMaterial
          color="#6B4CFF"
          metalness={0.4}
          roughness={0.25}
          emissive="#7A5CFF"
          emissiveIntensity={0.85}
        />
      </mesh>
      <mesh>
        <circleGeometry args={[PORTAL.radius * 0.92, 48]} />
        <shaderMaterial
          ref={galaxyMat}
          vertexShader={galaxyVert}
          fragmentShader={galaxyFrag}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh ref={glowRef}>
        <ringGeometry args={[PORTAL.radius * 0.88, PORTAL.radius * 1.2, 40]} />
        <meshBasicMaterial
          color="#7B5CFF"
          transparent
          opacity={0.28}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -PORTAL.radius - 0.12, 0]}>
        <circleGeometry args={[PORTAL.radius * 1.15, 28]} />
        <meshBasicMaterial color="#4A2A90" transparent opacity={0.22} depthWrite={false} />
      </mesh>
      <pointLight color="#8B6CFF" intensity={2.2} distance={8} decay={2} position={[0, 0.2, 0.4]} />
    </group>
  )
}
