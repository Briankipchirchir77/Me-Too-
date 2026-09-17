import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { createEvent, deleteEvent, listEvents, updateEvent } from "../api/events";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import AdminReports from "../components/AdminReports";

const CATEGORIES = ["Sports", "Arts", "Tech", "Food", "Music", "Outdoors"];

const EMPTY_FORM = {
  title: "", category: CATEGORIES[0], starts_at: "", location: "", capacity: "", emoji: "", color: "#cce5ff",
};

function toDatetimeLocal(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function Admin() {
  const { user, loading: authLoading } = useAuth();
  const showToast = useToast();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [tab, setTab] = useState("events");

  const load = () => {
    setLoading(true);
    listEvents().then((data) => setEvents(data.events)).finally(() => setLoading(false));
  };

  useEffect(() => {
    if (user?.is_admin) load();
  }, [user]);

  if (authLoading) return null;
  if (!user || !user.is_admin) return <Navigate to="/" replace />;

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
  };

  const startEdit = (event) => {
    setEditingId(event.id);
    setForm({
      title: event.title,
      category: event.category,
      starts_at: toDatetimeLocal(event.starts_at),
      location: event.location,
      capacity: event.capacity,
      emoji: event.emoji || "",
      color: event.color || "#cce5ff",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.category || !form.starts_at || !form.location || !form.capacity) {
      showToast("Please fill in all required fields.", "error");
      return;
    }
    setSubmitting(true);
    const payload = { ...form, capacity: Number(form.capacity) };
    try {
      if (editingId) {
        await updateEvent(editingId, payload);
        showToast("Event updated.", "success");
      } else {
        await createEvent(payload);
        showToast("Event created! 🎉", "success");
      }
      resetForm();
      load();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (event) => {
    if (!confirm(`Delete "${event.title}"? This can't be undone.`)) return;
    try {
      await deleteEvent(event.id);
      showToast("Event deleted.", "success");
      load();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  return (
    <div>
      <div className="page-hero events-hero">
        <h1>🛠️ Admin</h1>
        <p>Manage events and review user reports.</p>
      </div>
      <main className="main-content">
        <div className="events-filter-tabs">
          <button className={`evt-tab ${tab === "events" ? "active" : ""}`} onClick={() => setTab("events")}>Events</button>
          <button className={`evt-tab ${tab === "reports" ? "active" : ""}`} onClick={() => setTab("reports")}>Reports</button>
        </div>

        {tab === "reports" && <AdminReports />}

        {tab === "events" && (
        <>
        <section className="search-panel">
          <h2 className="section-title" style={{ marginBottom: 20 }}>
            {editingId ? "Edit Event" : "Create Event"}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Title</label>
                <input type="text" value={form.title} onChange={update("title")} placeholder="Event title" />
              </div>
              <div className="form-group">
                <label>Category</label>
                <select value={form.category} onChange={update("category")}>
                  {CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Date &amp; Time</label>
                <input type="datetime-local" value={form.starts_at} onChange={update("starts_at")} />
              </div>
              <div className="form-group">
                <label>Location</label>
                <input type="text" value={form.location} onChange={update("location")} placeholder="Venue, City" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Capacity</label>
                <input type="number" min="1" value={form.capacity} onChange={update("capacity")} placeholder="30" />
              </div>
              <div className="form-group">
                <label>Emoji</label>
                <input type="text" value={form.emoji} onChange={update("emoji")} placeholder="🎉" />
              </div>
            </div>
            <div className="form-group">
              <label>Banner Color</label>
              <input type="color" value={form.color} onChange={update("color")} style={{ height: 44, padding: 4 }} />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="form-submit" type="submit" disabled={submitting}>
                {submitting ? "Saving…" : editingId ? "Save Changes" : "Create Event →"}
              </button>
              {editingId && (
                <button type="button" className="btn-view" onClick={resetForm}>Cancel</button>
              )}
            </div>
          </form>
        </section>

        <section>
          <h2 className="section-title">All Events</h2>
          {loading ? (
            <p className="empty-msg">Loading events…</p>
          ) : (
            <div className="events-grid" style={{ padding: 0 }}>
              {events.map((event) => (
                <div className="event-card" key={event.id}>
                  <div className="event-banner" style={{ background: event.color }}>{event.emoji}</div>
                  <div className="event-body">
                    <div className="event-category">{event.category}</div>
                    <div className="event-title">{event.title}</div>
                    <div className="event-meta">
                      <span>📅 {new Date(event.starts_at).toLocaleString()}</span>
                      <span>📍 {event.location}</span>
                    </div>
                    <div className="event-footer">
                      <div className="event-attendees">👥 {event.attendee_count}/{event.capacity} going</div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button className="btn-view" onClick={() => startEdit(event)}>✏️ Edit</button>
                        <button className="btn-reject" onClick={() => handleDelete(event)}>🗑 Delete</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
        </>
        )}
      </main>
    </div>
  );
}
