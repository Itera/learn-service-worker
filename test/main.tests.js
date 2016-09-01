/* eslint-disable global-require */
import test from 'ava';
import jsdomify from 'jsdomify';

test.before(() => {
  jsdomify.create();
  global.localStorage = { getItem: () => '{}' };
});

test.after(() => {
  jsdomify.destroy();
});

const PromiseMock = {
  then: () => PromiseMock,
  catch: () => PromiseMock,
};

test('Task 2: Activate service-worker', t => {
  t.plan(1);
  global.fetchCommits = () => PromiseMock;
  global.render = () => {};
  global.showSpinner = () => {};
  global.idbKeyval = {
    set: () => PromiseMock,
    get: () => PromiseMock,
  };
  global.navigator.serviceWorker = {
    addEventListener: () => {},
    register: file => {
      t.is(file, '/service-worker.js');
      return Promise.resolve({});
    },
    ready: () => Promise.resolve(),
  };

  require('../src/main');
});
