import React from 'react';
import { createRoot } from 'react-dom/client';

import BRRRDashboard from '../components/brrr';

import '../app.scss';

function App() {
  return (
    <BRRRDashboard />
  );
}

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);
