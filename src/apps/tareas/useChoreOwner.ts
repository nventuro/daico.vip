import { useParams } from 'react-router-dom';
import type { AttachmentOwnerProps } from '../../components/AttachmentPage';
import { useChores } from './useChores';

/** The chore in the URL as what its attachments belong to, for the
 *  attachment screens under it. */
export function useChoreOwner(): AttachmentOwnerProps {
  const { id = '' } = useParams();
  const { items } = useChores();
  return {
    owner: { kind: 'chore', id },
    ownerTitle: items.find((chore) => chore.id === id)?.title,
    ownerPath: `/tareas/${id}`,
  };
}
