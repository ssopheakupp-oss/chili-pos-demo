const router = require('express').Router();
const { sql, getPool } = require('../db');
const { requireRole } = require('../middleware/auth');
const wrap = require('../utils/wrap');
const httpError = require('../utils/httpError');

router.get('/', wrap(async (req, res) => {
  const { categoryId, q } = req.query;
  const pool = await getPool();
  const request = pool.request();
  let where = 'p.IsActive = 1';
  if (categoryId) { where += ' AND p.CategoryId = @c'; request.input('c', sql.Int, parseInt(categoryId, 10)); }
  if (q) { where += ' AND p.Name LIKE @q'; request.input('q', sql.NVarChar(150), `%${q}%`); }
  const { recordset } = await request.query(`
    SELECT p.ProductId, p.CategoryId, c.Name AS CategoryName, p.Name, p.Price, p.IsVeg,
           p.DiscountPct, p.Emoji, p.ImageUrl
    FROM Products p JOIN Categories c ON c.CategoryId = p.CategoryId
    WHERE ${where} ORDER BY c.SortOrder, p.Name`);
  res.json(recordset);
}));

function readBody(body) {
  const { categoryId, name, price, isVeg = true, discountPct = 0, emoji, imageUrl } = body || {};
  if (!categoryId || !name || price === undefined || Number(price) < 0) throw httpError(400, 'Category, name and a valid price are required');
  return { categoryId, name, price: Number(price), isVeg: !!isVeg, discountPct, emoji, imageUrl };
}

router.post('/', requireRole('Admin'), wrap(async (req, res) => {
  const b = readBody(req.body);
  const pool = await getPool();
  const { recordset } = await pool.request()
    .input('c', sql.Int, b.categoryId).input('n', sql.NVarChar(150), b.name)
    .input('p', sql.Decimal(10, 2), b.price).input('v', sql.Bit, b.isVeg)
    .input('d', sql.Int, b.discountPct).input('e', sql.NVarChar(8), b.emoji || null)
    .input('i', sql.NVarChar(500), b.imageUrl || null)
    .query(`INSERT INTO Products (CategoryId, Name, Price, IsVeg, DiscountPct, Emoji, ImageUrl)
            OUTPUT INSERTED.* VALUES (@c,@n,@p,@v,@d,@e,@i)`);
  res.status(201).json(recordset[0]);
}));

router.put('/:id', requireRole('Admin'), wrap(async (req, res) => {
  const b = readBody(req.body);
  const pool = await getPool();
  const { recordset } = await pool.request()
    .input('id', sql.Int, req.params.id)
    .input('c', sql.Int, b.categoryId).input('n', sql.NVarChar(150), b.name)
    .input('p', sql.Decimal(10, 2), b.price).input('v', sql.Bit, b.isVeg)
    .input('d', sql.Int, b.discountPct).input('e', sql.NVarChar(8), b.emoji || null)
    .input('i', sql.NVarChar(500), b.imageUrl || null)
    .query(`UPDATE Products SET CategoryId=@c, Name=@n, Price=@p, IsVeg=@v, DiscountPct=@d, Emoji=@e, ImageUrl=@i
            OUTPUT INSERTED.* WHERE ProductId=@id`);
  if (!recordset[0]) throw httpError(404, 'Product not found');
  res.json(recordset[0]);
}));

// Soft delete keeps old orders intact
router.delete('/:id', requireRole('Admin'), wrap(async (req, res) => {
  const pool = await getPool();
  await pool.request().input('id', sql.Int, req.params.id).query('UPDATE Products SET IsActive=0 WHERE ProductId=@id');
  res.status(204).end();
}));

module.exports = router;
