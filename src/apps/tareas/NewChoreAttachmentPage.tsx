import NewAttachmentPage from '../../components/NewAttachmentPage';
import { useChoreOwner } from './useChoreOwner';

/** Names the attachment just added to a chore. */
export default function NewChoreAttachmentPage() {
  return <NewAttachmentPage {...useChoreOwner()} />;
}
