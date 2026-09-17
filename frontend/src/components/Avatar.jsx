import { resolveMediaUrl } from "../api/client";

const COLORS = ["#1a6b6b", "#e85555", "#2a4a7f", "#c06b00", "#5a3e8f", "#2e7d32"];

function initialsFor(name) {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

export default function Avatar({ name, avatarUrl, size = 64, className = "card-avatar" }) {
  if (avatarUrl) {
    return (
      <img
        src={resolveMediaUrl(avatarUrl)}
        alt={name}
        className={className}
        style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover" }}
      />
    );
  }

  const bg = COLORS[(name?.charCodeAt(0) || 0) % COLORS.length];
  return (
    <div
      className={className}
      style={{ width: size, height: size, background: bg, fontSize: size * 0.37 }}
    >
      {initialsFor(name)}
    </div>
  );
}
