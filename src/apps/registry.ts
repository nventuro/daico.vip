import type { AppModule } from './types';
import tareas from './tareas';
import compras from './compras';
import fechas from './fechas';
import notas from './notas';
import viajes from './viajes';
import documentos from './documentos';
import gastos from './gastos';
import recetas from './recetas';
import guias from './guias';

/** Every app, in the order they appear on the home screen: what the household
 *  has to do, then what it keeps, then what it reads. */
export const apps: readonly AppModule[] = [
  tareas,
  compras,
  fechas,
  notas,
  viajes,
  documentos,
  gastos,
  recetas,
  guias,
];
