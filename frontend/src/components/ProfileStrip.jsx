import Avatar from "./Avatar";

export default function ProfileStrip({ users, onView }) {
  return (
    <div className="profile-strip">
      {users.slice(0, 12).map((u) => (
        <div key={u.id} title={u.name} style={{ cursor: "pointer" }} onClick={() => onView(u)}>
          <Avatar name={u.name} avatarUrl={u.avatar_url} size={58} className="strip-avatar" />
        </div>
      ))}
    </div>
  );
}
