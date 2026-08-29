import { STATEMENT_FORMATS, type StatementFormat } from '../../../lib/offline/specs';
import { StatementError, UnknownLayout, type PageLine, type StatementContents } from '../statement';
import { parseGaliciaVisa } from './galiciaVisa';
import { parseGaliciaMastercard } from './galiciaMastercard';

/** The parser for each layout the app can read: a format with no parser (or a
 *  parser for no format) does not compile. */
const PARSERS: Record<StatementFormat, (pages: PageLine[][]) => StatementContents> = {
  'galicia-visa': parseGaliciaVisa,
  'galicia-mastercard': parseGaliciaMastercard,
};

/** The contents of the statement the pages carry, read with whichever layout
 *  they follow. Throws a StatementError when no layout is theirs, or when the
 *  one that is could not be read whole. */
export function parseStatement(pages: PageLine[][]): StatementContents {
  for (const format of STATEMENT_FORMATS) {
    try {
      return PARSERS[format](pages);
    } catch (error) {
      if (!(error instanceof UnknownLayout)) throw error;
    }
  }
  throw new StatementError('No parece un resumen de tarjeta de Galicia.');
}
