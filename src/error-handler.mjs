// result:
//  status: default 500
//  message: default empty
//  payload: default empty
export default ({ log = console, limit = 400 }) => (result, req, res, next) => {
  const { status = 500, message = result, payload = '' } = result;

  if (status === 500) {
    const err = result instanceof Error ? result : message;
    log.error(err.stack || err);
    return res.status(500).send(payload);
  }

  if (message) {
    return log[status >= limit ? 'warn' : 'info'](message);
  }

  // not handled here
  next(result);
};
