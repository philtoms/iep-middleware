import loadPipeline from './load-pipeline.mjs';
import runPlugin from './run-plugin.mjs';
import endOfPipe from './end-of-pipe.mjs';

export default (config = {}) => {
  const { paths, ctx, limit, ...options } = config;

  const runner = runPlugin(ctx, limit);
  const runPipe = loadPipeline(paths, runner);

  // mount and bind m/w pipelines
  const load = (app, plugins, args) => {
    Object.entries(plugins).forEach(([plugin, options]) => {
      const { method, route = '/', pipeline = [plugin], ...rest } = options;
      const pipe = bind(pipeline, { ...rest, ...args });

      if (method) {
        app[method.toLowerCase()](route, ...pipe);
      } else {
        app.use(route, ...pipe);
      }
    });

    return app;
  };

  // bind pre-mounted m/w pipelines
  const bind = (plugins, args) => {
    const { pipeline, ...rest } = plugins.pipeline
      ? plugins
      : {
          pipeline: Array.isArray(plugins) ? plugins : [plugins],
        };

    return [
      ...runPipe(pipeline, { ...options, ...rest, ...args }),
      endOfPipe(ctx),
    ];
  };

  return { load, bind };
};
