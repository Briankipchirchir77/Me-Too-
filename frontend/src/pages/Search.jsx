import { useState } from "react";
import { listUsers } from "../api/users";
import { useAuth } from "../context/AuthContext";
import { useModal } from "../context/ModalContext";
import { useToast } from "../context/ToastContext";
import UserGrid from "../components/UserGrid";
import UserProfileModal from "../components/UserProfileModal";
import useConnect from "../hooks/useConnect";

const AGE_MINS = [18, 21, 25, 30, 35, 40];
const AGE_MAXES = [80, 60, 50, 40, 35, 30];

export default function Search() {
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("");
  const [gender, setGender] = useState("any");
  const [minAge, setMinAge] = useState(18);
  const [maxAge, setMaxAge] = useState(80);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { user } = useAuth();
  const { openModal } = useModal();
  const showToast = useToast();
  const { pendingSentIds, connect } = useConnect();

  const runSearch = async (e) => {
    e?.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await listUsers({
        q: keyword.trim(),
        location: location.trim(),
        gender,
        min_age: Math.min(minAge, maxAge),
        max_age: Math.max(minAge, maxAge),
        per_page: 50,
      });
      setResults(data.users);
      showToast(`Found ${data.total} ${data.total === 1 ? "person" : "people"}!`, "success");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const openProfile = (u) => openModal(<UserProfileModal user={u} onConnect={connect} />);

  return (
    <div>
      <div className="page-hero search-hero">
        <h1>🔍 Find Your People</h1>
        <p>Search by interest, location, age, or gender to find the right connections.</p>
      </div>
      <main className="main-content">
        <section className="search-panel">
          <form className="search-filters" onSubmit={runSearch}>
            <div className="filter-group">
              <label>Keyword / Interest</label>
              <input type="text" placeholder="e.g. hiking, music, coding…" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
            </div>
            <div className="filter-group">
              <label>Location</label>
              <input type="text" placeholder="City or country…" value={location} onChange={(e) => setLocation(e.target.value)} />
            </div>
            <div className="filter-group">
              <label>Gender</label>
              <div className="sw-toggle">
                {[["any", "Anyone"], ["female", "Women"], ["male", "Men"]].map(([value, label]) => (
                  <button
                    type="button"
                    key={value}
                    className={`sw-btn ${gender === value ? "active" : ""}`}
                    onClick={() => setGender(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="filter-group">
              <label>Age Range</label>
              <div className="sw-age">
                <select value={minAge} onChange={(e) => setMinAge(Number(e.target.value))}>
                  {AGE_MINS.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
                <span>—</span>
                <select value={maxAge} onChange={(e) => setMaxAge(Number(e.target.value))}>
                  {AGE_MAXES.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
            </div>
            <button className="sw-search-btn" type="submit">🔍 Search</button>
          </form>

          {results !== null && (
            <div className="results-info">
              Found {results.length} {results.length === 1 ? "person" : "people"}
            </div>
          )}

          {loading ? (
            <p className="empty-msg">Searching…</p>
          ) : error ? (
            <p className="empty-msg">Search failed: {error}</p>
          ) : results !== null ? (
            <UserGrid users={results} currentUser={user} pendingSentIds={pendingSentIds} onConnect={connect} onView={openProfile} />
          ) : (
            <p className="empty-msg">Use the filters above and hit Search to find people.</p>
          )}
        </section>
      </main>
    </div>
  );
}
