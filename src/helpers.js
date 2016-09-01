/* globals fetch, document, clients, MessageChannel */

function fetchCommits() {
  return fetch('/api/commits')
    .then(function (response) {
      return response.json();
    });
}

function renderDate(timestamp) {
  const date = new Date(timestamp);
  return (
    date.toLocaleDateString('nb') +
    ' ' +
    date.toLocaleTimeString('nb').split('.').slice(0, 2).join('.')
  );
}

function hideOfflineMessage() {
  document.getElementById('fancy-offline-icon').style.display = 'none';
}

function showOfflineMessage() {
  document.getElementById('fancy-offline-icon').style.display = 'block';
}

function hideSpinner() {
  document.getElementById('spinner').classList.remove('spinner--active');
}

function showSpinner() {
  document.getElementById('spinner').classList.add('spinner--active');
}

function flashReadyForOfflineMessage() {
  document.getElementById('ready-for-offline-icon').style.display = 'block';

  setTimeout(function () {
    document.getElementById('ready-for-offline-icon').style.display = 'none';
  }, 5000);
}

function render(data) {
  const commitsContent = data.commits.map(function (commit) {
    return (
      '<div class="list-element">' +
        '<img class="commit-icon" src="../icons/commit.png" />' +
        '<pre class="commit-title">' +
          commit.message +
        '</pre>' +
        '<p class="commit-author">' +
          '<img src="' + commit.avatar + '" class="commit-avatar"/>' +
          '<span>' + commit.author + ' <strong>commited to</strong> ' + commit.repo + '</span' +
        '</p>' +
      '</div>'
    );
  });
  const content = (
    '<div class="timestamp">' +
      '<strong>Last updated: </strong>' + renderDate(data.timestamp) +
    '</div>' +
    commitsContent.join('\n')
  );
  document.getElementById('root').innerHTML = content;
}

function sendMessageToClient(client, message) {
  return new Promise(function (resolve, reject) {
    const channel = new MessageChannel();

    channel.port1.onmessage = function (event) {
      if (event.data.error) {
        reject(event.data.error);
      } else {
        resolve(event.data);
      }
    };

    client.postMessage(message, [channel.port2]);
  });
}

function sendMessageToClients(message) {
  clients.matchAll()
    .then(clientList => {
      clientList.forEach(client => {
        sendMessageToClient(client, message)
          .then(m => console.log('SW Received Message: ' + m));
      });
    });
}
