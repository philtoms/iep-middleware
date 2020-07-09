import test from 'ava';
import ofType from './of-type.mjs';

import 'fs?__fake={existsSync: ()=>true}';

test('return package name', (t) => {
  t.is(ofType('package-name'), 'package-name');
});

test('returns first matching path', (t) => {
  t.is(ofType('name.mjs', ['/', '../']), '/name.mjs');
});

test('returns first matching path with default type', (t) => {
  t.is(ofType('name', ['/', '../']), '/name.js');
});

test('appends first matching type to name', (t) => {
  t.is(ofType('name', ['/'], ['mjs', 'js']), '/name.mjs');
});
