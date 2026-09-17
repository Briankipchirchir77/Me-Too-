import UserCard from "./UserCard";

export default function UserGrid({ users, currentUser, pendingSentIds, onConnect, onView, emptyMessage = "No users found." }) {
  if (!users.length) {
    return <p className="empty-msg">{emptyMessage}</p>;
  }
  return (
    <div className="user-grid">
      {users.map((user) => (
        <UserCard
          key={user.id}
          user={user}
          currentUser={currentUser}
          pendingSentIds={pendingSentIds}
          onConnect={onConnect}
          onView={onView}
        />
      ))}
    </div>
  );
}
