import React from "react";
import { createRoot } from "react-dom/client";

import BillTracker from "../components/billtracker";

import "../app.scss";

function App() {
  return <BillTracker />;
}

const container = document.getElementById("root");
const root = createRoot(container);
root.render(<App />);
