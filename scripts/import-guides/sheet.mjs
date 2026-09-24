// A cheat sheet is a document that is nothing but a heading per matchup and,
// under each, which cards to bring in and which to take out — one of the forms
// the source's guides come in. Read as one chapter it is
// hundreds of lines to scroll through for the four that matter, so it becomes
// a guide of its own: the guide's page lists the matchups, and a matchup is a
// page holding only its own lines.

/** How many headings a document needs before it is read as a cheat sheet. */
const SHEET_MIN_MATCHUPS = 3;

const HEADING = /^### /m;

/**
 * The matchups of `markdown` and whatever stands before the first of them, or
 * null when the document is not a cheat sheet — prose and tables are left as
 * they are, a single chapter.
 */
export function splitSheet(markdown) {
  const parts = markdown.split(HEADING);
  if (parts.length <= SHEET_MIN_MATCHUPS) return null;
  const matchups = parts.slice(1).map((part) => {
    const end = part.indexOf('\n');
    const [title, body] = end === -1 ? [part, ''] : [part.slice(0, end), part.slice(end + 1)];
    return { title: title.trim(), body: body.trim() };
  });
  if (matchups.some((m) => !m.title)) return null;
  return { intro: parts[0].trim(), matchups };
}
