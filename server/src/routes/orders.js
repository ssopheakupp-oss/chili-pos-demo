const router = require('express').Router();
const { sql, getPool } = require('../db');
const wrap = require('../utils/wrap');
const httpError = require('../utils/httpError');

const ORDER_TYPES = ['DineIn', 'TakeAway', 'Delivery'];
const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

async function getTaxRate(pool) {
  const { recordset } = await pool.request().query("SELECT SettingValue FROM Settings WHERE SettingKey='TaxRate'");
  return recordset[0] ? parseFloat(recordset[0].SettingValue) : 0;
}

// Prices always come from the database, never from the browser
async function priceItems(tx, items) {
  if (!Array.isArray(items) || !items.length) throw httpError(400, 'Add at least one item to the order');
  const ids = [...new Set(items.map((i) => parseInt(i.productId, 10)))];
  const request = new sql.Request(tx);
  ids.forEach((id, i) => request.input(`p${i}`, sql.Int, id));
  const { recordset } = await request.query(
    `SELECT ProductId, Name, Price, DiscountPct FROM Products
     WHERE IsActive=1 AND ProductId IN (${ids.map((_, i) => '@p' + i).join(',')})`);
  const map = new Map(recordset.map((p) => [p.ProductId, p]));
  return items.map((i) => {
    const p = map.get(parseInt(i.productId, 10));
    const qty = parseInt(i.qty, 10);
    if (!p || !(qty > 0) || qty > 99) throw httpError(400, 'One of the items is no longer available');
    const unit = round2(Number(p.Price) * (1 - p.DiscountPct / 100));
    return { productId: p.ProductId, name: p.Name, price: unit, qty, note: i.note || null };
  });
}

async function writeItems(tx, orderId, priced, taxRate) {
  await new sql.Request(tx).input('id', sql.Int, orderId).query('DELETE FROM OrderItems WHERE OrderId=@id');
  for (const it of priced) {
    await new sql.Request(tx)
      .input('o', sql.Int, orderId).input('p', sql.Int, it.productId)
      .input('n', sql.NVarChar(150), it.name).input('u', sql.Decimal(10, 2), it.price)
      .input('q', sql.Int, it.qty).input('no', sql.NVarChar(255), it.note)
      .query(`INSERT INTO OrderItems (OrderId, ProductId, ProductName, UnitPrice, Quantity, Note)
              VALUES (@o,@p,@n,@u,@q,@no)`);
  }
  const sub = round2(priced.reduce((s, i) => s + i.price * i.qty, 0));
  const tax = round2((sub * taxRate) / 100);
  await new sql.Request(tx)
    .input('id', sql.Int, orderId).input('s', sql.Decimal(10, 2), sub).input('r', sql.Decimal(5, 2), taxRate)
    .input('t', sql.Decimal(10, 2), tax).input('tot', sql.Decimal(10, 2), round2(sub + tax))
    .query(`UPDATE Orders SET SubTotal=@s, TaxRate=@r, TaxAmount=@t, Total=@tot, UpdatedAt=SYSDATETIME()
            WHERE OrderId=@id`);
}

async function withTx(fn) {
  const pool = await getPool();
  const tx = new sql.Transaction(pool);
  await tx.begin();
  try {
    const result = await fn(tx, pool);
    await tx.commit();
    return result;
  } catch (err) {
    await tx.rollback().catch(() => {});
    throw err;
  }
}

async function loadOrder(pool, id) {
  const head = await pool.request().input('id', sql.Int, id).query(`
    SELECT o.*, t.TableName FROM Orders o LEFT JOIN DiningTables t ON t.TableId = o.TableId
    WHERE o.OrderId = @id`);
  if (!head.recordset[0]) throw httpError(404, 'Order not found');
  const items = await pool.request().input('id', sql.Int, id).query(`
    SELECT oi.OrderItemId, oi.ProductId, oi.ProductName, oi.UnitPrice, oi.Quantity, oi.Note, p.IsVeg, p.Emoji
    FROM OrderItems oi JOIN Products p ON p.ProductId = oi.ProductId WHERE oi.OrderId = @id`);
  return { ...head.recordset[0], items: items.recordset };
}

/* ---------- Lists ---------- */
router.get('/active', wrap(async (req, res) => {
  const pool = await getPool();
  const { recordset } = await pool.request().query(`
    SELECT o.OrderId, o.OrderNo, o.OrderType, o.Status, o.Total, o.TableId, t.TableName, o.CustomerName,
           (SELECT ISNULL(SUM(Quantity),0) FROM OrderItems WHERE OrderId = o.OrderId) AS ItemCount
    FROM Orders o LEFT JOIN DiningTables t ON t.TableId = o.TableId
    WHERE o.Status IN ('InKitchen','Served') ORDER BY o.CreatedAt DESC`);
  res.json(recordset);
}));

router.get('/', wrap(async (req, res) => {
  const { date, type } = req.query;
  const pool = await getPool();
  const request = pool.request();
  let where = '1=1';
  if (date) { where += ' AND CAST(o.CreatedAt AS DATE) = @d'; request.input('d', sql.Date, new Date(date)); }
  if (type && ORDER_TYPES.includes(type)) { where += ' AND o.OrderType = @t'; request.input('t', sql.NVarChar(20), type); }
  const { recordset } = await request.query(`
    SELECT TOP 200 o.OrderId, o.OrderNo, o.OrderType, o.Status, o.Total, o.PaymentMethod, o.CreatedAt, o.PaidAt,
           o.CustomerName, o.CustomerPhone, o.DeliveryAddress, t.TableName
    FROM Orders o LEFT JOIN DiningTables t ON t.TableId = o.TableId
    WHERE ${where} ORDER BY o.CreatedAt DESC`);
  res.json(recordset);
}));

router.get('/:id', wrap(async (req, res) => {
  res.json(await loadOrder(await getPool(), parseInt(req.params.id, 10)));
}));

/* ---------- Create ---------- */
router.post('/', wrap(async (req, res) => {
  const { tableId, orderType = 'DineIn', items, customerName, customerPhone, deliveryAddress } = req.body || {};
  if (!ORDER_TYPES.includes(orderType)) throw httpError(400, 'Invalid order type');
  if (orderType === 'DineIn' && !tableId) throw httpError(400, 'Choose a table for dine-in orders');
  if (orderType === 'Delivery' && (!deliveryAddress || !customerPhone)) throw httpError(400, 'Delivery needs a phone number and address');

  const orderId = await withTx(async (tx, pool) => {
    const taxRate = await getTaxRate(pool);
    const priced = await priceItems(tx, items);

    if (orderType === 'DineIn') {
      const busy = await new sql.Request(tx).input('t', sql.Int, tableId)
        .query("SELECT 1 FROM Orders WHERE TableId=@t AND Status IN ('InKitchen','Served')");
      if (busy.recordset.length) throw httpError(409, 'This table already has an open order. Open it from the bottom bar');
    }

    const { recordset } = await new sql.Request(tx)
      .input('t', sql.Int, orderType === 'DineIn' ? tableId : null)
      .input('ty', sql.NVarChar(20), orderType)
      .input('cn', sql.NVarChar(100), customerName || null)
      .input('cp', sql.NVarChar(30), customerPhone || null)
      .input('da', sql.NVarChar(300), deliveryAddress || null)
      .input('by', sql.Int, req.user.id)
      .query(`INSERT INTO Orders (TableId, OrderType, CustomerName, CustomerPhone, DeliveryAddress, CreatedBy)
              OUTPUT INSERTED.OrderId VALUES (@t,@ty,@cn,@cp,@da,@by)`);
    const id = recordset[0].OrderId;
    await writeItems(tx, id, priced, taxRate);
    if (orderType === 'DineIn') {
      await new sql.Request(tx).input('t', sql.Int, tableId)
        .query("UPDATE DiningTables SET Status='Occupied' WHERE TableId=@t");
    }
    return id;
  });
  res.status(201).json(await loadOrder(await getPool(), orderId));
}));

/* ---------- Update items of an open order ---------- */
router.put('/:id', wrap(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  await withTx(async (tx, pool) => {
    const cur = await new sql.Request(tx).input('id', sql.Int, id).query('SELECT Status FROM Orders WHERE OrderId=@id');
    if (!cur.recordset[0]) throw httpError(404, 'Order not found');
    if (!['InKitchen', 'Served'].includes(cur.recordset[0].Status)) throw httpError(409, 'This order is closed and cannot be changed');
    await writeItems(tx, id, await priceItems(tx, req.body?.items), await getTaxRate(pool));
  });
  res.json(await loadOrder(await getPool(), id));
}));

/* ---------- Pay ---------- */
router.post('/:id/pay', wrap(async (req, res) => {
  const { paymentMethod } = req.body || {};
  if (!['Cash', 'Card', 'QR'].includes(paymentMethod)) throw httpError(400, 'Choose Cash, Card or QR');
  const id = parseInt(req.params.id, 10);
  await withTx(async (tx) => {
    const r = await new sql.Request(tx).input('id', sql.Int, id).input('m', sql.NVarChar(20), paymentMethod)
      .query(`UPDATE Orders SET Status='Paid', PaymentMethod=@m, PaidAt=SYSDATETIME(), UpdatedAt=SYSDATETIME()
              OUTPUT INSERTED.TableId WHERE OrderId=@id AND Status IN ('InKitchen','Served')`);
    if (!r.recordset[0]) throw httpError(409, 'This order is already closed');
    if (r.recordset[0].TableId) {
      await new sql.Request(tx).input('t', sql.Int, r.recordset[0].TableId)
        .query("UPDATE DiningTables SET Status='Available' WHERE TableId=@t");
    }
  });
  res.json(await loadOrder(await getPool(), id));
}));

/* ---------- Kitchen / cancel status ---------- */
router.patch('/:id/status', wrap(async (req, res) => {
  const { status } = req.body || {};
  if (!['InKitchen', 'Served', 'Cancelled'].includes(status)) throw httpError(400, 'Invalid status');
  const id = parseInt(req.params.id, 10);
  await withTx(async (tx) => {
    const r = await new sql.Request(tx).input('id', sql.Int, id).input('s', sql.NVarChar(20), status)
      .query(`UPDATE Orders SET Status=@s, UpdatedAt=SYSDATETIME() OUTPUT INSERTED.TableId
              WHERE OrderId=@id AND Status IN ('InKitchen','Served')`);
    if (!r.recordset[0]) throw httpError(409, 'This order is already closed');
    if (status === 'Cancelled' && r.recordset[0].TableId) {
      await new sql.Request(tx).input('t', sql.Int, r.recordset[0].TableId)
        .query("UPDATE DiningTables SET Status='Available' WHERE TableId=@t");
    }
  });
  res.json(await loadOrder(await getPool(), id));
}));

module.exports = router;
