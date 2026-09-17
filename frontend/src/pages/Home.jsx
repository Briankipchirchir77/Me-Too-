import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listUsers } from "../api/users";
import { useAuth } from "../context/AuthContext";
import { useModal } from "../context/ModalContext";
import { useToast } from "../context/ToastContext";
import ProfileStrip from "../components/ProfileStrip";
import UserGrid from "../components/UserGrid";
import UserProfileModal from "../components/UserProfileModal";
import SafetyModal from "../components/SafetyModal";
import LoginModal from "../components/LoginModal";
import SignupModal from "../components/SignupModal";
import ProfilePanel from "../components/ProfilePanel";
import useConnect from "../hooks/useConnect";

const FEATURE_TILES = [
  { id: "interests", icon: "🎨", title: "Shared Interests", desc: "Match with people who love what you love — from hiking to jazz to coding. Filter by hobby and find your crowd instantly.", cta: "Explore Interests →" },
  { id: "nearby", icon: "📍", title: "Near You", desc: "Discover people in your city or neighbourhood. Real connections start close to home.", cta: "Find Nearby →" },
  { id: "verified", icon: "🛡️", title: "Safe & Verified", desc: "Every profile goes through our verification process. Browse with confidence — all accounts are reviewed for authenticity.", cta: "Learn More →" },
  { id: "conversations", icon: "💬", title: "Real Conversations", desc: "No algorithm games. Send a friend request, get accepted, and start talking — it's that simple.", cta: "Start Talking →" },
  { id: "events", icon: "🎉", title: "Group Events", desc: "Join local meetups, hobby nights, and community gatherings. The best friendships start face-to-face.", cta: "Browse Events →" },
];

export default function Home() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const { openModal } = useModal();
  const showToast = useToast();
  const navigate = useNavigate();
  const { pendingSentIds, connect } = useConnect();

  useEffect(() => {
    listUsers({ per_page: 6 })
      .then((data) => setUsers(data.users))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [user]);

  const openProfile = (u) => openModal(<UserProfileModal user={u} onConnect={connect} />);

  const handleFeatureClick = (id) => {
    if (id === "interests") navigate("/discover");
    else if (id === "nearby") navigate("/search");
    else if (id === "events") navigate("/events");
    else if (id === "verified") openModal(<SafetyModal />);
    else if (id === "conversations") {
      if (!user) { openModal(<LoginModal />); return; }
      showToast("Send a friend request to start chatting! 💬", "success");
    }
  };

  return (
    <div>
      <section className="hero">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1 className="hero-title">Find Friends Who <em>Get</em> You</h1>
          <p className="hero-sub">Connect over shared passions, hobbies & vibes — not swipes.</p>
          <div className="hero-cta">
            <button className="btn-hero-primary" onClick={() => (user ? navigate("/discover") : openModal(<SignupModal />))}>🤝 Join Free</button>
            <button className="btn-hero-ghost" onClick={() => navigate("/search")}>🔍 Browse People</button>
          </div>
        </div>
      </section>

      <ProfileStrip users={users} onView={openProfile} />

      <main className="main-content">
        <section className="features-section">
          <h2 className="section-title">Everything You Need to Connect</h2>
          <div className="features-grid">
            {FEATURE_TILES.map((tile) => (
              <div className="feature-tile" key={tile.id}>
                <div className="feat-icon">{tile.icon}</div>
                <h3>{tile.title}</h3>
                <p>{tile.desc}</p>
                <button className="feat-btn" onClick={() => handleFeatureClick(tile.id)}>{tile.cta}</button>
              </div>
            ))}
          </div>
        </section>

        <section className="users-section">
          <div className="section-header">
            <h2>People Near You</h2>
            <button className="btn-text" onClick={() => navigate("/search")}>See all →</button>
          </div>
          {loading ? (
            <p className="empty-msg">Loading people…</p>
          ) : error ? (
            <p className="empty-msg">Couldn't load people: {error}</p>
          ) : (
            <UserGrid users={users} currentUser={user} pendingSentIds={pendingSentIds} onConnect={connect} onView={openProfile} />
          )}
        </section>

        {user && <ProfilePanel />}
      </main>
    </div>
  );
}
