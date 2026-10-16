const router = require('express').Router();
const { sql, getPool } = require('../db');
const { requireRole } = require('../middleware/auth');
const wrap = require('../utils/wrap');
const httpError = require('../utils/httpError');

router.get('/', wrap(async (req, res) => {
  const pool = await getPool();
  const { recordset } = await pool.request().query(`
    SELECT c.CategoryId, c.Name, c.Emoji, c.SortOrder,
           (SELECT COUNT(*) FROM Products p WHERE p.CategoryId = c.CategoryId AND p.IsActive = 1) AS ItemCount
    FROM Categories c ORDER BY c.SortOrder, c.Name`);
  res.json(recordset);
}));

router.post('/', requireRole('Admin'), wrap(async (req, res) => {
  const { name, emoji, sortOrder = 0 } = req.body || {};
  if (!name) throw httpError(400, 'Category name is required');
  const pool = await getPool();
  const { recordset } = await pool.request()
    .input('n', sql.NVarChar(60), name)
    .input('e', sql.NVarChar(8), emoji || null)
    .input('s', sql.Int, sortOrder)
    .query('INSERT INTO Categories (Name, Emoji, SortOrder) OUTPUT INSERTED.* VALUES (@n,@e,@s)');
  res.status(201).json(recordset[0]);
}));

module.exports = router;
