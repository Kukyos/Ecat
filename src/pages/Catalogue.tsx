import { useNavigate } from "react-router-dom";
import {
  CABIN_WALL_FINISHES,
  SHAFT_INFILL,
  FRAME_COLORS,
  SERVICES,
  type SwatchItem,
} from "../data/catalogue";
import { useConfig } from "../store";

export default function Catalogue() {
  const navigate = useNavigate();
  const setCabinFinish = useConfig((s) => s.setCabinFinish);
  const setFrameColor = useConfig((s) => s.setFrameColor);

  return (
    <div className="cat">
      <h1>The Blackstone Library</h1>
      <p className="lede">
        Every finish, frame and infill we offer — preview live in 3D, then walk the customer
        through their cabin and shaft on site.
      </p>

      <Section title="Cabin Wall Finishes" items={CABIN_WALL_FINISHES}
        onPick={(id) => { setCabinFinish(id); navigate("/cabin"); }} />

      <Section title="Shaft Frame Colours" items={FRAME_COLORS}
        onPick={(id) => { setFrameColor(id); navigate("/shaft"); }} />

      <Section title="Shaft Infill Materials" items={SHAFT_INFILL}
        onPick={() => navigate("/shaft")} />

      <div className="cat-section">
        <h2>Services</h2>
        <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}>
          {SERVICES.map((s) => (
            <div key={s.id} className="svc-card">
              <div className="t">{s.name}</div>
              <div className="d">{s.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Section({
  title, items, onPick,
}: { title: string; items: SwatchItem[]; onPick: (id: string) => void }) {
  return (
    <div className="cat-section">
      <h2>{title}</h2>
      <div className="grid">
        {items.map((it) => (
          <button key={it.id} className="card" onClick={() => onPick(it.id)}>
            <div className="swatch" style={{ background: it.css }} />
            <div className="meta">
              <div className="name">{it.name}</div>
              <div className="tag">{it.tag}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
