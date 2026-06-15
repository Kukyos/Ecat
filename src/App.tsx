import { NavLink, Outlet, useLocation } from "react-router-dom";

const CRUMB: Record<string, string> = {
  "/catalogue": "Catalogue",
  "/cabin": "Cabin Configurator",
  "/shaft": "Shaft Visualizer",
};

export default function App() {
  const loc = useLocation();
  const crumb = CRUMB[loc.pathname] ?? "";
  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand">
          <b>BLACKSTONE</b>
          <span style={{ color: "var(--ink-dim)" }}>ELEVATORS</span>
        </div>
        <div className="crumb">{crumb}</div>
      </header>
      <main className="main">
        <Outlet />
      </main>
      <nav className="tabs">
        <NavTab to="/catalogue" label="Catalogue" />
        <NavTab to="/cabin" label="Cabin" />
        <NavTab to="/shaft" label="Shaft" />
      </nav>
    </div>
  );
}

function NavTab({ to, label }: { to: string; label: string }) {
  return (
    <NavLink to={to} end className={({ isActive }) => (isActive ? "active" : "")}>
      {label}
    </NavLink>
  );
}
