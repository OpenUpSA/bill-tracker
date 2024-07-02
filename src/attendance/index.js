import React from "react";
import { createRoot } from "react-dom/client";

import Attendance from "../components/attendance";

import "../app.scss";

function App() {
  const [state, setState] = React.useState("Hello, world!");
  const [counter, setCounter] = React.useState(0);

  return <Attendance />;
}

const container = document.getElementById("root");
const root = createRoot(container);
root.render(<App />);
