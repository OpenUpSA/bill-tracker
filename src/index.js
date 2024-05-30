import React from 'react';
import { createRoot } from 'react-dom/client';

import BillTracker from './components/BillTracker';

import './app.scss';



function App() {
  const [state, setState] = React.useState("Hello, world!");
  const [counter, setCounter] = React.useState(0); 

  return (
    <BillTracker />
  );
}

const container = document.getElementById('root');
const root = createRoot(container); 
root.render(<App />);