const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sql, getPool } = require('../db');
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

module.exports = router;
