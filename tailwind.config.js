module.exports = {
  purge:{
    enabled: true,
    content: [
    './src/pages/*.js',
    './src/components/*.js',
    './src/pages/*/**.js',
    './src/components/*/**.js',
  ]},
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {},
  },
  variants: {
    extend: {},
  },
  plugins: [],
}
