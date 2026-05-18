// src/middleware/rateLimit.js

const rateLimit = require('express-rate-limit');

/* -------------------------------------------------------
   FREE TIER LIMITS
------------------------------------------------------- */

const freeGlobal = rateLimit({
  windowMs: 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Free-tier global limit reached." }
});

const freeSendFax = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Free-tier send limit reached." }
});

const freeSendFaxHourly = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Free-tier hourly fax limit reached." }
});

const freeStatus = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Too many status checks for free tier." }
});

const freeAuth = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Too many auth attempts." }
});


/* -------------------------------------------------------
   PRO TIER LIMITS
------------------------------------------------------- */

const proGlobal = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Pro-tier global limit reached." }
});

const proSendFax = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Pro-tier fax send limit reached." }
});

const proSendFaxHourly = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Pro-tier hourly fax limit reached." }
});

const proStatus = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Too many status checks for Pro tier." }
});

const proAuth = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Too many auth attempts." }
});


/* -------------------------------------------------------
   BUSINESS / ENTERPRISE TIER LIMITS
------------------------------------------------------- */

const bizGlobal = rateLimit({
  windowMs: 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Business-tier global limit reached." }
});

const bizSendFax = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Business-tier fax send limit reached." }
});

const bizSendFaxHourly = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 2000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Business-tier hourly fax limit reached." }
});

const bizStatus = rateLimit({
  windowMs: 60 * 1000,
  max: 2000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Too many status checks for Business tier." }
});

const bizAuth = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Too many auth attempts." }
});


/* -------------------------------------------------------
   EXPORT ALL LIMITERS
------------------------------------------------------- */

module.exports = {
  // Free tier
  freeGlobal,
  freeSendFax,
  freeSendFaxHourly,
  freeStatus,
  freeAuth,

  // Pro tier
  proGlobal,
  proSendFax,
  proSendFaxHourly,
  proStatus,
  proAuth,

  // Business / Enterprise tier
  bizGlobal,
  bizSendFax,
  bizSendFaxHourly,
  bizStatus,
  bizAuth
};
