import { useState, useEffect } from "react";
import axios from "axios";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const API = "https://api-health-oracle-1.onrender.com";

const statusColors = {
  up: { bg: "#1f2d1f", color: "#3fb950", label: "UP" },
  down: { bg: "#3d1f1f", color: "#f85149", label: "DOWN" },
  degraded: { bg: "#2d2a1f", color: "#e3b341", label: "DEGRADED" },
  unknown: { bg: "#21262d", color: "#8b949e", label: "UNKNOWN" }
};

export default function Dashboard() {
  const [endpoints, setEndpoints] = useState([]);
  const [logs, setLogs] = useState([]);
  const [latency, setLatency] = useState({});
  const [form, setForm] = useState({ name: "", url: "" });
  const [adding, setAdding] = useState(false);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selected) fetchLatency(selected);
  }, [selected, endpoints]);

  const fetchAll = async () => {
    try {
      const [epRes, logRes] = await Promise.all([
        axios.get(`${API}/api/endpoints`),
        axios.get(`${API}/api/logs?limit=20`)
      ]);
      setEndpoints(epRes.data);
      setLogs(logRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchLatency = async (id) => {
    try {
      const res = await axios.get(`${API}/api/logs/latency/${id}`);
      setLatency(prev => ({ ...prev, [id]: res.data }));
    } catch (err) {}
  };

  const addEndpoint = async () => {
    if (!form.name || !form.url) return;
    setAdding(true);
    try {
      await axios.post(`${API}/api/endpoints`, form);
      setForm({ name: "", url: "" });
      fetchAll();
    } catch (err) {
      alert("Error adding endpoint");
    } finally {
      setAdding(false);
    }
  };

  const deleteEndpoint = async (id) => {
    await axios.delete(`${API}/api/endpoints/${id}`);
    fetchAll();
  };

  const stats = {
    total: endpoints.length,
    up: endpoints.filter(e => e.status === "up").length,
    down: endpoints.filter(e => e.status === "down").length,
    degraded: endpoints.filter(e => e.status === "degraded").length
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0d1117", color: "white", fontFamily: "system-ui" }}>
      {/* Header */}
      <div style={{ background: "#161b22", borderBottom: "1px solid #30363d", padding: "1rem 2rem",
        display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>🔮 API Health Oracle</h1>
        <span style={{ fontSize: 12, color: "#8b949e" }}>Auto-refreshes every 5s</span>
      </div>

      <div style={{ padding: "1.5rem 2rem" }}>
        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 12, marginBottom: 24 }}>
          {[
            { label: "Total", value: stats.total, color: "white" },
            { label: "Up", value: stats.up, color: "#3fb950" },
            { label: "Down", value: stats.down, color: "#f85149" },
            { label: "Degraded", value: stats.degraded, color: "#e3b341" }
          ].map(s => (
            <div key={s.label} style={{ background: "#161b22", border: "1px solid #30363d",
              borderRadius: 8, padding: "1rem", textAlign: "center" }}>
              <div style={{ fontSize: 28, fontWeight: 600, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: "#8b949e" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Add endpoint form */}
        <div style={{ background: "#161b22", border: "1px solid #30363d", borderRadius: 8,
          padding: "1rem", marginBottom: 24 }}>
          <h3 style={{ margin: "0 0 12px", fontSize: 14, color: "#8b949e" }}>ADD ENDPOINT</h3>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input placeholder="Name (e.g. GitHub API)"
              value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              style={{ flex: 1, minWidth: 150, padding: "8px 12px", borderRadius: 6,
                border: "1px solid #30363d", background: "#0d1117", color: "white", fontSize: 13 }} />
            <input placeholder="URL (e.g. https://api.github.com)"
              value={form.url} onChange={e => setForm({ ...form, url: e.target.value })}
              style={{ flex: 2, minWidth: 200, padding: "8px 12px", borderRadius: 6,
                border: "1px solid #30363d", background: "#0d1117", color: "white", fontSize: 13 }} />
            <button onClick={addEndpoint} disabled={adding} style={{
              padding: "8px 16px", borderRadius: 6, background: "#238636",
              color: "white", border: "none", cursor: "pointer", fontSize: 13 }}>
              {adding ? "Adding..." : "+ Add"}
            </button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {/* Endpoints list */}
          <div>
            <h3 style={{ fontSize: 14, color: "#8b949e", margin: "0 0 12px" }}>MONITORED ENDPOINTS</h3>
            {endpoints.length === 0 ? (
              <div style={{ color: "#8b949e", fontSize: 13, padding: "2rem", textAlign: "center",
                background: "#161b22", borderRadius: 8, border: "1px solid #30363d" }}>
                No endpoints yet — add one above!
              </div>
            ) : (
              endpoints.map(ep => (
                <div key={ep.id} onClick={() => setSelected(ep.id === selected ? null : ep.id)}
                  style={{ background: "#161b22", border: `1px solid ${selected === ep.id ? "#58a6ff" : "#30363d"}`,
                    borderRadius: 8, padding: "0.75rem 1rem", marginBottom: 8, cursor: "pointer" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontWeight: 500, fontSize: 14 }}>{ep.name}</div>
                      <div style={{ fontSize: 11, color: "#8b949e", marginTop: 2 }}>{ep.url}</div>
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={{ fontSize: 11, color: "#8b949e" }}>
                        {ep.latency ? `${ep.latency}ms` : "--"}
                      </span>
                      <span style={{ padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 500,
                        background: statusColors[ep.status]?.bg,
                        color: statusColors[ep.status]?.color }}>
                        {statusColors[ep.status]?.label}
                      </span>
                      <button onClick={e => { e.stopPropagation(); deleteEndpoint(ep.id); }}
                        style={{ background: "none", border: "none", color: "#f85149",
                          cursor: "pointer", fontSize: 16 }}>×</button>
                    </div>
                  </div>
                  {/* Latency chart */}
                  {selected === ep.id && latency[ep.id]?.length > 0 && (
                    <div style={{ marginTop: 12 }}>
                      <div style={{ fontSize: 11, color: "#8b949e", marginBottom: 6 }}>Latency history (ms)</div>
                      <ResponsiveContainer width="100%" height={80}>
                        <LineChart data={latency[ep.id].map((v, i) => ({ i, v }))}>
                          <Line type="monotone" dataKey="v" stroke="#58a6ff" dot={false} strokeWidth={2} />
                          <YAxis hide />
                          <XAxis hide />
                          <Tooltip formatter={v => [`${v}ms`, "Latency"]} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Recent logs */}
          <div>
            <h3 style={{ fontSize: 14, color: "#8b949e", margin: "0 0 12px" }}>RECENT LOGS</h3>
            <div style={{ background: "#161b22", border: "1px solid #30363d", borderRadius: 8, overflow: "hidden" }}>
              {logs.length === 0 ? (
                <div style={{ color: "#8b949e", fontSize: 13, padding: "2rem", textAlign: "center" }}>
                  No logs yet — add an endpoint to start monitoring!
                </div>
              ) : (
                logs.map(log => (
                  <div key={log.id} style={{ padding: "0.6rem 1rem", borderBottom: "1px solid #21262d",
                    display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <span style={{ fontSize: 12, color: statusColors[log.status]?.color }}>
                        {statusColors[log.status]?.label}
                      </span>
                      <span style={{ fontSize: 12, color: "#8b949e", marginLeft: 8 }}>{log.endpointName}</span>
                      {log.anomaly && <span style={{ fontSize: 11, color: "#e3b341", marginLeft: 6 }}>⚠ anomaly</span>}
                    </div>
                    <div style={{ fontSize: 11, color: "#8b949e" }}>
                      {log.latency}ms • {new Date(log.checkedAt).toLocaleTimeString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}