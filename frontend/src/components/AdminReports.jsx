import { useEffect, useState } from "react";
import { listReports, updateReport } from "../api/moderation";
import { useToast } from "../context/ToastContext";

const STATUS_OPTIONS = ["open", "reviewed", "dismissed"];

export default function AdminReports() {
  const showToast = useToast();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  const load = () => {
    setLoading(true);
    listReports(filter || undefined).then((data) => setReports(data.reports)).finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [filter]);

  const handleStatusChange = async (report, status) => {
    try {
      await updateReport(report.id, status);
      showToast("Report updated.", "success");
      load();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  return (
    <section className="search-panel">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 className="section-title" style={{ marginBottom: 0 }}>User Reports</h2>
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {loading ? (
        <p className="empty-msg">Loading reports…</p>
      ) : reports.length === 0 ? (
        <p className="empty-msg">No reports found.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {reports.map((r) => (
            <div key={r.id} className="request-card" style={{ alignItems: "flex-start" }}>
              <div className="req-info">
                <strong>{r.reported_user.name}</strong> reported by {r.reporter.name}
                <span>Reason: {r.reason.replace("_", " ")} · {new Date(r.created_at).toLocaleString()}</span>
                {r.details && <span>"{r.details}"</span>}
              </div>
              <select value={r.status} onChange={(e) => handleStatusChange(r, e.target.value)}>
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
