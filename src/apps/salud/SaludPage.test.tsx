// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import type { Checkup, HealthRecord, Member } from '../../lib/offline/specs';
import { rememberViewed, rememberedViewed } from '../../lib/viewedMember';

// The DOM here draws a <dialog> but cannot open one; the kind question opens
// as a modal, so it is given the move it makes.
if (!('showModal' in HTMLDialogElement.prototype)) {
  Object.assign(HTMLDialogElement.prototype, {
    showModal(this: HTMLDialogElement) {
      this.open = true;
    },
  });
}
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const STAMPS = { created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' };

function member(id: string, display_name: string, email: string | null): Member {
  return { id, email, display_name, ...STAMPS };
}

function checkup(title: string, memberId: string): Checkup {
  return {
    id: title,
    member_id: memberId,
    title,
    comments: null,
    due_on: null,
    last_done_on: null,
    repeat_every: null,
    repeat_unit: null,
    ...STAMPS,
  };
}

function record(title: string, memberId: string): HealthRecord {
  return { id: title, member_id: memberId, title, on_date: '2026-09-01', ...STAMPS };
}

const ME = member('m1', 'yo', 'member@example.com');
const OTHER = member('m2', 'otro', 'other@example.com');
const MICHI = member('p1', 'michi', null);

// What the store gives back, set per test before the page is mounted.
const state: { checkups: Checkup[]; records: HealthRecord[]; members: Member[] } = {
  checkups: [],
  records: [],
  members: [],
};
const addCheckup = vi.fn(() => Promise.resolve('nuevo'));
const addRecord = vi.fn(() => Promise.resolve('nuevo'));

vi.mock('./useCheckups', () => ({
  useCheckups: () => ({
    items: state.checkups,
    loading: false,
    error: null,
    add: addCheckup,
    mark: vi.fn(),
    unmark: vi.fn(),
    restore: vi.fn(),
  }),
}));
vi.mock('./useHealthRecords', () => ({
  useHealthRecords: () => ({ items: state.records, loading: false, error: null, add: addRecord }),
}));
vi.mock('../../hooks/useMembers', () => ({
  useMembers: () => ({ items: state.members, loading: false }),
}));
vi.mock('../../hooks/useSession', () => ({
  useSession: () => ({ user: { id: 'u1', email: 'member@example.com' } }),
}));
vi.mock('../../hooks/useAttachments', () => ({
  useAttachments: () => ({ items: [], loading: false, error: null }),
  ownersWithAttachments: () => new Set<string>(),
}));

const { default: SaludPage } = await import('./SaludPage');

let root: Root | null = null;
let container: HTMLDivElement;

function mount(): void {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root?.render(
      <MemoryRouter initialEntries={['/salud']}>
        <SaludPage />
      </MemoryRouter>,
    );
  });
}

afterEach(() => {
  act(() => root?.unmount());
  root = null;
  container.remove();
  localStorage.clear();
  addCheckup.mockClear();
  addRecord.mockClear();
});

/** The chips over the list, in the order they are drawn. */
function chips(): HTMLButtonElement[] {
  return [...container.querySelectorAll<HTMLButtonElement>('[aria-label="De quién"] button')];
}

function chipNames(): string[] {
  return chips().map((chip) => chip.textContent);
}

function chosen(): string[] {
  return chips()
    .filter((chip) => chip.getAttribute('aria-pressed') === 'true')
    .map((chip) => chip.textContent);
}

function tap(element: Element): void {
  act(() => {
    element.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
}

function listed(): string {
  return container.textContent;
}

describe('SaludPage', () => {
  it('draws a chip per member this device may show, the signed-in one first and chosen', () => {
    state.members = [OTHER, MICHI, ME];
    state.checkups = [];
    state.records = [];
    mount();
    expect(chipNames()).toEqual(['yo', 'michi']);
    expect(chosen()).toEqual(['yo']);
  });

  it('draws the chips even for a household of one, so the page reads the same', () => {
    state.members = [ME];
    state.checkups = [];
    state.records = [];
    mount();
    expect(chipNames()).toEqual(['yo']);
  });

  it("lists the viewed member's rows and nobody else's, in both sections", () => {
    state.members = [ME, MICHI];
    state.checkups = [checkup('dentista', 'm1'), checkup('antirrábica', 'p1')];
    state.records = [record('análisis', 'm1'), record('vacuna', 'p1')];
    mount();
    expect(listed()).toContain('dentista');
    expect(listed()).toContain('análisis');
    expect(listed()).not.toContain('antirrábica');
    expect(listed()).not.toContain('vacuna');
  });

  it('switches the rows with the chip, and remembers the choice for next time', () => {
    state.members = [ME, MICHI];
    state.checkups = [checkup('dentista', 'm1'), checkup('antirrábica', 'p1')];
    state.records = [record('análisis', 'm1'), record('vacuna', 'p1')];
    mount();
    tap(chips()[1]);
    expect(chosen()).toEqual(['michi']);
    expect(listed()).toContain('antirrábica');
    expect(listed()).toContain('vacuna');
    expect(listed()).not.toContain('dentista');
    expect(listed()).not.toContain('análisis');
    expect(rememberedViewed()).toBe('p1');
  });

  it('opens on the member last viewed', () => {
    state.members = [ME, MICHI];
    state.checkups = [];
    state.records = [];
    rememberViewed('p1');
    mount();
    expect(chosen()).toEqual(['michi']);
  });

  it('opens on the signed-in member when the one remembered can no longer be shown', () => {
    state.members = [ME, MICHI];
    state.checkups = [];
    state.records = [];
    rememberViewed('m2');
    mount();
    expect(chosen()).toEqual(['yo']);
    expect(rememberedViewed()).toBe('m1');
  });

  it('says the list is empty of the viewed member, not of everyone', () => {
    state.members = [ME, MICHI];
    state.checkups = [checkup('antirrábica', 'p1')];
    state.records = [];
    mount();
    expect(listed()).toContain('Todavía no hay pendientes ni resultados.');
    tap(chips()[1]);
    expect(listed()).not.toContain('Todavía no hay');
  });

  it('gives the + the member being viewed, once the kind is answered', async () => {
    state.members = [ME, MICHI];
    state.checkups = [];
    state.records = [];
    mount();
    tap(chips()[1]);

    const input = container.querySelector<HTMLInputElement>(
      'input[aria-label="Nuevo pendiente o resultado"]',
    );
    const form = input?.form;
    if (!input || !form) throw new Error('the bar is not drawn');
    act(() => {
      // React reads what was typed through the element's own setter.
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set?.call(
        input,
        'antirrábica',
      );
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    act(() => form.requestSubmit());

    const answer = [...document.querySelectorAll<HTMLButtonElement>('dialog button')].find(
      (button) => button.textContent === 'Pendiente',
    );
    if (!answer) throw new Error('the kind was not asked');
    await act(async () => {
      answer.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      // The page moves on to the new entry once the add has resolved.
      await addCheckup.mock.results[0]?.value;
    });

    expect(addCheckup).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'antirrábica' }),
      'p1',
    );
    expect(addRecord).not.toHaveBeenCalled();
  });
});
