// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import MonthPicker from './MonthPicker';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const TODAY = '2026-09-24';

let root: Root | null = null;

afterEach(() => {
  act(() => root?.unmount());
  root = null;
  document.body.innerHTML = '';
});

function draw(value: string | null, onChange: (value: string | null) => void) {
  const container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
  act(() => root!.render(<MonthPicker value={value} onChange={onChange} today={TODAY} />));
  return {
    month: container.querySelector<HTMLSelectElement>('select[aria-label="Mes"]')!,
    year: container.querySelector<HTMLSelectElement>('select[aria-label="Año"]')!,
    clear: container.querySelector<HTMLButtonElement>('button[aria-label="Quitar fecha"]'),
  };
}

function pick(select: HTMLSelectElement, value: string) {
  act(() => {
    select.value = value;
    select.dispatchEvent(new Event('change', { bubbles: true }));
  });
}

describe('MonthPicker', () => {
  it('reads a month as its name and its year', () => {
    const { month, year } = draw('2027-03', () => {});
    expect(month.selectedOptions[0].textContent).toBe('marzo');
    expect(year.value).toBe('2027');
  });

  it('gives a month picked first its soonest year', () => {
    const onChange = vi.fn();
    const { month } = draw(null, onChange);
    pick(month, '11');
    expect(onChange).toHaveBeenLastCalledWith('2026-11');
    pick(month, '3');
    expect(onChange).toHaveBeenLastCalledWith('2027-03');
  });

  it('holds a year picked first until its month is', () => {
    const onChange = vi.fn();
    const { month, year } = draw(null, onChange);
    pick(year, '2028');
    expect(onChange).not.toHaveBeenCalled();
    pick(month, '2');
    expect(onChange).toHaveBeenLastCalledWith('2028-02');
  });

  it('changes one half of a month it holds', () => {
    const onChange = vi.fn();
    const { month, year } = draw('2027-03', onChange);
    pick(year, '2029');
    expect(onChange).toHaveBeenLastCalledWith('2029-03');
    pick(month, '12');
    expect(onChange).toHaveBeenLastCalledWith('2027-12');
  });

  it('offers a year out of range when it holds one', () => {
    const { year } = draw('2045-06', () => {});
    expect([...year.options].map((o) => o.value)).toContain('2045');
  });

  it('is cleared by its cross, which only shows while there is a month', () => {
    expect(draw(null, () => {}).clear).toBeNull();
    act(() => root?.unmount());
    const onChange = vi.fn();
    const { clear } = draw('2027-03', onChange);
    act(() => clear!.click());
    expect(onChange).toHaveBeenLastCalledWith(null);
  });
});
