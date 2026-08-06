import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import AlgorithmLab from "../app/AlgorithmLab";
import "../app/globals.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AlgorithmLab />
  </StrictMode>,
);
