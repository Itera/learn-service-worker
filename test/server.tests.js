import _ from 'lodash';
import test from 'ava';
import request from 'request';

test.cb('Task 1: Start server', t => {
  t.plan(2);

  request('http://127.0.0.1:3000', (error, response) => {
    if (_.get(error, 'code') === 'ECONNREFUSED') {
      t.fail('The server has not been started.');
    }

    t.truthy(response, 'The server has not been started.');
    t.regex(
      _.get(response, 'body'),
      /<title>Learn service-worker<\/title>/,
      'It seems that something else is running on http://127.0.0.1:3000'
    );
    t.end();
  });
});
