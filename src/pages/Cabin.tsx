import { Canvas } from "@react-three/fiber";
import { OrbitControls, ContactShadows, Environment } from "@react-three/drei";
import { Suspense } from "react";
import CabinScene from "../three/CabinScene";
import { CABIN_FINISHES, useConfig } from "../store";

export default function Cabin() {
  const finishId = useConfig((s) => s.cabinFinishId);
  const setFinish = useConfig((s) => s.setCabinFinish);
  const variant = useConfig((s) => s.doorVariant);
  const setVariant = useConfig((s) => s.setDoorVariant);
  const open = useConfig((s) => s.doorsOpen);
  const toggleDoors = useConfig((s) => s.toggleDoors);

  return (
    <div className="viewer">
      <div className="canvas-wrap">
        <Canvas
          shadows
          dpr={[1, 2]}
          camera={{ position: [2.6, 1.4, 3.2], fov: 38 }}
        >
          <color attach="background" args={["#0a0a0a"]} />
          <fog attach="fog" args={["#0a0a0a", 6, 14]} />
          <ambientLight intensity={0.35} />
          <directionalLight
            position={[3, 6, 4]}
            intensity={1.4}
            castShadow
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
          />
          <Suspense fallback={null}>
            <Environment preset="apartment" />
            <CabinScene />
            <ContactShadows
              position={[0, -1.1, 0]}
              opacity={0.5}
              scale={6}
              blur={2.4}
              far={3}
            />
          </Suspense>
          <OrbitControls
            enablePan={false}
            minDistance={2.4}
            maxDistance={6}
            minPolarAngle={Math.PI / 6}
            maxPolarAngle={Math.PI / 2.05}
            target={[0, 0, 0]}
          />
        </Canvas>

        <div className="viewer-overlay">
          <span className="title">Cabin · Live Preview</span>
          <span className="pill">Drag · pinch · rotate</span>
        </div>

        <div className="hint">{open ? "Doors open" : "Doors closed"} · {variant === "center" ? "centre-opening" : "side-opening"}</div>
      </div>

      <div className="controls">
        <div className="row">
          <div className="label">Finish</div>
          <div className="swatches">
            {CABIN_FINISHES.map((f) => (
              <button
                key={f.id}
                className={`dot ${finishId === f.id ? "sel" : ""}`}
                style={{
                  background: `linear-gradient(135deg, ${f.wall}, ${f.trim})`,
                }}
                onClick={() => setFinish(f.id)}
                aria-label={f.name}
                title={f.name}
              />
            ))}
          </div>
        </div>

        <div className="row">
          <div className="label">Doors</div>
          <div className="seg">
            <button className={variant === "center" ? "active" : ""} onClick={() => setVariant("center")}>Centre</button>
            <button className={variant === "side" ? "active" : ""} onClick={() => setVariant("side")}>Side</button>
          </div>
          <button className="action" onClick={toggleDoors}>
            {open ? "Close doors" : "Open doors"}
          </button>
        </div>
      </div>
    </div>
  );
}
