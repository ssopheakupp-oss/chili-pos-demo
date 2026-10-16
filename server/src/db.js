const useWindowsAuth = process.env.DB_TRUSTED_CONNECTION === 'true';
const sql = useWindowsAuth ? require('mssql/msnodesqlv8') : require('mssql');

const config = {
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_NAME || 'ChiliPOS',
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_CERT !== 'false',
    enableArithAbort: true,
    ...(process.env.DB_INSTANCE ? { instanceName: process.env.DB_INSTANCE } : {}),
  },
  pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
};

if (useWindowsAuth) {
  const server = process.env.DB_INSTANCE
    ? `${config.server}\\${process.env.DB_INSTANCE}`
    : `${config.server},${process.env.DB_PORT || '1433'}`;
  config.connectionString = [
    'Driver={ODBC Driver 18 for SQL Server}',
    `Server={${server}}`,
    `Database={${config.database}}`,
    'Trusted_Connection=yes',
    'Encrypt=no',
  ].join(';') + ';';
} else {
  config.user = process.env.DB_USER;
  config.password = process.env.DB_PASSWORD;
  config.port = parseInt(process.env.DB_PORT || '1433', 10);
  if (process.env.DB_INSTANCE) delete config.port;
}

let poolPromise;
function getPool() {
  if (!poolPromise) {
    poolPromise = new sql.ConnectionPool(config)
      .connect()
      .then((pool) => {
        console.log(`Connected to SQL Server: ${config.server}/${config.database}`);
        return pool;
      })
      .catch((err) => {
        poolPromise = null;
        throw err;
      });
  }
  return poolPromise;
}

module.exports = { sql, getPool };
