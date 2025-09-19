// Theme manager: handles applying and persisting theme selections
export type ThemeName = 'dark' | 'light' | 'hc';

const THEME_KEY = 'silosoft.theme';
const ORDER: ThemeName[] = ['dark', 'light', 'hc'];

export function initTheme(): ThemeName {
  let stored: any = undefined;
  try { stored = localStorage.getItem(THEME_KEY) as ThemeName | null; } catch {/* ignore */}
  const theme: ThemeName = stored && isTheme(stored) ? stored : 'dark';
  applyTheme(theme);
  return theme;
}

export function applyTheme(name: ThemeName) {
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.theme = name;
  }
}

export function setTheme(name: ThemeName) {
  try { localStorage.setItem(THEME_KEY, name); } catch {/* ignore */}
  applyTheme(name);
}

export function cycleTheme(current: ThemeName): ThemeName {
  const idx = ORDER.indexOf(current);
  const next = ORDER[(idx + 1) % ORDER.length];
  setTheme(next);
  return next;
}

export function getCurrentTheme(): ThemeName {
  if (typeof document === 'undefined') return 'dark';
  const dt = document.documentElement.dataset.theme;
  return isTheme(dt) ? dt : 'dark';
}

function isTheme(t: any): t is ThemeName {
  return t === 'dark' || t === 'light' || t === 'hc';
}
