import { appPath, entryPath } from '../types';

/** The screen the statements live on, as both the route and the path name it. */
export const STATEMENTS_SEGMENT = 'resumenes';

/** Where the statements are: a screen of their own under Gastos, with the
 *  cards and whatever is missing from them. */
export const STATEMENTS_PATH = `${appPath('gastos')}/${STATEMENTS_SEGMENT}`;

/** One statement, under the list it belongs to. */
export function statementPath(id: string): string {
  return entryPath('gastos', STATEMENTS_SEGMENT, id);
}

/** One calendar month (yyyy-mm), straight under Gastos: the months are what
 *  the app opens on. */
export function monthPath(month: string): string {
  return entryPath('gastos', month);
}
