import test from 'ava';
import loadPipeline from './load-pipeline.mjs';

import { mw } from 'plugin?__fake=export const mw = mock(); export default mock(()=>mw)';
import runner from 'run?__fake=fn=>fn';

const req = {};
const res = {};
import next from 'next?__fake=mock()';

const pipeline = loadPipeline(['/'], runner)(['plugin', 'plugin']);

test.serial('load pipeline into mw array', (t) => {
  t.assert(Array.isArray(pipeline));
  t.assert(pipeline.length === 2);
  t.assert(typeof pipeline[0] === 'function');
});

test.serial('run pipeline ', async (t) => {
  await Promise.all(pipeline.map((plugin) => plugin(req, res, next)));
  t.is(mw.calls, 2);
});
