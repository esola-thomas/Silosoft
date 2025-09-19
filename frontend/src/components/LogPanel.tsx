// LogPanel (T065 placeholder)
import { useGame } from '../services/gameContext.tsx';
import type { HTMLAttributes } from 'react';

interface LogPanelProps extends HTMLAttributes<HTMLDivElement> {}
export default function LogPanel(props: LogPanelProps) {
  const { log } = useGame();
  const entries = log.slice(-50);
  return (
    <div {...props} className={(props.className? props.className + ' ': '') + 'log-panel'}>
      <h4>Log</h4>
      <ul className="log-entries">
        {entries.map((l, i) => (
          <li key={i}>{truncate(JSON.stringify(l), 140)}</li>
        ))}
      </ul>
    </div>
  );
}

function truncate(str: string, max: number) {
  return str.length > max ? str.slice(0, max - 1) + '…' : str;
}