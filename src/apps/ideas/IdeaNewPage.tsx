import { useNavigate } from 'react-router-dom';
import ErrorLine from '../../components/ErrorLine';
import SkeletonRows from '../../components/SkeletonRows';
import { useDraftTitle } from '../../hooks/useDraftTitle';
import { appPath } from '../types';
import IdeaForm from './IdeaForm';
import { groupNames, lastEditedGroup } from './grouping';
import { useIdeas, type IdeaInput } from './useIdeas';

export default function IdeaNewPage() {
  const { items, loading, error, add } = useIdeas();
  const navigate = useNavigate();
  const title = useDraftTitle();

  // The groups an idea can join come from the ideas there are: the form waits
  // for them, or it would open with none to choose from.
  if (loading) return <SkeletonRows />;

  return (
    <>
      <ErrorLine error={error} className="mb-4" />
      <IdeaForm
        idea={null}
        start={{ title, group_name: lastEditedGroup(items) ?? '', body: '' }}
        groups={groupNames(items)}
        onSave={async (input: IdeaInput) => {
          await add(input);
          navigate(appPath('ideas'));
        }}
      />
    </>
  );
}
