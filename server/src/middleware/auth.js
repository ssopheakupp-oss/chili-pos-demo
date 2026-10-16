const jwt = require('jsonwebtoken');
const httpError = require('../utils/httpError');

function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next(httpError(401, 'Please sign in'));
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    next(httpError(401, 'Session expired. Sign in again'));
  }
}

const requireRole = (...roles) => (req, res, next) =>
  roles.includes(req.user?.role) ? next() : next(httpError(403, 'You do not have access to this action'));

module.exports = { auth, requireRole };
