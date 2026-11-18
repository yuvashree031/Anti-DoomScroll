import React from 'react';
import ReactDOM from 'react-dom/client';
import { Popup } from './Popup';
import '../index.css';

const rootElement = document.getElementById('root');

if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <Popup />
    </React.StrictMode>
  );
} else {
  console.error('[Anti-Doomscroll] Failed to locate popup root element.');
}
