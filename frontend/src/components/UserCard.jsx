import { useNavigate } from "react-router-dom";
import Avatar from "./Avatar";

export default function UserCard({ user, currentUser, pendingSentIds, onConnect, onView }) {
  const navigate = useNavigate();
  const tags = (user.interests || []).slice(0, 3);

  let label = "🤝 Connect";
  let className = "btn-connect";
  let disabled = false;

  if (currentUser) {
    if (user.is_friend) {
      label = "✅ Friends";
      className += " friends";
      disabled = true;
    } else if (pendingSentIds?.has(user.id)) {
      label = "⏳ Sent";
      className += " sent";
      disabled = true;
    }
  }

  return (
    <div className="user-card">
      <Avatar name={user.name} avatarUrl={user.avatar_url} size={64} />
      <div className="card-name">{user.name}</div>
      <div className="card-age-loc">Age {user.age} · 📍 {user.location}</div>
      <div className="card-bio">{user.bio || "No bio yet."}</div>
      <div className="card-interests">
        {tags.map((tag) => (
          <span className="interest-tag" key={tag}>{tag}</span>
        ))}
      </div>
      <div className="card-actions">
        {user.is_friend ? (
          <button className="btn-connect friends" onClick={() => navigate(`/messages?user=${user.id}`)}>
            💬 Message
          </button>
        ) : (
          <button className={className} disabled={disabled} onClick={() => onConnect(user)}>
            {label}
          </button>
        )}
        <button className="btn-view" onClick={() => onView(user)}>👁 View</button>
      </div>
    </div>
  );
}
