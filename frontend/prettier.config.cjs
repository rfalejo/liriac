/**
 * Prettier configuration for liriac frontend.
 * Mirrors backend formatting philosophy (88 line length) while
 * deferring to Prettier defaults for consistency.
 */

/** @type {import('prettier').Config} */
module.exports = {
  printWidth: 88,
  semi: true,
  singleQuote: true,
  trailingComma: 'all',
  arrowParens: 'always',
  endOfLine: 'lf',
};
