import { Navigate } from 'react-router-dom';

/** What a retired `…/editar` route renders: the entry itself, one segment
 *  up, so a bookmark or a history entry from before still lands on it. */
export default function EditRedirect() {
  return <Navigate to=".." relative="path" replace />;
}
