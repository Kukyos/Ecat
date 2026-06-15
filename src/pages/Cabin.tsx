import { Canvas } from "@react-three/fiber";
import { OrbitControls, ContactShadows, Environment } from "@react-three/drei";
import { EffectComposer, Bloom, N8AO, Vignette, SMAA, ToneMapping } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import { Suspense } from "react";
import * as THREE from "three";
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
          shadows="soft"
          dpr={[1, 1.75]}
          gl={{
            antialias: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.15,
          }}
          camera={{ position: [2.6, 1.4, 3.2], fov: 38 }}
        >
          <color attach="background" args={["#070707"]} />
          <fog attach="fog" args={["#070707", 6, 16]} />
          <ambientLight intensity={0.22} />
          <directionalLight
            position={[4, 7, 5]}
            intensity={1.6}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            shadow-bias={-0.0002}
            shadow-normalBias={0.02}
          />
          <directionalLight position={[-4, 3, -3]} intensity={0.35} color="#7aa6c4" />

          <Suspense fallback={null}>
            <Environment preset="warehouse" environmentIntensity={0.85} />
            <CabinScene />
            <ContactShadows
              position={[0, -1.1, 0]}
              opacity={0.55}
              scale={8}
              blur={2.6}
              far={3}
            />
          </Suspense>

          <EffectComposer multisampling={0} enableNormalPass>
            <N8AO aoRadius={0.35} intensity={2.2} distanceFalloff={1} quality="medium" />
            <Bloom mipmapBlur intensity={0.55} luminanceThreshold={0.85} luminanceSmoothing={0.2} />
            <SMAA />
            <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
            <Vignette eskil={false} offset={0.2} darkness={0.55} />
          </EffectComposer>

          <OrbitControls
            enablePan={false}
            enableDamping
            dampingFactor={0.08}
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

        <div className="hint">
          {open ? "Doors open" : "Doors closed"} · {variant === "center" ? "centre-opening" : "side-opening"}
        </div>
      </div>

      <div className="controls">
        <div className="row">
          <div className="label">Finish</div>
          <div className="swatches">
            {CABIN_FINISHES.map((f) => (
              <button
                key={f.id}
                className={`dot ${finishId === f.id ? "sel" : ""}`}
                style={{ background: `linear-gradient(135deg, ${f.wall}, ${f.trim})` }}
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
