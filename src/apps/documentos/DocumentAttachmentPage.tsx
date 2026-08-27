import AttachmentPage from '../../components/AttachmentPage';
import { useDocumentOwner } from './useDocumentOwner';

/** One of a document's files. */
export default function DocumentAttachmentPage() {
  return <AttachmentPage {...useDocumentOwner()} />;
}
