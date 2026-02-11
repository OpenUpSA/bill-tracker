import React from "react";
import { createRoot } from "react-dom/client";

import Attendance2 from "../components/attendance2";

import "../app.scss";

function App() {
  return <Attendance2 />;
}

const container = document.getElementById("root");
const root = createRoot(container);
root.render(<App />);
