import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// Minimal inline component example (would normally import from src/components)
const HeaderBar: React.FC<{ turn: number; total: number }> = ({ turn, total }) => (
  <header aria-label="game header">
    <h1>Silosoft</h1>
    <div role="status">Turn {turn} / {total}</div>
  </header>
);

describe('HeaderBar component', () => {
  it('renders title and turn progress', () => {
    render(<HeaderBar turn={3} total={10} />);
    expect(screen.getByRole('heading', { name: 'Silosoft' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Turn 3 / 10');
  });
});