import React from 'react';
import { createRoot } from 'react-dom/client';

import Overview from './components/overview';

import './app.scss';

function App() {
  return (
    <Overview />
  );
}

const container = document.getElementById('root');
const root = createRoot(container); 
root.render(<App />);