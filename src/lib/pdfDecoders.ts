// =============================================================================
// Where the page finds pdf.js's decoders, under the app's own origin. The
// images of a scanned page — an id, a lab result — are JPEG 2000 or JBIG2 as
// often as not, which pdf.js decodes in wasm it fetches on first use; a
// decoder it cannot fetch draws the page blank. The build copies the files
// here from the package, so they are the version the app's pdf.js expects,
// and precaches them with the rest.
// =============================================================================

/** The directory the decoders are served from, as pdf.js takes it. */
export const PDF_DECODERS_URL = '/pdfjs/';

/** The decoders the build copies: the two image codecs and the colour
 *  profiles. The rest of what the package ships is for PDFs that run
 *  scripts, which the app never lets one do. */
export const PDF_DECODERS = ['openjpeg.wasm', 'jbig2.wasm', 'qcms_bg.wasm'];
