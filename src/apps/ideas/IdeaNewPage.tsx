import ErrorLine from '../../components/ErrorLine';
import SkeletonRows from '../../components/SkeletonRows';
import { useDraftTitle } from '../../hooks/useDraftTitle';
import { useLeave } from '../../hooks/useLeave';
import { entryPath } from '../types';
import IdeaForm from './IdeaForm';
import { groupNames, lastEditedGroup } from './grouping';
import { useIdeas, type IdeaInput } from './useIdeas';

export default function IdeaNewPage() {
  const { items, loading, error, add } = useIdeas();
  const leave = useLeave();
  const title = useDraftTitle();

  // The groups an idea can join come from the ideas there are: the form waits
  // for them, or it would open with none to choose from.
  if (loading) return <SkeletonRows />;

  return (
    <>
      <ErrorLine error={error} className="mb-4" />
      <IdeaForm
        start={{ title, group_name: lastEditedGroup(items) ?? '', body: '' }}
        groups={groupNames(items)}
        onSave={async (input: IdeaInput) => {
          const id = await add(input);
          if (id) leave(entryPath('ideas', id));
        }}
      />
    </>
  );
}
