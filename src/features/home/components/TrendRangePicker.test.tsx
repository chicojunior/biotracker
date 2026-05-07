import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TrendRangePicker } from './TrendRangePicker';

describe('TrendRangePicker', () => {
  it('renders three options with pt-BR labels', () => {
    render(<TrendRangePicker value="7d" onChange={vi.fn()} />);

    expect(screen.getByText('7 dias')).toBeVisible();
    expect(screen.getByText('30 dias')).toBeVisible();
    expect(screen.getByText('90 dias')).toBeVisible();
  });

  it('marks the selected option with aria-pressed="true" and others with "false"', () => {
    render(<TrendRangePicker value="30d" onChange={vi.fn()} />);

    expect(screen.getByText('7 dias').closest('button')).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByText('30 dias').closest('button')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('90 dias').closest('button')).toHaveAttribute('aria-pressed', 'false');
  });

  it('calls onChange with "7d" exactly once when clicking "7 dias"', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<TrendRangePicker value="30d" onChange={onChange} />);

    await user.click(screen.getByText('7 dias'));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('7d');
  });

  it('calls onChange with "90d" when clicking "90 dias"', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<TrendRangePicker value="7d" onChange={onChange} />);

    await user.click(screen.getByText('90 dias'));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('90d');
  });
});
