import React, { useEffect, useState } from 'react';

// Simple orientation / aspect ratio hint for very narrow portrait layouts.
// Shows once when aspect ratio is tall (height > width by threshold) and width < 720px.
// Dismiss persists in sessionStorage to avoid repeat annoyance per session.
export default function OrientationHint() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const DISMISS_KEY = 'orientationHintDismissed';
    function evaluate() {
      if (sessionStorage.getItem(DISMISS_KEY) === '1') { setShow(false); return; }
      const w = window.innerWidth;
      const h = window.innerHeight;
      const portrait = h > w * 1.1; // slightly taller than wide
      if (portrait && w < 720) setShow(true); else setShow(false);
    }
    evaluate();
    window.addEventListener('resize', evaluate);
    window.addEventListener('orientationchange', evaluate);
    return () => {
      window.removeEventListener('resize', evaluate);
      window.removeEventListener('orientationchange', evaluate);
    };
  }, []);
  function dismiss() {
    try { sessionStorage.setItem('orientationHintDismissed', '1'); } catch {/* ignore */}
    setShow(false);
  }
  if (!show) return null;
  return (
    <div className="orientation-hint" role="dialog" aria-label="Orientation Hint">
      <div className="orientation-hint-inner">
        <h4>Best Played Landscape</h4>
        <p>
          Rotate your device or widen the window for a clearer multi-player board view. You can still play in portrait; some panels stack.
        </p>
        <button type="button" onClick={dismiss} className="btn small" aria-label="Dismiss orientation hint">Got it</button>
      </div>
    </div>
  );
}
