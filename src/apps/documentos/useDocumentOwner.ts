import { useParams } from 'react-router-dom';
import type { AttachmentOwnerProps } from '../../components/AttachmentPage';
import { useDocuments } from './useDocuments';

/** The document in the URL as what its attachments belong to, for the
 *  attachment screens under it. */
export function useDocumentOwner(): AttachmentOwnerProps {
  const { id = '' } = useParams();
  const { items } = useDocuments();
  return {
    owner: { kind: 'document', id },
    ownerTitle: items.find((entry) => entry.id === id)?.title,
    ownerPath: `/documentos/${id}`,
  };
}
