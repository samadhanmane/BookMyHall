import rateLimit from "express-rate-limit";

/** Standard error body for rate limit responses (see docs/CONVENTIONS.md). */
const limitMessage = (message) => ({ message });

// Helper to disable limiters under test env
const makeLimiter = (options) => {
  if (process.env.NODE_ENV === "test") {
    return (req, res, next) => next();
  }
  return rateLimit(options);
};

// General API rate limit — protective: 100 requests/minute per IP
export const apiLimiter = makeLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false
});

// Auth endpoint limiter — protective against brute-force: 10 requests/minute
export const authLimiter = makeLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: limitMessage("Too many login attempts. Please wait a minute and try again.")
});

// Booking creation limiter — prevents slot locking spam: 20 requests/minute
export const bookingCreateLimiter = makeLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: limitMessage("Too many booking requests. Please wait and try again.")
});

// Chat limiter — prevents chatbot token/API spam: 20 requests/minute
export const chatLimiter = makeLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: limitMessage("Too many chatbot requests. Please wait and try again.")
});

// Password reset limiter — kept stricter to prevent abuse
export const passwordResetLimiter = makeLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 requests per 15 minutes per IP
  message: limitMessage("Too many password reset requests. Please try again later."),
  standardHeaders: true,
  legacyHeaders: false
});

// Canteen requisition creation limiter — prevents order spam: 20 requests/minute
export const canteenOrderCreateLimiter = makeLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: limitMessage("Too many canteen orders created. Please wait and try again.")
});

// Maintenance ticket creation limiter — prevents ticket spam: 20 requests/minute
export const maintenanceCreateLimiter = makeLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: limitMessage("Too many maintenance tickets created. Please wait and try again.")
});


