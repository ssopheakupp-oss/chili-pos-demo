require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { getPool } = require('./db');
const { seedUsers } = require('./seed');
const { auth } = require('./middleware/auth');

const app = express();
app.use(helmet());
app.use(cors({ origin: (process.env.CLIENT_ORIGIN || 'http://localhost:5173').split(',') }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

app.get('/api/health', async (req, res) => {
  try {
    await (await getPool()).request().query('SELECT 1 AS ok');
    res.json({ status: 'ok', database: 'connected' });
  } catch (e) {
    res.status(503).json({ status: 'error', database: e.message });
  }
});

app.use('/api/auth', require('./routes/auth'));

// Everything below requires a signed-in user
app.use('/api', auth);
app.use('/api/categories', require('./routes/categories'));
app.use('/api/products', require('./routes/products'));
app.use('/api/tables', require('./routes/tables'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/reservations', require('./routes/reservations'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/settings', require('./routes/settings'));

app.use('/api', (req, res) => res.status(404).json({ message: 'Not found' }));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = err.status || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({ message: status >= 500 ? 'Something went wrong on the server' : err.message });
});

const port = process.env.PORT || 5000;
getPool()
  .then(seedUsers)
  .then(() => app.listen(port, () => console.log(`Chili POS API on http://localhost:${port}`)))
  .catch((err) => {
    console.error('Could not start. Check your SQL Server settings in .env\n', err.message);
    process.exit(1);
  });
