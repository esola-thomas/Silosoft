// Entry point (T056) - mounts React app
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { GameProvider } from './services/gameContext.tsx';
import { ToastProvider } from './services/toastContext.tsx';
import App from './pages/App.tsx';
import './styles/theme.css';
import { initTheme } from './services/themeManager.ts';
import { initMotion } from './services/motionManager.ts';

// Apply persisted theme before first paint (best-effort)
try {
  initTheme();
  const pref = initMotion();
  // Debug: ensure animations visible even if system reduced-motion; can remove later
  if (pref === 'system') {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq.matches) {
      document.documentElement.setAttribute('data-motion','on');
    }
  }
} catch {/* ignore */}

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <StrictMode>
      <GameProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </GameProvider>
    </StrictMode>
  );
}
