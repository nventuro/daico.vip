import { Navigate } from 'react-router-dom';

/** What `…/editar` renders: the entry itself, one segment up. An entry is
 *  written on its own page, and a bookmark that names this address still
 *  lands on it. */
export default function EditRedirect() {
  return <Navigate to=".." relative="path" replace />;
}
