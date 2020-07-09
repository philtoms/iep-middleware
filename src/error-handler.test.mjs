import test from 'ava';
import handler from './error-handler.mjs';

import log from 'log?__fake={error: mock(), warn: mock(), info: mock()}';
import res from 'response?__fake=export const api={status:mock(()=>api), send:mock(()=>api)}; export default api';
import next from 'next?__fake=mock()';

const handle = handler({ log });

const req = {};
const err = ({ status = 500, message = 'bang', payload = 'oops' } = {}) => ({
  status,
  message,
  payload,
});

test('responds with status 500 oops, and logs error', (t) => {
  handle(err(), req, res, next);

  t.is(res.status.calls, 1);
  t.is(res.status.values.pop()[0], 500);
  t.is(res.send.calls, 1);
  t.is(res.send.values.pop()[0], 'oops');
  t.is(log.error.calls, 1);
  t.is(log.error.values.pop()[0], 'bang');
});

test('promotes unstructured response to 500', (t) => {
  res.status.reset();
  res.send.reset();
  log.error.reset();
  handle({ some: 'other issue' }, req, res, next);

  t.is(res.status.calls, 1);
  t.is(res.status.values.pop()[0], 500);
  t.is(res.send.calls, 1);
  t.is(res.send.values.pop()[0], '');
  t.is(log.error.calls, 1);
  t.deepEqual(log.error.values.pop()[0], { some: 'other issue' });
});

test('extracts log message from Error stack', (t) => {
  handle(err({ message: { stack: 'line1: bang' } }), req, res, next);

  t.is(log.error.values.pop()[0], 'line1: bang');
  // t.deepEqual(next.values.pop()[0], { status: 500, message: '' });
});

test('does not send response for 400 status', (t) => {
  res.status.reset();

  handle(err({ status: 400, message: 'bang' }), req, res, next);

  t.is(res.status.calls, 0);
});

test('limits log level to warn for 400 status', (t) => {
  handle(err({ status: 400, message: 'bang' }), req, res, next);

  t.is(log.warn.values.pop()[0], 'bang');
});

test('limits log level to info for under 400 status', (t) => {
  handle(err({ status: 301, message: 'bang' }), req, res, next);

  t.is(log.info.values.pop()[0], 'bang');
});
