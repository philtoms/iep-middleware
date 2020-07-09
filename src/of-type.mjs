import path from 'path';
import fs from 'fs';

export default (plugin, paths = [], types = ['js', 'mjs']) =>
  paths.reduce(
    (acc, pluginPath) =>
      acc ||
      types.reduce((acc, type) => {
        if (!acc) {
          const filePath = path.resolve(pluginPath, plugin);
          const { ext } = path.parse(filePath);
          const typedPath = ext ? filePath : `${filePath}.${type}`;
          return fs.existsSync(typedPath) && typedPath;
        }
        return acc;
      }, false),
    false
  ) || plugin;
