import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App.jsx";
import PathDeep from "./PathDeep.jsx";
import CreationDeep from "./CreationDeep.jsx";
import LivingNetworkDeep from "./LivingNetworkDeep.jsx";
import SeekerPage from "./SeekerPage.jsx";
import FacilitatorPage from "./FacilitatorPage.jsx";
import ContainerPage from "./ContainerPage.jsx";
import ContainerApply from "./ContainerApply.jsx";
import FacilitatorApply from "./FacilitatorApply.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/path" element={<PathDeep />} />
        <Route path="/creation" element={<CreationDeep />} />
        <Route path="/living-network" element={<LivingNetworkDeep />} />
        <Route path="/seeker" element={<SeekerPage />} />
        <Route path="/facilitator" element={<FacilitatorPage />} />
        <Route path="/container" element={<ContainerPage />} />
        <Route path="/apply/container" element={<ContainerApply />} />
        <Route path="/apply/facilitator" element={<FacilitatorApply />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
