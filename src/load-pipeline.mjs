import ofType from './of-type.mjs';

const importPlugin = (run, plugin, paths, options) => {
  // reduce to first found path or plugin package name
  const pluginPath = ofType(plugin, paths, ['js', 'mjs']);

  return new Promise((resolve) =>
    import(pluginPath).then((module) => resolve(run(module.default(options))))
  );
};

export default (paths, run) => (pipeline, options) =>
  pipeline.map((plugin) => {
    // inline configuration - already loaded
    if (typeof plugin === 'function') {
      return run(plugin(options));
    }

    const module = importPlugin(run, plugin, paths, options);
    return (req, res, next) => module.then((mw) => mw(req, res, next));
  });
