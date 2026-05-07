import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { TrendDeltaPill } from './TrendDeltaPill';

describe('TrendDeltaPill', () => {
  it('returns null when delta is null', () => {
    const { container } = render(
      <TrendDeltaPill delta={null} unit="kg" decimals={1} comparisonLabel="vs. período anterior" />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('shows +1,2 kg with ArrowUp when delta is +1.2', () => {
    render(
      <TrendDeltaPill
        delta={1.2}
        unit="kg"
        decimals={1}
        comparisonLabel="vs. período anterior"
      />,
    );
    expect(screen.getByRole('status')).toHaveTextContent('+1,2 kg');
    expect(screen.getByTestId('delta-arrow-up')).toBeInTheDocument();
  });

  it('shows -0,5 kg with ArrowDown when delta is -0.5', () => {
    render(
      <TrendDeltaPill
        delta={-0.5}
        unit="kg"
        decimals={1}
        comparisonLabel="vs. período anterior"
      />,
    );
    expect(screen.getByRole('status')).toHaveTextContent('-0,5 kg');
    expect(screen.getByTestId('delta-arrow-down')).toBeInTheDocument();
  });

  it('shows 0 bpm with Minus icon when delta is 0', () => {
    render(
      <TrendDeltaPill delta={0} unit="bpm" decimals={0} comparisonLabel="vs. período anterior" />,
    );
    expect(screen.getByRole('status')).toHaveTextContent('0 bpm');
    expect(screen.getByTestId('delta-arrow-neutral')).toBeInTheDocument();
  });

  it('renders comparisonLabel inside the pill', () => {
    render(
      <TrendDeltaPill
        delta={1.2}
        unit="kg"
        decimals={1}
        comparisonLabel="vs. período anterior"
      />,
    );
    expect(screen.getByRole('status')).toHaveTextContent('vs. período anterior');
  });

  it('has role="status" and aria-label with Variação prefix', () => {
    render(
      <TrendDeltaPill
        delta={1.2}
        unit="kg"
        decimals={1}
        comparisonLabel="vs. período anterior"
      />,
    );
    const pill = screen.getByRole('status');
    expect(pill).toBeInTheDocument();
    const ariaLabel = pill.getAttribute('aria-label') ?? '';
    expect(ariaLabel).toMatch(/Variação:/);
    expect(ariaLabel).toContain('+1,2 kg');
  });

  it('applies only muted classes when direction is neutral', () => {
    render(
      <TrendDeltaPill
        delta={1.2}
        unit="kg"
        decimals={1}
        comparisonLabel="vs. período anterior"
        direction="neutral"
      />,
    );
    const pill = screen.getByRole('status');
    expect(pill.className).toContain('bg-muted');
    expect(pill.className).toContain('text-muted-foreground');
    expect(pill.className).not.toContain('emerald');
    expect(pill.className).not.toContain('rose');
  });
});
