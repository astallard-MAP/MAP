/**
 * @fileOverview Definitive PostCSS Configuration.
 * Fully tailored to handle modular CSS imports, tailwind nesting, and production autoprefixing.
 */
module.exports = {
  plugins: {
    'postcss-import': {},
    'tailwindcss/nesting': {},
    tailwindcss: {},
    autoprefixer: {},
  },
};
