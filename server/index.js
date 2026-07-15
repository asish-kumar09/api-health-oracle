const express = require('express');
const cors = require('cors');
require('dotenv').config();
const cron = require('node-cron');
const { checkAllEndpoints } = require('./utils/monitor');

const endpointsRoute = require('./routes/endpoints');
const logsRoute = require('./routes/logs');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/endpoints', endpointsRoute);
app.use('/api/logs', logsRoute);

app.get('/', (req, res) => {
  res.json({ message: 'API Health Oracle running!' });
});

// Check all endpoints every 30 seconds
cron.schedule('*/30 * * * * *', async () => {
  console.log('🔍 Checking endpoints...');
  await checkAllEndpoints();
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});