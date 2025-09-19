import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import EventModal from '../components/EventModal.tsx';

describe('EventModal', () => {
  it('renders and calls acknowledge', () => {
    const fn = vi.fn();
    const r = render(<EventModal open eventType="LAYOFF" onAcknowledge={fn} />);
    r.getByText(/random resource will be removed/i);
    r.getByRole('button', { name: /acknowledge/i }).click();
    expect(fn).toHaveBeenCalledTimes(1);
  });
});