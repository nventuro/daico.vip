// =============================================================================
// Gzip, for what travels sealed inside a row: a compressed blob keeps the row
// small enough to be pulled with its table.
// =============================================================================

async function through(
  bytes: Uint8Array<ArrayBuffer>,
  stream: GenericTransformStream,
): Promise<Uint8Array<ArrayBuffer>> {
  const piped = new Blob([bytes]).stream().pipeThrough(stream);
  return new Uint8Array(await new Response(piped).arrayBuffer());
}

/** `bytes` compressed. */
export function gzip(bytes: Uint8Array<ArrayBuffer>): Promise<Uint8Array<ArrayBuffer>> {
  return through(bytes, new CompressionStream('gzip'));
}

/** The bytes a compressed blob stands for. Throws when it is not one. */
export function gunzip(bytes: Uint8Array<ArrayBuffer>): Promise<Uint8Array<ArrayBuffer>> {
  return through(bytes, new DecompressionStream('gzip'));
}
