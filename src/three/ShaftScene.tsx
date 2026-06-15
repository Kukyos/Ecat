import { useMemo } from "react";
import * as THREE from "three";
import { useConfig, getFrameColor, type InfillTexture } from "../store";

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

  // Posts at the 4 corners + intermediate verticals
  return (
    <group position={[0, -SH / 2, 0]}>
      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.001, 0]} receiveShadow>
        <planeGeometry args={[SW * 4, SD * 4]} />
        <meshStandardMaterial color="#0e0e0e" roughness={0.9} metalness={0} />
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
          <meshStandardMaterial color={frame.hex} metalness={0.7} roughness={0.35} />
        </mesh>
      ))}

      {/* Horizontal beams at each floor + top */}
      {Array.from({ length: FLOORS + 1 }).map((_, f) => {
        const y = f * FLOOR_H;
        return (
          <group key={f} position={[0, y, 0]}>
            <mesh position={[0, 0, -SD / 2]}>
              <boxGeometry args={[SW, POST, POST]} />
              <meshStandardMaterial color={frame.hex} metalness={0.7} roughness={0.35} />
            </mesh>
            <mesh position={[0, 0, SD / 2]}>
              <boxGeometry args={[SW, POST, POST]} />
              <meshStandardMaterial color={frame.hex} metalness={0.7} roughness={0.35} />
            </mesh>
            <mesh position={[-SW / 2, 0, 0]}>
              <boxGeometry args={[POST, POST, SD]} />
              <meshStandardMaterial color={frame.hex} metalness={0.7} roughness={0.35} />
            </mesh>
            <mesh position={[ SW / 2, 0, 0]}>
              <boxGeometry args={[POST, POST, SD]} />
              <meshStandardMaterial color={frame.hex} metalness={0.7} roughness={0.35} />
            </mesh>
          </group>
        );
      })}

      {/* Guide rails (where the cabin slides) */}
      {[-0.35, 0.35].map((x, i) => (
        <mesh key={i} position={[x, SH / 2, 0]}>
          <boxGeometry args={[0.04, SH - 0.1, 0.04]} />
          <meshStandardMaterial color="#9c958a" metalness={0.9} roughness={0.25} />
        </mesh>
      ))}

      {/* Schematic cabin silhouette (wireframe) */}
      <mesh position={[0, FLOOR_H * 0.5, 0]}>
        <boxGeometry args={[1.4, FLOOR_H * 0.78, 1.2]} />
        <meshBasicMaterial color="#c9a96e" wireframe transparent opacity={0.35} />
      </mesh>

      {/* Infill panels */}
      {panels.map((p) => (
        <Panel
          key={p.index}
          meta={p}
          tex={infill[p.index]}
          selected={selected === p.index}
          onPick={() => selectPanel(selected === p.index ? null : p.index)}
        />
      ))}
    </group>
  );
}

function Panel({
  meta, tex, selected, onPick,
}: {
  meta: PanelMeta;
  tex: InfillTexture;
  selected: boolean;
  onPick: () => void;
}) {
  const mat = useMemo(() => makeMaterial(tex, selected), [tex, selected]);
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

function makeMaterial(tex: InfillTexture, selected: boolean): THREE.Material {
  const selectionEmissive = selected ? new THREE.Color("#c9a96e") : new THREE.Color("#000000");
  const selectionIntensity = selected ? 0.35 : 0;

  switch (tex) {
    case "glass":
      return new THREE.MeshPhysicalMaterial({
        color: "#b8d4dc",
        metalness: 0,
        roughness: 0.08,
        transmission: 0.85,
        thickness: 0.02,
        transparent: true,
        opacity: 0.6,
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
        opacity: selected ? 0.15 : 0.04,
        side: THREE.DoubleSide,
        emissive: selectionEmissive,
        emissiveIntensity: selectionIntensity * 0.6,
        depthWrite: false,
      });
  }
}
