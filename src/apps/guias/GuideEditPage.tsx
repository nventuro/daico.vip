import { useLeave } from '../../hooks/useLeave';
import EntryPage from '../../components/EntryPage';
import { useEntry } from '../../hooks/useEntry';
import { entryPath } from '../types';
import GuideForm from './GuideForm';
import { guideGroupNames } from './grouping';
import { useGuides, type GuideInput } from './useGuides';

export default function GuideEditPage() {
  const { guides, loading, error, save } = useGuides();
  const guide = useEntry(guides, 'guideId');
  const leave = useLeave();

  return (
    <EntryPage entry={guide} loading={loading} error={error} missing="Guía no encontrada.">
      {(guide) => (
        <GuideForm
          key={guide.id}
          guide={guide}
          groups={guideGroupNames(guides)}
          onSave={async (input: GuideInput) => {
            await save(guide.id, input);
            leave(entryPath('guias', guide.id));
          }}
        />
      )}
    </EntryPage>
  );
}
