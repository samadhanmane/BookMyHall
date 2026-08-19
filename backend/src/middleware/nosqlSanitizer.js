/**
 * Middleware to recursively sanitize request data by deleting keys 
 * starting with '$' to prevent MongoDB NoSQL Injection / Operator abuse.
 */
export const nosqlSanitizer = (req, res, next) => {
  const sanitize = (obj) => {
    if (obj && typeof obj === "object") {
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          if (key.startsWith("$")) {
            delete obj[key];
          } else {
            sanitize(obj[key]);
          }
        }
      }
    }
  };

  sanitize(req.body);
  sanitize(req.query);
  sanitize(req.params);

  next();
};
