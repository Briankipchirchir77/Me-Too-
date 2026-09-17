import { useEffect, useState } from "react";
import { listInterests } from "../api/interests";
import { listUsers } from "../api/users";
import { useAuth } from "../context/AuthContext";
import { useModal } from "../context/ModalContext";
import InterestTile from "../components/InterestTile";
import UserGrid from "../components/UserGrid";
import UserProfileModal from "../components/UserProfileModal";
import useConnect from "../hooks/useConnect";

export default function Discover() {
  const [interests, setInterests] = useState([]);
  const [activeInterest, setActiveInterest] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { openModal } = useModal();
  const { pendingSentIds, connect } = useConnect();

  useEffect(() => {
    listInterests().then((data) => setInterests(data.interests)).catch(() => {});
  }, []);

  const openProfile = (u) => openModal(<UserProfileModal user={u} onConnect={connect} />);

  const handleSelect = async (interest) => {
    setActiveInterest(interest);
    setLoading(true);
    try {
      const data = await listUsers({ interest: interest.name, per_page: 50 });
      setResults(data.users);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-hero discover-hero">
        <h1>✨ Discover</h1>
        <p>Browse by interest category and find people who share your passions.</p>
      </div>
      <main className="main-content">
        <section className="interests-section">
          <h2 className="section-title">Browse by Interest</h2>
          <div className="interest-categories">
            {interests.map((interest) => (
              <InterestTile
                key={interest.id}
                interest={interest}
                active={activeInterest?.id === interest.id}
                onClick={() => handleSelect(interest)}
              />
            ))}
          </div>
        </section>

        {activeInterest && (
          <section className="discover-results-section">
            <div className="section-header">
              <h2>{activeInterest.emoji} {activeInterest.label} {results ? `(${results.length})` : ""}</h2>
              <button className="btn-text" onClick={() => { setActiveInterest(null); setResults(null); }}>✕ Clear</button>
            </div>
            {loading ? (
              <p className="empty-msg">Loading…</p>
            ) : (
              <UserGrid users={results || []} currentUser={user} pendingSentIds={pendingSentIds} onConnect={connect} onView={openProfile} />
            )}
          </section>
        )}
      </main>
    </div>
  );
}
