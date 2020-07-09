export default (ctx, limit = 300) => (req, res, next) => {
  const { status, message = '', payload = message } = req[ctx] || {};

  if (payload || status) {
    const resStatus = status || 200;
    if (resStatus < limit) {
      res.status(resStatus).send(payload);
    }

    next({ status: resStatus, message });
  }
};
