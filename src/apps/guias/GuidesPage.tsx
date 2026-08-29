import EmptyState from '../../components/EmptyState';
import LinkRow from '../../components/LinkRow';
import ListPage from '../../components/ListPage';
import { entryPath } from '../types';
import { useGuides } from './useGuides';

export default function GuidesPage() {
  const { guides, loading, error } = useGuides();

  return (
    <ListPage loading={loading} error={error}>
      {guides.length === 0 ? (
        <EmptyState>Todavía no hay guías.</EmptyState>
      ) : (
        <ul>
          {guides.map((guide) => (
            <LinkRow key={guide.id} to={entryPath('guias', guide.id)} title={guide.title} chevron />
          ))}
        </ul>
      )}
    </ListPage>
  );
}
