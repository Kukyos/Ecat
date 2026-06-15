import { useRef } from "react";
import { useSpring, animated, config } from "@react-spring/three";
import * as THREE from "three";
import { useConfig, getCabinFinish } from "../store";

// Cabin internal dims (metres)
const W = 1.6;   // width
const D = 1.4;   // depth
const H = 2.2;   // height
const WALL_T = 0.04;

export default function CabinScene() {
  const finish = getCabinFinish(useConfig((s) => s.cabinFinishId));
  const variant = useConfig((s) => s.doorVariant);
  const open = useConfig((s) => s.doorsOpen);

  // Door geometry: doors are mounted on the front (z = +D/2).
  // Center variant: two leaves slide apart horizontally.
  // Side variant: two telescoping leaves slide to the right.
  const doorH = H - 0.08;
  const doorY = doorH / 2 + 0.02;
  const doorZ = D / 2 + WALL_T / 2 + 0.001;

  // Travel
  const centerTravel = W / 2 - 0.02;
  const sideTravelOuter = W * 0.45;
  const sideTravelInner = W * 0.22;

  const cSpring = useSpring({
    cx: open ? centerTravel : 0,
    config: config.gentle,
  });
  const sSpring = useSpring({
    outer: open ? sideTravelOuter : 0,
    inner: open ? sideTravelInner : 0,
    config: config.gentle,
  });

  return (
    <group position={[0, -H / 2, 0]}>
      {/* Floor */}
      <mesh position={[0, WALL_T / 2, 0]} receiveShadow>
        <boxGeometry args={[W + 0.1, WALL_T, D + 0.1]} />
        <meshStandardMaterial color={finish.floor} metalness={0.2} roughness={0.4} />
      </mesh>
      {/* Ceiling */}
      <mesh position={[0, H - WALL_T / 2, 0]}>
        <boxGeometry args={[W, WALL_T, D]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.3} roughness={0.6} />
      </mesh>
      {/* Recessed ceiling light */}
      <mesh position={[0, H - WALL_T - 0.01, 0]}>
        <boxGeometry args={[W * 0.55, 0.005, D * 0.55]} />
        <meshStandardMaterial color="#fff8e8" emissive="#fff1c2" emissiveIntensity={1.2} />
      </mesh>

      {/* Back wall */}
      <Wall position={[0, H / 2, -D / 2]} size={[W, H, WALL_T]} finish={finish} />
      {/* Left wall */}
      <Wall position={[-W / 2, H / 2, 0]} size={[WALL_T, H, D]} finish={finish} />
      {/* Right wall */}
      <Wall position={[W / 2, H / 2, 0]} size={[WALL_T, H, D]} finish={finish} />

      {/* Back wall mirror panel */}
      <mesh position={[0, H * 0.55, -D / 2 + WALL_T / 2 + 0.002]}>
        <planeGeometry args={[W * 0.6, H * 0.55]} />
        <meshStandardMaterial color="#d8d8d8" metalness={1} roughness={0.05} />
      </mesh>

      {/* Handrail (back wall) */}
      <mesh position={[0, H * 0.42, -D / 2 + 0.06]}>
        <cylinderGeometry args={[0.018, 0.018, W * 0.85, 24]} />
        <meshStandardMaterial color={finish.trim} metalness={0.95} roughness={0.18} />
      </mesh>

      {/* Control panel (right wall) */}
      <mesh position={[W / 2 - WALL_T / 2 - 0.012, H * 0.55, D / 2 - 0.22]}>
        <boxGeometry args={[0.012, 0.6, 0.12]} />
        <meshStandardMaterial color="#0a0a0a" metalness={0.8} roughness={0.3} />
      </mesh>
      {/* Buttons */}
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh key={i}
          position={[W / 2 - WALL_T / 2 - 0.02, H * 0.55 + 0.22 - i * 0.1, D / 2 - 0.22]}>
          <cylinderGeometry args={[0.012, 0.012, 0.006, 16]} rotation={[0, 0, Math.PI / 2]} />
          <meshStandardMaterial
            color={finish.trim}
            metalness={0.95}
            roughness={0.2}
            emissive={i === 0 ? "#ffb14a" : "#000000"}
            emissiveIntensity={i === 0 ? 0.6 : 0}
          />
        </mesh>
      ))}

      {/* Door frame (header above doors) */}
      <mesh position={[0, doorH + 0.05, doorZ]}>
        <boxGeometry args={[W + 0.05, 0.08, 0.03]} />
        <meshStandardMaterial color={finish.trim} metalness={0.9} roughness={0.25} />
      </mesh>

      {/* Doors */}
      {variant === "center" ? (
        <>
          {/* Left leaf */}
          <animated.mesh
            position-x={cSpring.cx.to((v) => -W / 4 - v)}
            position-y={doorY}
            position-z={doorZ}
          >
            <boxGeometry args={[W / 2 - 0.01, doorH, 0.025]} />
            <meshStandardMaterial color={finish.trim} metalness={0.9} roughness={0.22} />
          </animated.mesh>
          {/* Right leaf */}
          <animated.mesh
            position-x={cSpring.cx.to((v) => W / 4 + v)}
            position-y={doorY}
            position-z={doorZ}
          >
            <boxGeometry args={[W / 2 - 0.01, doorH, 0.025]} />
            <meshStandardMaterial color={finish.trim} metalness={0.9} roughness={0.22} />
          </animated.mesh>
        </>
      ) : (
        <>
          {/* Outer (right) leaf — travels right */}
          <animated.mesh
            position-x={sSpring.outer.to((v) => W / 4 + v)}
            position-y={doorY}
            position-z={doorZ + 0.001}
          >
            <boxGeometry args={[W / 2 - 0.01, doorH, 0.022]} />
            <meshStandardMaterial color={finish.trim} metalness={0.9} roughness={0.22} />
          </animated.mesh>
          {/* Inner leaf — telescopes behind, smaller travel */}
          <animated.mesh
            position-x={sSpring.inner.to((v) => -W / 4 + v)}
            position-y={doorY}
            position-z={doorZ - 0.001}
          >
            <boxGeometry args={[W / 2 - 0.01, doorH, 0.022]} />
            <meshStandardMaterial color={finish.trim} metalness={0.85} roughness={0.28} />
          </animated.mesh>
        </>
      )}

      {/* Soft contact shadow plane under cabin */}
      <mesh position={[0, 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[W * 3, D * 3]} />
        <shadowMaterial opacity={0.35} />
      </mesh>
    </group>
  );
}

function Wall({
  position, size, finish,
}: {
  position: [number, number, number];
  size: [number, number, number];
  finish: ReturnType<typeof getCabinFinish>;
}) {
  const ref = useRef<THREE.Mesh>(null);
  return (
    <mesh ref={ref} position={position}>
      <boxGeometry args={size} />
      <meshStandardMaterial
        color={finish.wall}
        metalness={finish.metalness}
        roughness={finish.roughness}
      />
    </mesh>
  );
}
