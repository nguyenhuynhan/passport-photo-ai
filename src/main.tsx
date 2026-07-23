import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Filter out expected non-critical WASM/TFLite informational logs to keep console pristine
if (typeof window !== 'undefined') {
  const isIgnoredMessage = (msg: unknown) => {
    if (typeof msg === 'string') {
      return (
        msg.includes('TensorFlow Lite XNNPACK delegate') ||
        msg.includes('Created TensorFlow Lite') ||
        msg.includes('wasm streaming compile failed') ||
        msg.includes('falling back to ArrayBuffer instantiation') ||
        msg.includes('failed to asynchronously prepare wasm') ||
        msg.includes('Không khởi tạo được GPU delegate') ||
        msg.includes('Không thể tải WASM cục bộ')
      );
    }
    return false;
  };

  const origInfo = console.info;
  console.info = (...args: unknown[]) => {
    if (args.some(isIgnoredMessage)) return;
    origInfo.apply(console, args);
  };

  const origWarn = console.warn;
  console.warn = (...args: unknown[]) => {
    if (args.some(isIgnoredMessage)) return;
    origWarn.apply(console, args);
  };

  const origError = console.error;
  console.error = (...args: unknown[]) => {
    origError.apply(console, args);
  };

  const origLog = console.log;
  console.log = (...args: unknown[]) => {
    if (args.some(isIgnoredMessage)) return;
    origLog.apply(console, args);
  };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

