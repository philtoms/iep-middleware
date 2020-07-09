import test from 'ava';
import runPlugin from './run-plugin.mjs';

const req = {};
const res = {};
import next from 'next?__fake=mock()';
import plugin from 'plugin?__fake=mock((req, res, next) => next({payload:123}))';

const run = runPlugin('testCtx');

test('expect plugin to be called with middleware api', async (t) => {
  await run(plugin)(req, res, next);
  t.is(plugin.values[0][0], req);
  t.is(plugin.values[0][1], res);
});

test('expect context to be updated', (t) => {
  run(plugin)(req, res, next);
  t.deepEqual(req.testCtx, { payload: 123 });
});

test('expect context to be preserved', (t) => {
  req.testCtx = { saveThis: 123 };
  run(plugin)(req, res, next);
  t.deepEqual(req.testCtx, { saveThis: 123, payload: 123 });
});

test('expect middleware to route to next', (t) => {
  next.reset();
  run(plugin)(req, res, next);
  t.is(next.calls, 1);
  t.is(next.values[0][0], undefined);
});

test('expect middleware to route to error handler', async (t) => {
  const badPlugin = (
    await import('badPlugin?__fake=() => {throw new Error("bang!")}')
  ).default;

  next.reset();
  run(badPlugin)(req, res, next);

  const { status, message } = next.values[0][0];

  t.is(status, 500);
  t.assert(message.startsWith('Error: bang!'));
});
