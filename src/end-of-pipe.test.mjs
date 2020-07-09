import test from 'ava';
import eop from './end-of-pipe.mjs';

const mw = eop('testCtx');

import res from 'response?__fake=export const api={status:mock(()=>api), send:mock(()=>api)}; export default api';
import next from 'next?__fake=mock()';

const req = ({ message = 'ok', payload, status } = {}) => ({
  testCtx: {
    message,
    status,
    payload,
  },
});

test('responds with 200 status ok', (t) => {
  mw(req({ status: 200 }), res, next);

  t.is(res.status.values.pop()[0], 200);
  t.is(res.send.values.pop()[0], 'ok');
});

test('responds with 200 status and payload', (t) => {
  mw(req({ payload: 123 }), res, next);

  t.is(res.status.values.pop()[0], 200);
  t.is(res.send.values.pop()[0], 123);
});

test('routes status to end of pipe', (t) => {
  mw(req({ status: 201 }), res, next);

  t.deepEqual(next.values.pop()[0], { status: 201, message: 'ok' });
});

test('routes status 500 to end of pipe with no response', (t) => {
  res.status.reset();
  mw(req({ status: 500, message: '' }), res, next);

  t.is(res.status.calls, 0);
  t.deepEqual(next.values.pop()[0], { status: 500, message: '' });
});

test('routes 300 status to end of pipe with no response', (t) => {
  res.status.reset();
  mw(req({ status: 300, message: 'xx' }), res, next);

  t.is(res.status.calls, 0);
  t.deepEqual(next.values.pop()[0], { status: 300, message: 'xx' });
});
