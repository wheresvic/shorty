const wrap = fn =>
  function asyncUtilWrap(...args) {
    const fnReturn = fn(...args);
    const next = args[args.length - 1];
    return Promise.resolve(fnReturn).catch(next);
  };

const middlewareSetMimeTypeTextHtml = function(req, res, next) {
  res.setHeader("Content-Type", "text/html;charset=utf-8");
  next();
};

module.exports = {
  wrap, middlewareSetMimeTypeTextHtml
};
