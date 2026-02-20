import React from 'react';
import { createRoot } from 'react-dom/client';

import QuestionsExplorer from '../components/questions';

import '../app.scss';

function App() {
  return (
    <QuestionsExplorer />
  );
}

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);
