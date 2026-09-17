import { useEffect, useState } from "react";
import { cancelRsvp, listEvents, rsvpToEvent } from "../api/events";
import { useAuth } from "../context/AuthContext";
import { useModal } from "../context/ModalContext";
import { useToast } from "../context/ToastContext";
import EventCard from "../components/EventCard";
import LoginModal from "../components/LoginModal";

const CATEGORIES = ["all", "Sports", "Arts", "Tech", "Food", "Music", "Outdoors"];

export default function Events() {
  const [events, setEvents] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const { openModal } = useModal();
  const showToast = useToast();

  const load = (category) => {
    setLoading(true);
    listEvents(category === "all" ? undefined : category)
      .then((data) => setEvents(data.events))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load(filter);
  }, [filter]);

  const handleRsvp = async (event) => {
    if (!user) {
      showToast("Log in to RSVP!", "error");
      openModal(<LoginModal />);
      return;
    }
    try {
      await rsvpToEvent(event.id);
      showToast(`You're going to "${event.title}"! 🎉`, "success");
      load(filter);
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  return (
    <div>
      <div className="page-hero events-hero">
        <h1>🎉 Group Events</h1>
        <p>Join local meetups and community gatherings near you.</p>
      </div>
      <main className="main-content">
        <div className="events-toolbar">
          <div className="events-filter-tabs">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                className={`evt-tab ${filter === cat ? "active" : ""}`}
                onClick={() => setFilter(cat)}
              >
                {cat === "all" ? "All Events" : cat}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <p className="empty-msg">Loading events…</p>
        ) : error ? (
          <p className="empty-msg">Couldn't load events: {error}</p>
        ) : events.length === 0 ? (
          <p className="empty-msg">No events in this category yet.</p>
        ) : (
          <div className="events-grid">
            {events.map((event) => (
              <EventCard key={event.id} event={event} onRsvp={handleRsvp} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
