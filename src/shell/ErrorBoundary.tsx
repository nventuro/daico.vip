import { Component, type ErrorInfo, type ReactNode } from 'react';
import { IconAlertTriangle } from '@tabler/icons-react';
import { errorMessage } from '../utils/textUtils';
import Gate from './Gate';

interface ErrorBoundaryState {
  message: string | null;
}

/**
 * What a screen that could not be drawn shows instead. React takes the whole
 * app down when a render throws, and nothing drawn is how the app says it is
 * still starting: without this the failure is a splash that never ends, and
 * whatever went wrong is only in the console.
 *
 * The one class component in the app — catching a render is the one thing
 * React has no hook for.
 */
export default class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { message: null };

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return { message: errorMessage(error) };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info.componentStack);
  }

  render() {
    if (this.state.message === null) return this.props.children;
    return (
      <Gate
        icon={IconAlertTriangle}
        title="Algo se rompió"
        text="No se pudo dibujar esta pantalla. Recargá; si vuelve a pasar, mostrá lo que dice acá abajo."
      >
        <p className="mt-4 font-mono text-xs break-words text-muted">{this.state.message}</p>
        <a href="" className="mt-6 text-muted underline">
          Recargar
        </a>
      </Gate>
    );
  }
}
