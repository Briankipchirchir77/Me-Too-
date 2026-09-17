function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  });
}

export default function EventCard({ event, onRsvp }) {
  return (
    <div className="event-card">
      <div className="event-banner" style={{ background: event.color }}>{event.emoji}</div>
      <div className="event-body">
        <div className="event-category">{event.category}</div>
        <div className="event-title">{event.title}</div>
        <div className="event-meta">
          <span>📅 {formatDate(event.starts_at)}</span>
          <span>📍 {event.location}</span>
        </div>
        <div className="event-footer">
          <div className="event-attendees">👥 {event.attendee_count}/{event.capacity} going</div>
          <button
            className={`btn-rsvp ${event.is_rsvped ? "rsvped" : ""}`}
            disabled={event.is_rsvped || (event.is_full && !event.is_rsvped)}
            onClick={() => onRsvp(event)}
          >
            {event.is_rsvped ? "✅ RSVP'd" : event.is_full ? "Full" : "RSVP →"}
          </button>
        </div>
      </div>
    </div>
  );
}
