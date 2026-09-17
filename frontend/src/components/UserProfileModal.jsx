import { useState } from "react";
import { blockUser, reportUser } from "../api/moderation";
import { useAuth } from "../context/AuthContext";
import { useModal } from "../context/ModalContext";
import { useToast } from "../context/ToastContext";
import Avatar from "./Avatar";

const REPORT_REASONS = [
  { value: "spam", label: "Spam" },
  { value: "harassment", label: "Harassment" },
  { value: "fake_profile", label: "Fake profile" },
  { value: "inappropriate_content", label: "Inappropriate content" },
  { value: "other", label: "Other" },
];

export default function UserProfileModal({ user, onConnect }) {
  const { user: currentUser } = useAuth();
  const { closeModal } = useModal();
  const showToast = useToast();
  const [showReportForm, setShowReportForm] = useState(false);
  const [reason, setReason] = useState(REPORT_REASONS[0].value);
  const [details, setDetails] = useState("");

  const isSelf = currentUser && currentUser.id === user.id;

  const handleBlock = async () => {
    if (!confirm(`Block ${user.name}? They won't be able to contact you, and you won't see them in search.`)) return;
    try {
      await blockUser(user.id);
      showToast(`${user.name} has been blocked.`, "success");
      closeModal();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleReport = async () => {
    try {
      await reportUser(user.id, reason, details);
      showToast("Report submitted. Our team will review it.", "success");
      closeModal();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  return (
    <div className="modal-body">
      <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 6 }}>
        <Avatar name={user.name} avatarUrl={user.avatar_url} size={56} />
        <h2 style={{ margin: 0 }}>{user.name}</h2>
      </div>
      <p>Age {user.age} · 📍 {user.location}{user.gender ? ` · ${user.gender}` : ""}</p>
      <div style={{ margin: "16px 0 12px", fontSize: 15, color: "#5a5a72", lineHeight: 1.7 }}>
        {user.bio || "No bio provided."}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
        {(user.interests || []).map((tag) => (
          <span className="interest-tag" style={{ fontSize: 14, padding: "5px 12px" }} key={tag}>
            {tag}
          </span>
        ))}
      </div>

      {!isSelf && !user.is_friend && (
        <button
          className="form-submit"
          onClick={() => {
            onConnect(user);
            closeModal();
          }}
        >
          🤝 Send Friend Request
        </button>
      )}

      {!isSelf && (
        <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
          <button className="btn-view" style={{ flex: 1 }} onClick={handleBlock}>🚫 Block</button>
          <button className="btn-reject" style={{ flex: 1 }} onClick={() => setShowReportForm((v) => !v)}>
            🚩 Report
          </button>
        </div>
      )}

      {showReportForm && (
        <div style={{ marginTop: 14 }}>
          <div className="form-group">
            <label>Reason</label>
            <select value={reason} onChange={(e) => setReason(e.target.value)}>
              {REPORT_REASONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Details (optional)</label>
            <textarea value={details} onChange={(e) => setDetails(e.target.value)} placeholder="What happened?" />
          </div>
          <button className="form-submit" onClick={handleReport}>Submit Report</button>
        </div>
      )}
    </div>
  );
}
