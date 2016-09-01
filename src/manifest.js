/*
 * This file is in javascript instead of json to be able to add comments.
 * The express server will serve it as a json file.
 * See https://developer.mozilla.org/en-US/docs/Web/Manifest or
 * https://w3c.github.io/manifest/ for more info on the different fields.
 */

module.exports = {
  lang: 'no',
  name: 'GitHub Commit Feed',
  display: 'fullscreen', // Options: fullscreen, standalone, minimal-ui, browser
  theme_color: '#faf0e6',
  background_color: '#faf0e6',
  start_url: '/',
  icons: [
    { src: '/icons/commit.png', type: 'image/png', sizes: '32x32' },
  ],
};
