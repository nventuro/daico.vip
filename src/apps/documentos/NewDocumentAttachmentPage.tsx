import NewAttachmentPage from '../../components/NewAttachmentPage';
import { useDocumentOwner } from './useDocumentOwner';

/** Names the file just added to a document. */
export default function NewDocumentAttachmentPage() {
  return <NewAttachmentPage {...useDocumentOwner()} />;
}
