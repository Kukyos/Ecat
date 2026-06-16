import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { MeshReflectorMaterial } from "@react-three/drei";
import { useConfig, getFrameColor, type InfillTexture } from "../store";
import { DEVICE } from "../utils/device";
import {
  brushedMetalNormal,
  brushedMetalRoughness,
  microNoiseNormal,
  darkStoneAlbedo,
} from "./procTextures";

// Shaft outer dims
const SW = 2.0;   // width
const SD = 1.8;   // depth
const SH = 7.2;   // height (3 floors)
const POST = 0.08; // post thickness
const FLOORS = 3;
const FLOOR_H = SH / FLOORS;

// Panel layout: 4 sides × 3 floors = 12 bays
type PanelMeta = {
  index: number;
  position: [number, number, number];
  rotationY: number;
  width: number;
  height: number;
};

function buildPanels(): PanelMeta[] {
  const panels: PanelMeta[] = [];
  const inset = 0.005;
  for (let f = 0; f < FLOORS; f++) {
    const cy = f * FLOOR_H + FLOOR_H / 2;
    const h = FLOOR_H - POST * 1.4;
    // back  (z = -SD/2)
    panels.push({ index: f * 4 + 0, position: [0, cy, -SD / 2 + inset], rotationY: 0, width: SW - POST * 1.4, height: h });
    // front (z = +SD/2)
    panels.push({ index: f * 4 + 1, position: [0, cy,  SD / 2 - inset], rotationY: Math.PI, width: SW - POST * 1.4, height: h });
    // left  (x = -SW/2)
    panels.push({ index: f * 4 + 2, position: [-SW / 2 + inset, cy, 0], rotationY: Math.PI / 2, width: SD - POST * 1.4, height: h });
    // right (x = +SW/2)
    panels.push({ index: f * 4 + 3, position: [ SW / 2 - inset, cy, 0], rotationY: -Math.PI / 2, width: SD - POST * 1.4, height: h });
  }
  return panels;
}

export default function ShaftScene() {
  const frame = getFrameColor(useConfig((s) => s.frameColorId));
  const infill = useConfig((s) => s.infill);
  const selected = useConfig((s) => s.selectedPanel);
  const selectPanel = useConfig((s) => s.selectPanel);

  const panels = useMemo(() => buildPanels(), []);

  // Procedural textures
  const tex = useMemo(() => ({
    brushedN: brushedMetalNormal(2),
    brushedR: brushedMetalRoughness(2, 0.28),
    microN: microNoiseNormal(3, 0.35),
    stone: darkStoneAlbedo(),
  }), []);

  // Posts at the 4 corners + intermediate verticals
  return (
    <group position={[0, -SH / 2, 0]}>
      {/* Ground plane (highly polished stone) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.001, 0]} receiveShadow>
        <planeGeometry args={[SW * 4, SD * 4]} />
        <MeshReflectorMaterial
          blur={[400, 100]}
          resolution={DEVICE.reflectorResolution}
          mixBlur={1}
          mixStrength={1.5}
          roughness={0.7}
          depthScale={1.2}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          color="#1a1a1a"
          metalness={0.2}
          map={tex.stone}
        />
      </mesh>

      {/* Corner posts (full height) */}
      {[
        [-SW / 2, -SD / 2],
        [ SW / 2, -SD / 2],
        [-SW / 2,  SD / 2],
        [ SW / 2,  SD / 2],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, SH / 2, z]} castShadow>
          <boxGeometry args={[POST, SH, POST]} />
          <meshStandardMaterial 
            color={frame.hex} metalness={0.8} 
            roughnessMap={tex.brushedR} normalMap={tex.brushedN}
          />
        </mesh>
      ))}

      {/* Horizontal beams at each floor + top */}
      {Array.from({ length: FLOORS + 1 }).map((_, f) => {
        const y = f * FLOOR_H;
        return (
          <group key={f} position={[0, y, 0]}>
            <mesh position={[0, 0, -SD / 2]}>
              <boxGeometry args={[SW, POST, POST]} />
              <meshStandardMaterial color={frame.hex} metalness={0.8} roughnessMap={tex.brushedR} normalMap={tex.brushedN} />
            </mesh>
            <mesh position={[0, 0, SD / 2]}>
              <boxGeometry args={[SW, POST, POST]} />
              <meshStandardMaterial color={frame.hex} metalness={0.8} roughnessMap={tex.brushedR} normalMap={tex.brushedN} />
            </mesh>
            <mesh position={[-SW / 2, 0, 0]}>
              <boxGeometry args={[POST, POST, SD]} />
              <meshStandardMaterial color={frame.hex} metalness={0.8} roughnessMap={tex.brushedR} normalMap={tex.brushedN} />
            </mesh>
            <mesh position={[ SW / 2, 0, 0]}>
              <boxGeometry args={[POST, POST, SD]} />
              <meshStandardMaterial color={frame.hex} metalness={0.8} roughnessMap={tex.brushedR} normalMap={tex.brushedN} />
            </mesh>
          </group>
        );
      })}

      {/* Guide rails (where the cabin slides) */}
      {[-0.35, 0.35].map((x, i) => (
        <mesh key={i} position={[x, SH / 2, 0]}>
          <boxGeometry args={[0.04, SH - 0.1, 0.04]} />
          <meshStandardMaterial color="#b3ad9f" metalness={0.9} roughnessMap={tex.brushedR} normalMap={tex.brushedN} />
        </mesh>
      ))}

      {/* Schematic cabin silhouette (wireframe) */}
      <mesh position={[0, FLOOR_H * 0.5, 0]}>
        <boxGeometry args={[1.4, FLOOR_H * 0.78, 1.2]} />
        <meshBasicMaterial color="#c9a96e" wireframe transparent opacity={0.35} />
      </mesh>

      {/* Elevator Door at bottom front bay (index 1) */}
      <ElevatorDoor frameColor={frame.hex} tex={tex} />

      {/* Infill panels (skip index 1 where the door is) */}
      {panels.map((p) => {
        if (p.index === 1) return null;
        return (
          <Panel
            key={p.index}
            meta={p}
            tex={infill[p.index]}
            texMaps={tex}
            selected={selected === p.index}
            onPick={() => selectPanel(selected === p.index ? null : p.index)}
          />
        );
      })}
    </group>
  );
}

function Panel({
  meta, tex, texMaps, selected, onPick,
}: {
  meta: PanelMeta;
  tex: InfillTexture;
  texMaps: any;
  selected: boolean;
  onPick: () => void;
}) {
  const matRef = useRef<THREE.Material | null>(null);

  // Dispose old material and create new one only when tex/selected changes
  const mat = useMemo(() => {
    if (matRef.current) matRef.current.dispose();
    const m = makeMaterial(tex, selected, texMaps);
    matRef.current = m;
    return m;
  }, [tex, selected]);

  // Cleanup on unmount
  useEffect(() => {
    return () => { matRef.current?.dispose(); };
  }, []);

  return (
    <mesh
      position={meta.position}
      rotation={[0, meta.rotationY, 0]}
      onClick={(e) => { e.stopPropagation(); onPick(); }}
      onPointerDown={(e) => { e.stopPropagation(); }}
    >
      <planeGeometry args={[meta.width, meta.height]} />
      <primitive object={mat} attach="material" />
    </mesh>
  );
}

function makeMaterial(tex: InfillTexture, selected: boolean, texMaps: any): THREE.Material {
  const selectionEmissive = selected ? new THREE.Color("#c9a96e") : new THREE.Color("#000000");
  const selectionIntensity = selected ? 0.35 : 0;

  switch (tex) {
    case "glass":
      return new THREE.MeshPhysicalMaterial({
        color: "#d0e4ea",
        metalness: 0.1,
        roughness: 0.05,
        transmission: 0.9,
        thickness: 0.05,
        ior: 1.52,
        clearcoat: 1.0,
        clearcoatRoughness: 0.05,
        normalMap: texMaps.microN,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide,
        emissive: selectionEmissive,
        emissiveIntensity: selectionIntensity,
      });
    case "rcp":
      return new THREE.MeshStandardMaterial({
        color: "#0a0a0a",
        metalness: 0.1,
        roughness: 0.95,
        side: THREE.DoubleSide,
        emissive: selectionEmissive,
        emissiveIntensity: selectionIntensity,
      });
    case "mesh":
      return new THREE.MeshStandardMaterial({
        color: "#2a2a2a",
        metalness: 0.6,
        roughness: 0.6,
        transparent: true,
        opacity: 0.55,
        side: THREE.DoubleSide,
        emissive: selectionEmissive,
        emissiveIntensity: selectionIntensity,
      });
    case "oak":
      return new THREE.MeshStandardMaterial({
        color: "#5a3a22",
        metalness: 0.05,
        roughness: 0.75,
        side: THREE.DoubleSide,
        emissive: selectionEmissive,
        emissiveIntensity: selectionIntensity,
      });
    case "marble":
      return new THREE.MeshStandardMaterial({
        color: "#ece7df",
        metalness: 0.05,
        roughness: 0.3,
        side: THREE.DoubleSide,
        emissive: selectionEmissive,
        emissiveIntensity: selectionIntensity,
      });
    case "empty":
    default:
      return new THREE.MeshStandardMaterial({
        color: selected ? "#c9a96e" : "#ffffff",
        transparent: true,
        opacity: selected ? 0.15 : 0.0,
        side: THREE.DoubleSide,
        emissive: selectionEmissive,
        emissiveIntensity: selectionIntensity * 0.6,
        depthWrite: false,
      });
  }
}

function ElevatorDoor({ frameColor, tex }: { frameColor: string; tex: any }) {
  const doorH = 2.1;
  const doorW = 1.0; 
  const frameW = 1.4; // wider frame
  const bayW = SW - POST * 1.4;
  const bayH = FLOOR_H - POST * 1.4;
  
  return (
    <group position={[0, FLOOR_H / 2, SD / 2 - 0.005]} rotation={[0, Math.PI, 0]}>
      {/* Surround wall filling the bay */}
      <mesh position={[0, 0, -0.01]}>
        <planeGeometry args={[bayW, bayH]} />
        <meshStandardMaterial color="#222" metalness={0.2} roughness={0.9} />
      </mesh>

      {/* Outer frame */}
      <mesh position={[-frameW / 2 + 0.075, -FLOOR_H / 2 + doorH / 2, 0]}>
        <boxGeometry args={[0.15, doorH, 0.04]} />
        <meshStandardMaterial color={frameColor} metalness={0.8} roughnessMap={tex.brushedR} normalMap={tex.brushedN} />
      </mesh>
      <mesh position={[frameW / 2 - 0.075, -FLOOR_H / 2 + doorH / 2, 0]}>
        <boxGeometry args={[0.15, doorH, 0.04]} />
        <meshStandardMaterial color={frameColor} metalness={0.8} roughnessMap={tex.brushedR} normalMap={tex.brushedN} />
      </mesh>
      <mesh position={[0, -FLOOR_H / 2 + doorH + 0.075, 0]}>
        <boxGeometry args={[frameW, 0.15, 0.04]} />
        <meshStandardMaterial color={frameColor} metalness={0.8} roughnessMap={tex.brushedR} normalMap={tex.brushedN} />
      </mesh>

      {/* Door leaves (closed, with center gap) */}
      <mesh position={[-doorW / 4 - 0.003, -FLOOR_H / 2 + doorH / 2, 0]}>
        <boxGeometry args={[doorW / 2 - 0.01, doorH, 0.02]} />
        <meshStandardMaterial color="#999" metalness={0.8} roughnessMap={tex.brushedR} normalMap={tex.brushedN} />
      </mesh>
      <mesh position={[doorW / 4 + 0.003, -FLOOR_H / 2 + doorH / 2, 0]}>
        <boxGeometry args={[doorW / 2 - 0.01, doorH, 0.02]} />
        <meshStandardMaterial color="#999" metalness={0.8} roughnessMap={tex.brushedR} normalMap={tex.brushedN} />
      </mesh>

      {/* Call button panel on the left frame (local +x = outside left) */}
      <group position={[frameW / 2 - 0.075, -FLOOR_H / 2 + 1.1, 0.021]}>
        {/* Faceplate */}
        <mesh>
          <boxGeometry args={[0.08, 0.25, 0.01]} />
          <meshStandardMaterial color="#111" metalness={0.9} roughness={0.5} />
        </mesh>
        {/* Up Button */}
        <mesh position={[0, 0.05, 0.006]}>
          <boxGeometry args={[0.03, 0.03, 0.005]} />
          <meshStandardMaterial color="#ddd" emissive="#00ff00" emissiveIntensity={0.8} />
        </mesh>
        {/* Down Button */}
        <mesh position={[0, -0.05, 0.006]}>
          <boxGeometry args={[0.03, 0.03, 0.005]} />
          <meshStandardMaterial color="#ddd" emissive="#333" emissiveIntensity={0.2} />
        </mesh>
      </group>
      
      {/* Floor Indicator (top center of frame) */}
      <group position={[0, -FLOOR_H / 2 + doorH + 0.075, 0.021]}>
        {/* Screen */}
        <mesh>
          <boxGeometry args={[0.3, 0.08, 0.01]} />
          <meshStandardMaterial color="#000" metalness={0.9} roughness={0.1} />
        </mesh>
        {/* Floor number text representation (red glowing dash) */}
        <mesh position={[0, 0, 0.006]}>
          <planeGeometry args={[0.06, 0.04]} />
          <meshBasicMaterial color="#ff2222" />
        </mesh>
        {/* Direction arrow representation */}
        <mesh position={[-0.08, 0, 0.006]}>
          <planeGeometry args={[0.02, 0.03]} />
          <meshBasicMaterial color="#ff2222" />
        </mesh>
      </group>
    </group>
  );
}
