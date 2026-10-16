const bcrypt = require('bcryptjs');
const { sql, getPool } = require('./db');

// Creates default users on first run (only if the Users table is empty)
async function seedUsers() {
  const pool = await getPool();
  const { recordset } = await pool.request().query('SELECT COUNT(*) AS n FROM Users');
  if (recordset[0].n > 0) return;

  const users = [
    ['Admin', 'admin', 'admin123', 'Admin'],
    ['Floyd Miles', 'floyd', 'floyd123', 'Cashier'],
    ['Arlene McCoy', 'arlene', 'arlene123', 'Waiter'],
  ];
  for (const [fullName, username, password, role] of users) {
    await pool
      .request()
      .input('f', sql.NVarChar(100), fullName)
      .input('u', sql.NVarChar(50), username)
      .input('p', sql.NVarChar(200), await bcrypt.hash(password, 10))
      .input('r', sql.NVarChar(20), role)
      .query('INSERT INTO Users (FullName, Username, PasswordHash, Role) VALUES (@f,@u,@p,@r)');
  }
  console.log('Seeded default users: admin/admin123, floyd/floyd123, arlene/arlene123');
}

module.exports = { seedUsers };
