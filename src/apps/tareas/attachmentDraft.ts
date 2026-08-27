// The file just picked for a chore, on its way from the picker to the screen
// that names it. Held here rather than in the URL: a File cannot ride a link,
// and it only matters until that screen takes it.
let draft: File | null = null;

export function setAttachmentDraft(file: File): void {
  draft = file;
}

/** The picked file, handed over once; null when there is none (the naming
 *  screen was reached without picking, e.g. by reload). */
export function takeAttachmentDraft(): File | null {
  const file = draft;
  draft = null;
  return file;
}
