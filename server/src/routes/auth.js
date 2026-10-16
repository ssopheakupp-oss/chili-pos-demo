const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sql, getPool } = require('../db');
const { auth } = require('../middleware/auth');
const wrap = require('../utils/wrap');
const httpError = require('../utils/httpError');

router.post('/login', wrap(async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) throw httpError(400, 'Enter your username and password');

  const pool = await getPool();
  const { recordset } = await pool.request()
    .input('u', sql.NVarChar(50), username)
    .query('SELECT UserId, FullName, Username, PasswordHash, Role FROM Users WHERE Username=@u AND IsActive=1');
  const user = recordset[0];
  if (!user || !(await bcrypt.compare(password, user.PasswordHash))) {
    throw httpError(401, 'Wrong username or password');
  }
  const payload = { id: user.UserId, name: user.FullName, role: user.Role };
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES || '12h' });
  res.json({ token, user: payload });
}));

router.post('/change-password', auth, wrap(async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (typeof currentPassword !== 'string' || typeof newPassword !== 'string') {
    throw httpError(400, 'Enter your current password and a new password');
  }
  if (newPassword.length < 12 || newPassword.length > 128) {
    throw httpError(400, 'New password must be between 12 and 128 characters');
  }
  if (currentPassword === newPassword) {
    throw httpError(400, 'Choose a new password different from your current password');
  }

  const pool = await getPool();
  const { recordset } = await pool.request()
    .input('id', sql.Int, req.user.id)
    .query('SELECT PasswordHash FROM Users WHERE UserId=@id AND IsActive=1');
  const user = recordset[0];
  if (!user || !(await bcrypt.compare(currentPassword, user.PasswordHash))) {
    throw httpError(401, 'Current password is incorrect');
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await pool.request()
    .input('id', sql.Int, req.user.id)
    .input('p', sql.NVarChar(200), passwordHash)
    .query('UPDATE Users SET PasswordHash=@p WHERE UserId=@id AND IsActive=1');
  res.json({ ok: true });
}));

module.exports = router;
