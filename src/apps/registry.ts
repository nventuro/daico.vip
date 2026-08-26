import type { AppModule } from './types';
import tareas from './tareas';
import compras from './compras';
import guias from './guias';

/** Every app, in the order they appear on the home screen. */
export const apps: readonly AppModule[] = [tareas, compras, guias];
