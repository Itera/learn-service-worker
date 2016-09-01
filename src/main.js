/* eslint-env browser */
/* globals fetchCommits, render, hideSpinner, showSpinner, hideOfflineMessage, showOfflineMessage */
/* globals flashReadyForOfflineMessage, idbKeyval */

function onReceiveCommits(commits) {
  render(commits);
  hideSpinner();
  hideOfflineMessage();
  /*
   * Task 7a)
   *   Store data in IndexedDB
   */
}

function onMessage(event) {
  if (event.data.type === 'commits') {
    onReceiveCommits(event.data.body);
  }

  if (event.data.type === 'worker-installed') {
    flashReadyForOfflineMessage();
  }

  if (event.data.type === 'failed-to-load') {
    showOfflineMessage();
    hideSpinner();
  }

  if (event.data.type === 'start-loading') {
    showSpinner();
  }
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', onMessage);

  /*
   * Task 2)
   *   Activate the worker
   */

  if ('SyncManager' in window) {
    /*
     * Task 8b) Register background sync
     */
  }
}

showSpinner();
fetchCommits()
  .then(onReceiveCommits)
  .catch(function (error) {
    console.error(error);
    showOfflineMessage();
    hideSpinner();
  });

/*
 * Task 7b)
 *   Get data from IndexedDB
 */
