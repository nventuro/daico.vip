import type { AppModule } from './types';
import tareas from './tareas';
import compras from './compras';
import ideas from './ideas';
import notas from './notas';
import viajes from './viajes';
import salud from './salud';
import gastos from './gastos';
import despensa from './despensa';
import documentos from './documentos';
import guias from './guias';
import recetas from './recetas';
import fechas from './fechas';

/** Every app, in the order they appear on the home screen. */
export const apps: readonly AppModule[] = [
  tareas,
  compras,
  ideas,
  notas,
  viajes,
  salud,
  gastos,
  despensa,
  documentos,
  guias,
  recetas,
  fechas,
];
