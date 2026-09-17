export default function FriendRequestCard({ request, onAccept, onDecline }) {
  const sender = request.from_user;
  return (
    <div className="request-card">
      <div className="req-info">
        <strong>{sender.name}</strong>
        <span>📍 {sender.location} · Age {sender.age}</span>
      </div>
      <div className="req-actions">
        <button className="btn-accept" onClick={() => onAccept(request)}>Accept</button>
        <button className="btn-reject" onClick={() => onDecline(request)}>Decline</button>
      </div>
    </div>
  );
}
