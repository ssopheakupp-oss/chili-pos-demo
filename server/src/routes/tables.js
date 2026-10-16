const router = require('express').Router();
const { sql, getPool } = require('../db');
const { requireRole } = require('../middleware/auth');
const wrap = require('../utils/wrap');
const httpError = require('../utils/httpError');

router.get('/', wrap(async (req, res) => {
  const pool = await getPool();
  const { recordset } = await pool.request().query(`
    SELECT t.TableId, t.TableName, t.Seats, t.Status,
           o.OrderId AS ActiveOrderId, o.Total AS ActiveTotal
    FROM DiningTables t
    LEFT JOIN Orders o ON o.TableId = t.TableId AND o.Status IN ('InKitchen','Served')
    ORDER BY t.TableId`);
  res.json(recordset);
}));

router.post('/', requireRole('Admin'), wrap(async (req, res) => {
  const { tableName, seats = 4 } = req.body || {};
  if (!tableName) throw httpError(400, 'Table name is required');
  const pool = await getPool();
  const { recordset } = await pool.request()
    .input('n', sql.NVarChar(30), tableName).input('s', sql.Int, seats)
    .query('INSERT INTO DiningTables (TableName, Seats) OUTPUT INSERTED.* VALUES (@n,@s)');
  res.status(201).json(recordset[0]);
}));

router.patch('/:id/status', wrap(async (req, res) => {
  const { status } = req.body || {};
  if (!['Available', 'Occupied', 'Reserved'].includes(status)) throw httpError(400, 'Invalid table status');
  const pool = await getPool();
  await pool.request().input('id', sql.Int, req.params.id).input('s', sql.NVarChar(20), status)
    .query('UPDATE DiningTables SET Status=@s WHERE TableId=@id');
  res.json({ ok: true });
}));

module.exports = router;
