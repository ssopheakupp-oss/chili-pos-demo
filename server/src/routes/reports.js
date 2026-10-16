const router = require('express').Router();
const { sql, getPool } = require('../db');
const { requireRole } = require('../middleware/auth');
const wrap = require('../utils/wrap');

router.get('/summary', requireRole('Admin', 'Cashier'), wrap(async (req, res) => {
  const date = req.query.date ? new Date(req.query.date) : new Date();
  const pool = await getPool();
  const run = (q) => pool.request().input('d', sql.Date, date).query(q).then((r) => r.recordset);
  const paid = `FROM Orders WHERE Status='Paid' AND CAST(PaidAt AS DATE)=@d`;

  const [totals, byMethod, byType, byTrafficSource, top] = await Promise.all([
    run(`SELECT COUNT(*) AS Orders, ISNULL(SUM(Total),0) AS Revenue, ISNULL(SUM(TaxAmount),0) AS Tax,
                ISNULL(AVG(Total),0) AS AvgOrder ${paid}`),
    run(`SELECT PaymentMethod, COUNT(*) AS Orders, SUM(Total) AS Revenue ${paid} GROUP BY PaymentMethod`),
    run(`SELECT OrderType, COUNT(*) AS Orders, SUM(Total) AS Revenue ${paid} GROUP BY OrderType`),
    run(`SELECT TrafficSource, COUNT(*) AS Orders, SUM(Total) AS Revenue ${paid}
         GROUP BY TrafficSource ORDER BY Revenue DESC`),
    run(`SELECT TOP 5 oi.ProductName, SUM(oi.Quantity) AS Qty, SUM(oi.Quantity * oi.UnitPrice) AS Revenue
         FROM OrderItems oi JOIN Orders o ON o.OrderId = oi.OrderId
         WHERE o.Status='Paid' AND CAST(o.PaidAt AS DATE)=@d
         GROUP BY oi.ProductName ORDER BY Qty DESC`),
  ]);
  res.json({ ...totals[0], byMethod, byType, byTrafficSource, top });
}));

module.exports = router;
