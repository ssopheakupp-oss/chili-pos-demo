const router = require('express').Router();
const { sql, getPool } = require('../db');
const { requireRole } = require('../middleware/auth');
const wrap = require('../utils/wrap');
const httpError = require('../utils/httpError');

router.get('/', wrap(async (req, res) => {
  const pool = await getPool();
  const { recordset } = await pool.request().query('SELECT SettingKey, SettingValue FROM Settings');
  res.json(Object.fromEntries(recordset.map((r) => [r.SettingKey, r.SettingValue])));
}));

router.put('/', requireRole('Admin'), wrap(async (req, res) => {
  const allowed = ['RestaurantName', 'TaxRate', 'Currency'];
  const pool = await getPool();
  for (const [key, value] of Object.entries(req.body || {})) {
    if (!allowed.includes(key)) continue;
    if (key === 'TaxRate' && (isNaN(value) || value < 0 || value > 100)) throw httpError(400, 'Tax must be between 0 and 100');
    await pool.request().input('k', sql.NVarChar(50), key).input('v', sql.NVarChar(255), String(value))
      .query(`MERGE Settings AS t USING (SELECT @k AS k, @v AS v) AS s ON t.SettingKey = s.k
              WHEN MATCHED THEN UPDATE SET SettingValue = s.v
              WHEN NOT MATCHED THEN INSERT (SettingKey, SettingValue) VALUES (s.k, s.v);`);
  }
  res.json({ ok: true });
}));

module.exports = router;
