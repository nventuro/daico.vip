import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import GroupField from './GroupField';

function render(groups: string[], value: string, optional = false): string {
  return renderToStaticMarkup(
    <GroupField groups={groups} value={value} optional={optional} onChange={() => {}} />,
  );
}

describe('the group chip', () => {
  it('offers the groups there are, the entry’s own chosen, and a new one last', () => {
    const html = render(['casa', 'películas'], 'casa');
    expect(html).toContain('aria-label="Grupo"');
    expect(html).toContain(
      '<option value="0" selected="">casa</option><option value="1">películas</option><option value="new">Nuevo grupo…</option>',
    );
    expect(html).not.toContain('Sin grupo');
    expect(html).not.toContain('Nombre del grupo');
  });

  it('opens the name field for a group that is not there yet', () => {
    const html = render(['casa'], 'jardín');
    expect(html).not.toContain('<select');
    expect(html).toContain('placeholder="Nombre del grupo"');
  });

  it('offers no group first for an entry that may have none, chosen while it has none', () => {
    const html = render(['casa'], '', true);
    expect(html).toContain(
      '<option value="none" selected="">Sin grupo</option><option value="0">casa</option><option value="new">Nuevo grupo…</option>',
    );
    expect(html).not.toContain('Nombre del grupo');
  });

  it('still offers a new group while there is none at all', () => {
    const html = render([], '', true);
    expect(html).toContain(
      '<option value="none" selected="">Sin grupo</option><option value="new">Nuevo grupo…</option>',
    );
  });
});
