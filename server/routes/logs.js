const express = require('express');
const router = express.Router();
const { logs, latencyHistory } = require('../utils/monitor');

// GET all logs
router.get('/', (req, res) => {
  const { endpointId, limit = 50 } = req.query;
  let filtered = endpointId ? logs.filter(l => l.endpointId === endpointId) : logs;
  res.json(filtered.slice(0, parseInt(limit)));
});

// GET latency history for charts
router.get('/latency/:endpointId', (req, res) => {
  const history = latencyHistory[req.params.endpointId] || [];
  res.json(history.slice(-20));
});

module.exports = router;