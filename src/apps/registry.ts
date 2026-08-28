import type { AppModule } from './types';
import tareas from './tareas';
import compras from './compras';
import guias from './guias';
import fechas from './fechas';
import recetas from './recetas';
import documentos from './documentos';
import gastos from './gastos';

/** Every app, in the order they appear on the home screen. */
export const apps: readonly AppModule[] = [
  tareas,
  compras,
  guias,
  fechas,
  recetas,
  documentos,
  gastos,
];
