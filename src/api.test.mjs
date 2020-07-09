import test from 'ava';
import api from './api.mjs';

import plugin, {
  mw,
} from 'plugin?__fake=export const mw = mock(); export default mock(()=>mw)';

import { eop } from './end-of-pipe.mjs?__fake=export const eop = mock(); export default () => eop';

import app from 'express?__fake={use: mock(), get: mock()}';

const req = {};
const res = {};

const { load, bind } = api();

test.serial('bind a plugin to a pipeline', async (t) => {
  await Promise.all(bind('plugin').map((plugin) => plugin(req, res)));
  t.is(plugin.calls, 1);
});

test.serial('bind a plugin module to a pipeline', async (t) => {
  plugin.reset();
  await Promise.all(bind(plugin).map((plugin) => plugin(req, res)));
  t.is(plugin.calls, 1);
});

test.serial('pass options to a plugin', async (t) => {
  const { bind } = api({ opts: 123 });
  await Promise.all(bind('plugin').map((plugin) => plugin(req, res)));
  t.deepEqual(plugin.values.pop()[0], { opts: 123 });
});

test.serial('bind a plugin array to a pipeline', async (t) => {
  plugin.reset();
  await Promise.all(
    bind(['plugin', 'plugin']).map((plugin) => plugin(req, res))
  );
  t.is(plugin.calls, 2);
});

test.serial('bind a plugin config to a pipeline', async (t) => {
  plugin.reset();
  await Promise.all(
    bind({ pipeline: ['plugin'] }).map((plugin) => plugin(req, res))
  );
  t.is(plugin.calls, 1);
});

test.serial('bind a plugin config with options to a pipeline', async (t) => {
  plugin.reset();
  await Promise.all(
    bind({ pipeline: ['plugin'], opts: 123 }).map((plugin) => plugin(req, res))
  );
  t.deepEqual(plugin.values.pop()[0], { opts: 123 });
});

test.serial('run a bound plugin pipeline', async (t) => {
  mw.reset();
  await Promise.all(bind('plugin').map((plugin) => plugin(req, res)));
  t.is(mw.calls, 1);
});

test.serial('run a bound plugin pipeline to end', async (t) => {
  eop.reset();
  await Promise.all(bind('plugin').map((plugin) => plugin(req, res)));
  t.is(eop.calls, 1);
});

test('load a pipeline into middleware', (t) => {
  load(app, { plugin: ['plugin', 'plugin'] });

  const [route, mw1, mw2] = app.use.values.pop();
  t.is(route, '/');
  t.assert(typeof mw1 === 'function');
  t.assert(typeof mw2 === 'function');
});

test('load a pipeline config into middleware', (t) => {
  load(app, { plugin: { pipeline: ['plugin', 'plugin'] } });

  const [route, mw1, mw2] = app.use.values.pop();
  t.is(route, '/');
  t.assert(typeof mw1 === 'function');
  t.assert(typeof mw2 === 'function');
});

test('mount a method pipeline into middleware', (t) => {
  load(app, { plugin: { pipeline: ['plugin'], method: 'GET' } });

  const [route, mw1] = app.get.values.pop();
  t.is(route, '/');
  t.assert(typeof mw1 === 'function');
});

test('mount a pipeline into middleware route', (t) => {
  load(app, { plugin: { pipeline: ['plugin'], route: '/route' } });

  const [route, mw1] = app.use.values.pop();
  t.is(route, '/route');
  t.assert(typeof mw1 === 'function');
});

test('mount a pipeline into middleware method and route', (t) => {
  load(app, {
    plugin: { pipeline: ['plugin'], method: 'get', route: '/route' },
  });

  const [route, mw1] = app.get.values.pop();
  t.is(route, '/route');
  t.assert(typeof mw1 === 'function');
});
