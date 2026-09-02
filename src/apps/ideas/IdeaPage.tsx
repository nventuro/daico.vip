import { IconFolder, IconPencil } from '@tabler/icons-react';
import AttachmentGrid from '../../components/AttachmentGrid';
import { StaticChip } from '../../components/Chip';
import EntryPage from '../../components/EntryPage';
import Heading from '../../components/Heading';
import IconButton from '../../components/IconButton';
import Markdown from '../../components/markdown/Markdown';
import SectionLabel from '../../components/SectionLabel';
import { useEntry } from '../../hooks/useEntry';
import { relativeDayTime, todayIso } from '../../utils/dateUtils';
import { entryPath } from '../types';
import { useIdeas } from './useIdeas';

export default function IdeaPage() {
  const { items, loading, error } = useIdeas();
  const idea = useEntry(items);

  return (
    <EntryPage entry={idea} loading={loading} error={error} missing="Idea no encontrada.">
      {(idea) => (
        <article className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-col gap-0.5">
              <Heading>{idea.title}</Heading>
              <span className="text-xs text-muted">
                Editada {relativeDayTime(todayIso(), idea.updated_at)}
              </span>
            </div>
            <IconButton
              label="Editar idea"
              icon={IconPencil}
              to={entryPath('ideas', idea.id, 'editar')}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <StaticChip>
              <IconFolder size={16} stroke={1.5} />
              {idea.group_name}
            </StaticChip>
          </div>

          {idea.body.trim() ? (
            <div className="text-on-surface">
              <Markdown body={idea.body} />
            </div>
          ) : (
            <p className="text-muted">Todavía sin detalle.</p>
          )}

          <div>
            <SectionLabel>Adjuntos</SectionLabel>
            <AttachmentGrid
              owner={{ kind: 'idea', id: idea.id }}
              ownerPath={entryPath('ideas', idea.id)}
            />
          </div>
        </article>
      )}
    </EntryPage>
  );
}
