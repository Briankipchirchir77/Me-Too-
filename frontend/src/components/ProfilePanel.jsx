import { useEffect, useRef, useState } from "react";
import { resendVerification } from "../api/auth";
import { acceptFriendRequest, declineFriendRequest, listFriendRequests, listFriends } from "../api/friends";
import { deleteAvatar, uploadAvatar } from "../api/users";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import usePush from "../hooks/usePush";
import Avatar from "./Avatar";
import FriendRequestCard from "./FriendRequestCard";

export default function ProfilePanel() {
  const { user, updateUser } = useAuth();
  const showToast = useToast();
  const [incoming, setIncoming] = useState([]);
  const [friendCount, setFriendCount] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [sendingVerification, setSendingVerification] = useState(false);
  const fileInputRef = useRef(null);
  const push = usePush();

  const handleTogglePush = async () => {
    try {
      if (push.subscribed) {
        await push.disable();
        showToast("Notifications turned off.");
      } else {
        await push.enable();
        showToast("Notifications enabled! 🔔", "success");
      }
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const loadRequests = () => {
    listFriendRequests()
      .then((data) => setIncoming(data.incoming))
      .catch(() => {});
  };

  useEffect(() => {
    loadRequests();
    listFriends()
      .then((data) => setFriendCount(data.friends.length))
      .catch(() => {});
  }, []);

  const handleAccept = async (request) => {
    try {
      await acceptFriendRequest(request.id);
      showToast("You are now friends! 🎉", "success");
      setFriendCount((c) => c + 1);
      loadRequests();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleDecline = async (request) => {
    try {
      await declineFriendRequest(request.id);
      showToast("Request declined.");
      loadRequests();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const updated = await uploadAvatar(file);
      updateUser({ avatar_url: updated.avatar_url });
      showToast("Profile photo updated! 🎉", "success");
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      await deleteAvatar();
      updateUser({ avatar_url: null });
      showToast("Profile photo removed.");
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleResendVerification = async () => {
    setSendingVerification(true);
    try {
      await resendVerification();
      showToast("Verification email sent — check the server log in dev mode.", "success");
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setSendingVerification(false);
    }
  };

  return (
    <>
      {!user.is_verified && (
        <section className="my-profile-section" style={{ background: "#fff3cd" }}>
          <p style={{ margin: 0, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <span>📩 Your email isn't verified yet.</span>
            <button className="btn-view" onClick={handleResendVerification} disabled={sendingVerification}>
              {sendingVerification ? "Sending…" : "Resend verification email"}
            </button>
          </p>
        </section>
      )}

      <section className="requests-section">
        <h2>🤝 Friend Requests</h2>
        {incoming.length === 0 ? (
          <p className="empty-msg">No pending requests.</p>
        ) : (
          <div>
            {incoming.map((req) => (
              <FriendRequestCard key={req.id} request={req} onAccept={handleAccept} onDecline={handleDecline} />
            ))}
          </div>
        )}
      </section>

      <section className="my-profile-section">
        <h2>My Profile</h2>
        <div className="my-profile-box">
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
            <Avatar name={user.name} avatarUrl={user.avatar_url} size={72} />
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button className="btn-view" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                {uploading ? "Uploading…" : "📷 Change Photo"}
              </button>
              {user.avatar_url && (
                <button className="btn-reject" onClick={handleRemoveAvatar}>Remove</button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/gif,image/webp"
                hidden
                onChange={handleAvatarChange}
              />
            </div>
          </div>
          <h3>{user.name}</h3>
          <p className="profile-detail"><strong>Email:</strong> {user.email} {user.is_verified && "✅"}</p>
          <p className="profile-detail"><strong>Age:</strong> {user.age}</p>
          <p className="profile-detail"><strong>Location:</strong> {user.location}</p>
          <p className="profile-detail"><strong>Bio:</strong> {user.bio || "—"}</p>
          <p className="profile-detail"><strong>Interests:</strong> {(user.interests || []).join(", ") || "—"}</p>
          <p className="profile-detail"><strong>Friends:</strong> {friendCount}</p>
          {push.supported && (
            <button className="btn-view" onClick={handleTogglePush} disabled={push.loading} style={{ marginTop: 10 }}>
              {push.loading ? "…" : push.subscribed ? "🔕 Turn off notifications" : "🔔 Enable notifications"}
            </button>
          )}
        </div>
      </section>
    </>
  );
}
