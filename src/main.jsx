// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import App from "./App";
import Outbound from "./pages/Outbound";
import Inbound from "./pages/Inbound";
import Residency from "./pages/Residency";
import Providers from "./pages/Providers";
import Audit from "./pages/Audit";
import Settings from "./pages/Settings";

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />}>
        <Route path="outbound" element={<Outbound />} />
        <Route path="inbound" element={<Inbound />} />
        <Route path="residency" element={<Residency />} />
        <Route path="providers" element={<Providers />} />
        <Route path="audit" element={<Audit />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  </BrowserRouter>
);
