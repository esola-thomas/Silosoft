// motionManager: user + system reduced-motion preference handling
export type MotionPref = 'on' | 'off' | 'system';
const KEY = 'silosoft.motion';

export function initMotion(): MotionPref {
  let stored: any = undefined;
  try { stored = localStorage.getItem(KEY); } catch {/* ignore */}
  const pref: MotionPref = isPref(stored) ? stored : 'system';
  apply(pref);
  return pref;
}

export function cycleMotion(current: MotionPref): MotionPref {
  const order: MotionPref[] = ['system','on','off'];
  const next = order[(order.indexOf(current) + 1) % order.length];
  setMotion(next); return next;
}

// Convenience helper (optional) to force-enable motion for debugging animations
export function forceMotionOn() {
  try { localStorage.setItem(KEY,'on'); } catch {/* ignore */}
  apply('on');
}

export function setMotion(pref: MotionPref) {
  try { localStorage.setItem(KEY, pref); } catch {/* ignore */}
  apply(pref);
}

function apply(pref: MotionPref) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (pref === 'system') {
    root.removeAttribute('data-motion');
  } else if (pref === 'off') {
    root.setAttribute('data-motion','off');
  } else {
    root.setAttribute('data-motion','on');
  }
}

export function getMotion(): MotionPref {
  if (typeof document === 'undefined') return 'system';
  const attr = document.documentElement.getAttribute('data-motion');
  if (!attr) return 'system';
  if (attr === 'off') return 'off';
  return 'on';
}

function isPref(v: any): v is MotionPref { return v === 'on' || v === 'off' || v === 'system'; }
