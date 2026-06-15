import { Canvas } from "@react-three/fiber";
import { OrbitControls, ContactShadows, Environment } from "@react-three/drei";
import { Suspense } from "react";
import ShaftScene from "../three/ShaftScene";
import { FRAME_COLORS, useConfig, type InfillTexture } from "../store";

const TEX: { id: InfillTexture; name: string; preview: string }[] = [
  { id: "empty",  name: "Empty",     preview: "transparent" },
  { id: "glass",  name: "Glass",     preview: "linear-gradient(135deg,#b8d4dc,#5a7a8c)" },
  { id: "rcp",    name: "RCP Tape",  preview: "repeating-linear-gradient(45deg,#0a0a0a 0 4px,#1a1a1a 4px 8px)" },
  { id: "mesh",   name: "Mesh",      preview: "radial-gradient(circle at 30% 30%,#5a5a5a 1px,transparent 2px) 0 0/6px 6px,#2a2a2a" },
  { id: "oak",    name: "Oak",       preview: "linear-gradient(135deg,#6a4a30,#3a2a1c)" },
  { id: "marble", name: "Marble",    preview: "linear-gradient(135deg,#ece7df,#cfc6b8)" },
];

export default function Shaft() {
  const frameId = useConfig((s) => s.frameColorId);
  const setFrame = useConfig((s) => s.setFrameColor);
  const selected = useConfig((s) => s.selectedPanel);
  const applyInfill = useConfig((s) => s.applyInfill);
  const reset = useConfig((s) => s.resetShaft);
  const infill = useConfig((s) => s.infill);
  const selectedTex = selected !== null ? infill[selected] : null;

  return (
    <div className="viewer">
      <div className="canvas-wrap">
        <Canvas
          shadows
          dpr={[1, 2]}
          camera={{ position: [4.5, 2.4, 5.5], fov: 40 }}
        >
          <color attach="background" args={["#0a0a0a"]} />
          <fog attach="fog" args={["#0a0a0a", 10, 22]} />
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 8, 5]} intensity={1.0} castShadow />
          <directionalLight position={[-4, 3, -2]} intensity={0.4} color="#8aa6c4" />
          <Suspense fallback={null}>
            <Environment preset="city" />
            <ShaftScene />
            <ContactShadows position={[0, -3.6, 0]} opacity={0.4} scale={10} blur={3} far={5} />
          </Suspense>
          <OrbitControls
            enablePan={false}
            minDistance={4}
            maxDistance={12}
            minPolarAngle={Math.PI / 8}
            maxPolarAngle={Math.PI / 2.05}
            target={[0, 0, 0]}
          />
        </Canvas>

        <div className="viewer-overlay">
          <span className="title">Shaft · Schematic</span>
          <span className="pill">{selected === null ? "Tap a bay" : `Bay ${selected + 1} selected`}</span>
        </div>

        <div className="hint">
          {selected === null
            ? "Tap any empty bay, then pick an infill below"
            : "Now pick an infill material"}
        </div>
      </div>

      <div className="controls">
        <div className="row">
          <div className="label">Frame</div>
          <div className="swatches">
            {FRAME_COLORS.map((c) => (
              <button
                key={c.id}
                className={`dot ${frameId === c.id ? "sel" : ""}`}
                style={{ background: c.hex }}
                onClick={() => setFrame(c.id)}
                aria-label={c.name}
                title={c.name}
              />
            ))}
          </div>
        </div>

        <div className="row">
          <div className="label">Infill</div>
          <div className="tex-rail">
            {TEX.map((t) => (
              <button
                key={t.id}
                className={`tex-chip ${selectedTex === t.id ? "sel" : ""}`}
                disabled={selected === null}
                onClick={() => applyInfill(t.id)}
              >
                <span className="mini" style={{ background: t.preview }} />
                {t.name}
              </button>
            ))}
          </div>
        </div>

        <div className="row">
          <div className="label">&nbsp;</div>
          <button className="action ghost" onClick={reset}>Reset all bays</button>
        </div>
      </div>
    </div>
  );
}
