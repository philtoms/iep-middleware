# iep-middleware

A utility to load and bind configurable plugins into express middleware.

Use it if you have a requirement to dynamically load express middleware through configuration.

The IEP software family uses this utility to expose middleware pipeline customization through command-line configuration.

## Install

```
npm install 'iep-middleware'
yarn add 'iep-middleware'
```

## Usage

Given the following JSON configuration:

```javascript
{
  'plugin1': {
    route: '/plugin'
  }
  'plugin2': {
    method: 'post',
    route: '/plugin'
  }
}
```

`iep-middleware` will load the two plugin middlewares and mount them with:

```javascript
import express from 'express';
import middleware from 'iep-middleware';
import plugins from './plugins.json';

// optional configuration passed through to the m/w
const options = { some: 'options' };
const { load } = middleware(options);

const app = load(express(), plugins);
```

This is equivalent to...

```javascript
import plugin1 from 'plugin1';
import plugin2 from 'plugin2';

const app = express();

const options = { some: 'options' };

app.use('/plugin', plugin1(options));
app.post('/plugin', plugin2(options));
```

Not very useful in this minimal configuration, but `iep-middleware` significantly reduces boilerplate for more complicated middleware configurations - such as this - ever so slightly - contrived example:

```javascript
export default () => ({
    // ordered module resolver paths
    'module-paths': ['./iep-plugins', '../../ts-plugins]
    plugins: {
      jira: {
        method: 'POST',
        path: '/webhooks/jira',
        // plugins not resolved through module-paths are treated as npm package specifiers
        pipeline: ['policy', 'jira-webhook'],
        // remaining config passed into loaded plugin as options
        issueKeys: {
          user: 'user.displayName',
          ticket: 'issue.key',
          done: 'issue.fields.resolutiondate',
          workflow: 'issue.fields.status.name',
        },
        workflowMap: {
          Backlog: 'dev',
          'Selected for Development': 'dev',
          'In Progress': 'qa',
          Done: 'prod',
        },
      },
      // shorthand for {promote: {pipeline: ['policy', 'promote']}}
      promote: ['policy', 'promote'],
})
```

## logging and error handling

`iep-middleware` respects the `express.next(err)` middleware pattern, so any m/w can bail using this exit approach and the error message will be picked up by an express error handler.

`iep-middleware` provides just such an error handler, but for now at least, its an opt-in and must be set up explicitly:

```javascript
import { errorHandler } from 'iep-middleware'
...
// after all other m/w has been mounted...
app.use(errorHandler())
```

This error handler will generate and send a 500 response for any error passed though `next`. Additionally, it will respect the following data structure:

```
{
  status,  // any HTTP status (default 500)
  message, // an error message or an `Error` object for logging (default console.error)
  payload  // an optional response payload (default '')
}
```

By default, `errorHandler` will log to `console.error` but a 3rd party logger can be passed into its constructor:

```javascript
app.use(errorHandler({ log: new winston.transports.Console() }));
```

For synchronous m/w, `errorHandler` will capture and log any exceptions and return a `500` error status so explicit error handling is not required in the m/w.

Asynchronous exceptions do not bubble up to the handler, so async m/w must provide its own error stack with a try / catch block, or a promise.catch. The caught error is then passed on to `errorHandler` through `next(caught_err)`.

```javascript
export default async (req, res, next) => {
  try {
    await someResourse();
  } catch (err) {
    // pass through to error handler
    next(err);
  }
};
```

## Pipelines

Pipelines can be assembled directly from configuration using the `pipeline: [p1, p2...]` property. Each plugin in the pipeline is mounted in config order on the same route, and each is responsible for propagating context to the next m/w plugin in the pipeline.

`express` middleware has the signature `(request, response, next`) and by convention has influence over a pipeline either directly through the `response` handler or indirectly through `next` handler - either bail with `next(err)` or pass forwards to the next m/w with `next()`.

Typically, context is passed through the pipeline on the `request` object.

Thus `iep-middleware` works with `express` best practices very much in mind. However, in order to support route based pipelines efficiently, it provides an opinionated but simplified mechanism for passing context from one pipeline m/w plugin to the next.

In such a pipeline, plugin m/w is not responsible for directly responding to requests, but defers to `iep-middleware` to generate the appropriate response. It does this through the extended `next()` semantics:

- `next()` passes directly to the next pipeline plugin
- `next({payload:123})` adds payload to the request before passing to the next pipeline plugin
- `next('bang!')` terminates the pipeline with `500 bang!` response
- `next({status:404}, message: 'um??')` terminates with a `404 um??` response

The `next({payload:123})` route is accessed by the next m/w as `request.ctx`. The `ctx` property name can be configured during middleware setup:

### happy path / sad path

```javascript
const { bind } = mw({ ctx: 'count' });
const step1 = (req, res, next) => next({ payload: req.params.count });
const step2 = (req, res, next) => next({ payload: req.count * req.count });

app.get('/:count', bind([step1, step2]));

// happy path....
// curl count/1 => 200, '1'
// curl count/10 => 200, '100'

// bad params path
// curl count/abc => 500
```
