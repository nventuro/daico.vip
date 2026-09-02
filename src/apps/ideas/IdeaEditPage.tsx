import { useNavigate } from 'react-router-dom';
import EntryPage from '../../components/EntryPage';
import { useEntry } from '../../hooks/useEntry';
import { appPath, entryPath } from '../types';
import IdeaForm from './IdeaForm';
import { groupNames } from './grouping';
import { useIdeas, type IdeaInput } from './useIdeas';

export default function IdeaEditPage() {
  const { items, loading, error, save, remove } = useIdeas();
  const idea = useEntry(items);
  const navigate = useNavigate();

  return (
    <EntryPage entry={idea} loading={loading} error={error} missing="Idea no encontrada.">
      {(idea) => (
        <IdeaForm
          key={idea.id}
          idea={idea}
          start={{ title: idea.title, group_name: idea.group_name, body: idea.body }}
          groups={groupNames(items)}
          onSave={async (input: IdeaInput) => {
            await save(idea.id, input);
            navigate(entryPath('ideas', idea.id));
          }}
          onRemove={async () => {
            await remove(idea.id);
            navigate(appPath('ideas'));
          }}
        />
      )}
    </EntryPage>
  );
}
