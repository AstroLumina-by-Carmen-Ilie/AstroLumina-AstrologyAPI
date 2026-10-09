// Local stand-in for the abandoned `text-encoding` polyfill. The only
// consumer in this tree (shapefile, via geobuf <- geo-tz) uses just
// `TextDecoder`, which Node provides natively since v11 -- the original
// package itself only re-exported the globals on modern Node. Re-exporting
// them here keeps behavior identical with zero deprecated dependencies.
const { TextEncoder, TextDecoder } = require("node:util");

module.exports = { TextEncoder, TextDecoder };
