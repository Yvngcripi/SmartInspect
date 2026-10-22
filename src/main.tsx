import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Register Service Worker for offline-first support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => console.log('Service Worker registrado con éxito:', reg.scope))
      .catch((err) => console.error('Fallo al registrar Service Worker:', err));
  });
}

// Global crash recovery logger
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

const logCrashToFile = async (errorText: string) => {
  console.error('Crash Logger:', errorText);
  if (!Capacitor.isNativePlatform()) return;
  try {
    await Filesystem.appendFile({
      path: 'asesorias_el_trebol_crash_log.txt',
      data: `[${new Date().toLocaleString()}] ${errorText}\n-----------------------\n`,
      directory: Directory.Documents,
      encoding: Encoding.UTF8
    });
  } catch (e) {
    console.error('Failed to write crash log to device:', e);
  }
};

window.onerror = (message, source, lineno, colno, error) => {
  const msg = `CRASH: ${message}\nSource: ${source}\nLine: ${lineno}:${colno}\nStack: ${error?.stack}`;
  logCrashToFile(msg);
  return false;
};

window.addEventListener('unhandledrejection', (event) => {
  const msg = `UNHANDLED REJECTION: ${event.reason}\nStack: ${event.reason?.stack || 'No stack trace'}`;
  logCrashToFile(msg);
});
