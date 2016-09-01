/* eslint-disable global-require */
import test from 'ava';
import jsdomify from 'jsdomify';
import sinon from 'sinon';

const eventListeners = {};

const PromiseMock = {
  then: () => PromiseMock,
  catch: () => PromiseMock,
};

class RequestMock {
  constructor() {
    this.url = 'http://itera.no';
  }

  clone() {
    return new RequestMock(this);
  }
}

class RequestApiMock {
  constructor() {
    this.url = 'http://itera.no/api/commits';
  }

  clone() {
    return new RequestMock(this);
  }
}

class ResponseMock {
  constructor({ status, type }) {
    this.status = status;
    this.type = type;
  }

  clone() {
    return new ResponseMock(this);
  }
}

function createCaches({ addAll, put, match }) {
  return {
    match: match || (() => null),
    open: cacheName => Promise.resolve({ addAll, put }),
  };
}

function onError(t) {
  return (error) => {
    t.fail(error);
    t.end();
  };
}

function validatePromise(t, promise, func) {
  if (!promise || !promise.then) {
    t.fail(func + ' was not called with a promise.');
    t.end();
  }
}

test.before(() => {
  jsdomify.create();
  global.self = {
    importScripts: sinon.spy(),
    addEventListener: (key, callback) => {
      eventListeners[key] = callback;
    },
    clients: {
      matchAll: () => PromiseMock,
    },
  };
  global.fetchCommits = () => PromiseMock;
});

test.after(() => {
  jsdomify.destroy();
});

test.serial.cb('Task 3: Pre-cache known files', t => {
  t.plan(5);

  require('../src/service-worker');

  const addAll = sinon.spy();

  global.caches = {
    open: cacheName => (
      {
        then: callback => {
          callback({
            addAll: addAll,
          });
        },
      }
    ),
  };

  eventListeners.install({ waitUntil: () => {} });

  function assertCached(name) {
    t.not(
      addAll.lastCall.args[0].indexOf(name),
      -1,
      '\'' + name + '\' is missing from urls'
    );
  }

  t.true(addAll.called, 'caches.addAll was not called');
  assertCached('/');
  assertCached('/helpers.js');
  assertCached('/main.css');
  assertCached('/main.js');
  t.end();
});

test.serial.cb('Task 4: Answer requests with stuff from cache', t => {
  t.plan(1);
  global.caches = createCaches({
    match: () => Promise.resolve({ status: 200, type: 'basic' }),
  });

  require('../src/service-worker');

  eventListeners.fetch({
    respondWith: promise => {
      validatePromise(t, promise, 'event.respondWith');

      promise
        .then(response => {
          t.deepEqual(response, { status: 200, type: 'basic' });
          t.end();
        })
        .catch(onError(t));
    },
  });

  setTimeout(() => {
    t.end();
  }, 1000);
});

test.serial.cb('Task 5: If not in cache: request it and then cache it', t => {
  t.plan(4);
  const put = sinon.spy();
  global.fetch = () => Promise.resolve(new ResponseMock({ status: 200, type: 'basic' }));
  global.caches = createCaches({ put, match: () => Promise.resolve(null) });

  require('../src/service-worker');

  const respondWith = promise => {
    const notInCacheMessage = 'Seems like cache.put was not called';
    validatePromise(t, promise, 'event.respondWith');

    promise
      .then(response => {
        t.deepEqual(
          response,
          { status: 200, type: 'basic' },
          'Seems like the promise did not return the response.'
        );
        t.is(put.lastCall.args[0].url, 'http://itera.no', notInCacheMessage);
        t.is(put.lastCall.args[1].status, 200, notInCacheMessage);
        t.is(put.lastCall.args[1].type, 'basic', notInCacheMessage);
        t.end();
      })
      .catch(onError(t));
  };

  const spy = sinon.spy(respondWith);

  eventListeners.fetch({ respondWith: respondWith, request: new RequestMock() });

  setTimeout(() => {
    t.end();
  }, 1000);
});

test.serial.cb('Task 6: Do not cache API responses', t => {
  t.plan(2);
  const put = sinon.spy();
  global.fetch = () => Promise.resolve(new ResponseMock({ status: 200, type: 'basic' }));
  global.caches = createCaches({ put, match: () => Promise.resolve(null) });

  require('../src/service-worker');

  const respondWith = promise => {
    validatePromise(t, promise, 'event.respondWith');

    promise
      .then(response => {
        t.deepEqual(
          response,
          { status: 200, type: 'basic' },
          'Seems like the promise did not return the response.'
        );
        t.false(put.called, 'Seems like cache.put was called for the API response');
        t.end();
      })
      .catch(onError(t));
  };

  const spy = sinon.spy(respondWith);

  eventListeners.fetch({ respondWith: respondWith, request: new RequestApiMock() });

  setTimeout(() => {
    t.end();
  }, 1000);
});

test.serial('Task 8: Add background sync', t => {
  require('../src/service-worker');

  t.truthy(eventListeners.sync);
});
