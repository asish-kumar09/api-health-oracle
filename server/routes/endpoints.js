const express = require('express');
const router = express.Router();
const { endpoints } = require('../utils/monitor');

// GET all endpoints
router.get('/', (req, res) => {
  res.json(endpoints);
});

// POST add new endpoint
router.post('/', (req, res) => {
  const { name, url } = req.body;
  if (!name || !url) return res.status(400).json({ error: 'Name and URL required' });
  
  const endpoint = {
    id: Date.now().toString(),
    name,
    url,
    status: 'unknown',
    latency: null,
    lastChecked: null,
    createdAt: new Date().toISOString()
  };
  
  endpoints.push(endpoint);
  res.status(201).json(endpoint);
});

// DELETE endpoint
router.delete('/:id', (req, res) => {
  const index = endpoints.findIndex(e => e.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Not found' });
  endpoints.splice(index, 1);
  res.json({ success: true });
});

module.exports = router;