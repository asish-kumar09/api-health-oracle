const axios = require('axios');
const nodemailer = require('nodemailer');

// In-memory store
const endpoints = [];
const logs = [];
const latencyHistory = {};

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

async function sendAlert(endpoint, reason) {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.ALERT_EMAIL,
      subject: `🚨 API Alert: ${endpoint.name} is down!`,
      html: `
        <h2>API Health Oracle Alert</h2>
        <p><strong>Endpoint:</strong> ${endpoint.name}</p>
        <p><strong>URL:</strong> ${endpoint.url}</p>
        <p><strong>Reason:</strong> ${reason}</p>
        <p><strong>Time:</strong> ${new Date().toISOString()}</p>
      `
    });
    console.log(`📧 Alert sent for ${endpoint.name}`);
  } catch (err) {
    console.error('Email error:', err.message);
  }
}

function detectAnomaly(endpointId) {
  const history = latencyHistory[endpointId] || [];
  if (history.length < 5) return false;
  const avg = history.slice(-10).reduce((a, b) => a + b, 0) / Math.min(history.length, 10);
  const latest = history[history.length - 1];
  return latest > avg * 2.5; // 2.5x slower than average = anomaly
}

async function checkEndpoint(endpoint) {
  const start = Date.now();
  let status = 'up';
  let latency = 0;
  let statusCode = null;
  let error = null;
  let anomaly = false;

  try {
    const res = await axios.get(endpoint.url, { timeout: 10000 });
    latency = Date.now() - start;
    statusCode = res.status;

    if (!latencyHistory[endpoint.id]) latencyHistory[endpoint.id] = [];
    latencyHistory[endpoint.id].push(latency);

    anomaly = detectAnomaly(endpoint.id);
    if (anomaly) {
      status = 'degraded';
      await sendAlert(endpoint, `Response time ${latency}ms is 2.5x slower than average`);
    }
  } catch (err) {
    latency = Date.now() - start;
    status = 'down';
    error = err.message;
    await sendAlert(endpoint, error);
  }

  const log = {
    id: logs.length + 1,
    endpointId: endpoint.id,
    endpointName: endpoint.name,
    status,
    latency,
    statusCode,
    error,
    anomaly,
    checkedAt: new Date().toISOString()
  };

  logs.unshift(log);
  if (logs.length > 500) logs.pop();

  // Update endpoint status
  const ep = endpoints.find(e => e.id === endpoint.id);
  if (ep) {
    ep.status = status;
    ep.lastChecked = log.checkedAt;
    ep.latency = latency;
  }

  return log;
}

async function checkAllEndpoints() {
  await Promise.all(endpoints.map(ep => checkEndpoint(ep)));
}

module.exports = { endpoints, logs, latencyHistory, checkAllEndpoints };