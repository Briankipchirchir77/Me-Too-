export default function InterestTile({ interest, active, onClick }) {
  return (
    <div className={`interest-cat ${active ? "active" : ""}`} onClick={onClick}>
      <span className="cat-emoji">{interest.emoji}</span>
      <span className="cat-label">{interest.label}</span>
    </div>
  );
}
