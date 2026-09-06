// =============================================================================
// Bytes as base64 text and back: the form a text column carries a sealed file
// in, and the form the model takes a PDF in.
// =============================================================================

// Spread in slices: a whole file's worth of arguments overruns the call stack.
const CHUNK = 0x8000;

/** Bytes as base64 text. */
export function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

/** The bytes a base64 text stands for. */
export function fromBase64(text: string): Uint8Array<ArrayBuffer> {
  const binary = atob(text);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}
