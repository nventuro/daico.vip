import { StatementError, UnknownLayout, type PageLine, type StatementContents } from '../statement';
import { parseGaliciaVisa } from './galiciaVisa';
import { parseGaliciaMastercard } from './galiciaMastercard';

const PARSERS = [parseGaliciaVisa, parseGaliciaMastercard];

/** The contents of the statement the pages carry, read with whichever layout
 *  they follow. Throws a StatementError when no layout is theirs, or when the
 *  one that is could not be read whole. */
export function parseStatement(pages: PageLine[][]): StatementContents {
  for (const parse of PARSERS) {
    try {
      return parse(pages);
    } catch (error) {
      if (!(error instanceof UnknownLayout)) throw error;
    }
  }
  throw new StatementError('No parece un resumen de tarjeta de Galicia.');
}
