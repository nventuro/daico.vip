import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import GroupField from './GroupField';

function render(groups: string[], value: string): string {
  return renderToStaticMarkup(<GroupField groups={groups} value={value} onChange={() => {}} />);
}

describe('the group field', () => {
  it('offers the groups there are, in the order given, and a new one last', () => {
    const html = render(['casa', 'películas'], 'películas');
    expect(html).toContain(
      '<option value="0">casa</option><option value="1" selected="">películas</option><option value="new">Nuevo grupo…</option>',
    );
    expect(html).not.toContain('Nombre del grupo');
  });

  it('opens the name field for a group that is not there yet', () => {
    const html = render(['casa'], '');
    expect(html).toContain('<option value="new" selected="">');
    expect(html).toContain('placeholder="Nombre del grupo"');
  });

  it('is only the name field while there is no group to choose from', () => {
    const html = render([], '');
    expect(html).not.toContain('<select');
    expect(html).toContain('placeholder="Nombre del grupo"');
  });
});

describe('the group field as a chip', () => {
  it('offers the groups there are on the chip, the entry’s own chosen, and a new one last', () => {
    const html = renderToStaticMarkup(
      <GroupField groups={['casa', 'películas']} value="casa" onChange={() => {}} look="chip" />,
    );
    expect(html).toContain('aria-label="Grupo"');
    expect(html).toContain(
      '<option value="0" selected="">casa</option><option value="1">películas</option><option value="new">Nuevo grupo…</option>',
    );
    expect(html).not.toContain('Nombre del grupo');
  });
});
