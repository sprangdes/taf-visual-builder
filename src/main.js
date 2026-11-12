import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import ReactDOM from 'react-dom/client';
import TafBuilder from './TafBuilder';
import { LanguageProvider } from './features/i18n/LanguageProvider';
import './index.css';
ReactDOM.createRoot(document.getElementById('root')).render(_jsx(React.StrictMode, { children: _jsx(LanguageProvider, { children: _jsx(TafBuilder, {}) }) }));
