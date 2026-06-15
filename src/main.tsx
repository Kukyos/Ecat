import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import App from "./App";
import Catalogue from "./pages/Catalogue";
import Cabin from "./pages/Cabin";
import Shaft from "./pages/Shaft";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HashRouter>
      <Routes>
        <Route path="/" element={<App />}>
          <Route index element={<Navigate to="/catalogue" replace />} />
          <Route path="catalogue" element={<Catalogue />} />
          <Route path="cabin" element={<Cabin />} />
          <Route path="shaft" element={<Shaft />} />
        </Route>
      </Routes>
    </HashRouter>
  </StrictMode>,
);
