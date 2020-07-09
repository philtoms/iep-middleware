export default (ctx) => (mw) => (req, res, next) => {
  try {
    mw(req, res, (context) => {
      if (context) {
        const { status, message } = context;
        if (!status && message) {
          throw context;
        }
        req[ctx] = {
          ...req[ctx],
          ...context,
        };
      }
      next();
    });
  } catch (err) {
    next({
      message: err.stack,
      status: 500,
    });
  }
};
