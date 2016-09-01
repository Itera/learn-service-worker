/* eslint-disable consistent-return */
const http = require('http');
const express = require('express');
const fs = require('fs');
const request = require('request');
const parseString = require('xml2js').parseString;
const resolve = require('path').resolve;

const manifest = require('./src/manifest.js');

const app = express();

app.use(express.static(resolve(__dirname, 'src')));

app.get('/manifest.json', (req, res) => {
  res.json(manifest);
});

const commitRequestOptions = {
  url: 'http://github.aaberge.net:6081/events',
  headers: { 'User-Agent': 'pwa' },
};

app.get('/api/commits', function (req, res) {
  request(commitRequestOptions, function (err, response) {
    if (err) {
      return res.json({ error: err });
    }

    const results = JSON.parse(response.body)
      .filter(result => result.type === 'PushEvent')
      .filter(result => result.payload.commits.length > 0)
      .map(result => ({
        avatar: result.actor.avatar_url
          .replace('https://avatars.githubusercontent.com/u/', '/avatar/'),
        repo: result.repo.name,
        author: result.payload.commits[0].author.name,
        message: result.payload.commits[0].message,
      }));

    res.json({
      commits: results,
      timestamp: new Date().toString(),
    });
  });
});

app.get('/avatar/:userId', function (req, res) {
  const avatarRequestOptions = {
    url: 'https://avatars.githubusercontent.com/u/' + req.params.userId + '?',
    headers: { 'User-Agent': 'pwa' },
  };

  request(avatarRequestOptions).pipe(res);
});

app.get('/', function (res) {
  fs.readFile('./src/index.html', function (content) {
    res.send(content);
  });
});

app.listen(3000, function onListen() {
  console.log(
    'The server has now started. Go to http://localhost:3000 to ' +
    'open up the app.'
  );
});
