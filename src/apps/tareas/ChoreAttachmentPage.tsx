import AttachmentPage from '../../components/AttachmentPage';
import { useChoreOwner } from './useChoreOwner';

/** One of a chore's attachments. */
export default function ChoreAttachmentPage() {
  return <AttachmentPage {...useChoreOwner()} />;
}
