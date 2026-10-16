const router = require('express').Router();
const { sql, getPool } = require('../db');
const wrap = require('../utils/wrap');
const httpError = require('../utils/httpError');

router.get('/', wrap(async (req, res) => {
  const pool = await getPool();
  const { recordset } = await pool.request().query(`
    SELECT r.*, t.TableName FROM Reservations r JOIN DiningTables t ON t.TableId = r.TableId
    WHERE r.ReservedFor >= DATEADD(DAY, -1, SYSDATETIME()) ORDER BY r.ReservedFor`);
  res.json(recordset);
}));

router.post('/', wrap(async (req, res) => {
  const { tableId, customerName, phone, guests = 2, reservedFor, notes } = req.body || {};
  if (!tableId || !customerName || !reservedFor) throw httpError(400, 'Table, guest name and time are required');
  const pool = await getPool();
  const clash = await pool.request()
    .input('t', sql.Int, tableId).input('d', sql.DateTime2, new Date(reservedFor))
    .query(`SELECT 1 FROM Reservations WHERE TableId=@t AND Status='Booked'
            AND ABS(DATEDIFF(MINUTE, ReservedFor, @d)) < 90`);
  if (clash.recordset.length) throw httpError(409, 'That table is already booked within 90 minutes of this time');
  const { recordset } = await pool.request()
    .input('t', sql.Int, tableId).input('c', sql.NVarChar(100), customerName)
    .input('p', sql.NVarChar(30), phone || null).input('g', sql.Int, guests)
    .input('d', sql.DateTime2, new Date(reservedFor)).input('n', sql.NVarChar(255), notes || null)
    .query(`INSERT INTO Reservations (TableId, CustomerName, Phone, Guests, ReservedFor, Notes)
            OUTPUT INSERTED.* VALUES (@t,@c,@p,@g,@d,@n)`);
  res.status(201).json(recordset[0]);
}));

router.patch('/:id/status', wrap(async (req, res) => {
  const { status } = req.body || {};
  if (!['Booked', 'Seated', 'Cancelled', 'NoShow'].includes(status)) throw httpError(400, 'Invalid status');
  const pool = await getPool();
  await pool.request().input('id', sql.Int, req.params.id).input('s', sql.NVarChar(20), status)
    .query('UPDATE Reservations SET Status=@s WHERE ReservationId=@id');
  res.json({ ok: true });
}));

module.exports = router;
