import { Link } from 'react-router-dom';
import EmptyState from '../components/EmptyState';

/** Where an address the app does not have ends up: a link that has gone
 *  stale, one typed by hand, one kept from a screen that has since moved. A
 *  route matching nothing draws nothing at all, which reads as an app that
 *  never finished starting. */
export default function NotFound() {
  return (
    <EmptyState>
      No hay nada en esta dirección.{' '}
      <Link to="/" className="underline">
        Volver al inicio
      </Link>
      .
    </EmptyState>
  );
}
