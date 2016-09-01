/* globals self, caches, fetch, fetchCommits, sendMessageToClients */

self.importScripts('/vendor/idb-keyval-min.js');
self.importScripts('/helpers.js');
const CACHE_NAME = 'awesome-app--cache-v1';

/*
 * Task 3b)
 *   Create list of known files
 */

/*
const urls = [
  '/',
  '/vendor/idb-keyval-min.js',
  '/icons/github.png',
  '/helpers.js',
  '/main.css',
  '/main.js',
];
*/

function updateCommits() {
  self.clients.matchAll()
    .then(function (clients) {
      clients.forEach(function (client) {
        client.postMessage({ type: 'start-loading' });
      });
    });

  return fetchCommits()
    .then(function (commits) {
      return sendMessageToClients({ type: 'commits', body: commits });
    })
    .catch(function (error) {
      return sendMessageToClients({ type: 'failed-to-load', error: error.toString() });
    });
}

self.addEventListener('install', function (event) {
  /*
   * Task 3a)
   *   Pre-cache known files
   */
});

self.addEventListener('fetch', function (event) {
  /*
   * Task 4)
   *   Answer requests with stuff from cache
   */

  /*
   * Task 5)
   *   If not in cache: request it and then cache it
   */

  /*
   * Task 6)
   *   Do not cache API responses
   */
});

/*
 * Task 8a)
 *   Add background sync
 */
