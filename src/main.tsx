import React from 'react';
import ReactDOM from 'react-dom/client';
import TafBuilder from './TafBuilder';
import { LanguageProvider } from './features/i18n/LanguageProvider';
import { MotionProvider } from './features/motion/MotionProvider';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LanguageProvider>
      <MotionProvider>
        <TafBuilder />
      </MotionProvider>
    </LanguageProvider>
  </React.StrictMode>
);
