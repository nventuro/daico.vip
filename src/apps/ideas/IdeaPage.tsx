import { useState } from 'react';
import AttachmentGrid from '../../components/AttachmentGrid';
import DeleteDialog from '../../components/DeleteDialog';
import Body from '../../components/editor/Body';
import EntryHead from '../../components/EntryHead';
import EntryPage from '../../components/EntryPage';
import GroupField from '../../components/GroupField';
import SectionLabel from '../../components/SectionLabel';
import { useAttachments } from '../../hooks/useAttachments';
import { useEntry } from '../../hooks/useEntry';
import { useLeave } from '../../hooks/useLeave';
import { useTextSave } from '../../hooks/useTextSave';
import { relativeDayTime, todayIso } from '../../utils/dateUtils';
import { lowercaseTrimmed } from '../../utils/textUtils';
import { appPath, entryPath } from '../types';
import { groupNames } from './grouping';
import { useIdeas } from './useIdeas';

/** An idea, read and written on the same page: the title on blur, the group
 *  on the pick, the body a moment after typing stops and on leaving. */
export default function IdeaPage() {
  const { items, loading, error, save, remove } = useIdeas();
  const idea = useEntry(items);
  const attachments = useAttachments({ kind: 'idea', id: idea?.id ?? '' });
  const leave = useLeave();
  const [deleting, setDeleting] = useState(false);

  const bodySave = useTextSave(async (body) => {
    if (idea) await save(idea.id, { body });
  });

  async function removeIdea(id: string) {
    // The idea's pictures go with it; nothing else would ever list them.
    await attachments.removeAll();
    await remove(id);
    leave(appPath('ideas'));
  }

  return (
    <EntryPage entry={idea} loading={loading} error={error} missing="Idea no encontrada.">
      {(idea) => (
        <article key={idea.id} className="flex flex-col gap-4">
          <EntryHead
            title={idea.title}
            onTitle={(title) => void save(idea.id, { title })}
            subtitle={`Editada ${relativeDayTime(todayIso(), idea.updated_at)}`}
            chips={
              <GroupField
                groups={groupNames(items)}
                value={idea.group_name}
                optional
                onChange={(group) => void save(idea.id, { group_name: lowercaseTrimmed(group) })}
              />
            }
            onDelete={() => setDeleting(true)}
            deleteLabel="Eliminar idea"
          />

          <Body
            value={idea.body}
            onChange={bodySave.onChange}
            placeholder="Contenido"
            ariaLabel="Contenido"
          />

          <div>
            <SectionLabel>Adjuntos</SectionLabel>
            <AttachmentGrid
              owner={{ kind: 'idea', id: idea.id }}
              ownerPath={entryPath('ideas', idea.id)}
            />
          </div>

          <DeleteDialog
            open={deleting}
            question="¿Eliminar la idea?"
            onCancel={() => setDeleting(false)}
            onConfirm={() => void removeIdea(idea.id)}
          />
        </article>
      )}
    </EntryPage>
  );
}
