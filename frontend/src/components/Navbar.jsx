import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useModal } from "../context/ModalContext";
import { useToast } from "../context/ToastContext";
import LoginModal from "./LoginModal";
import SignupModal from "./SignupModal";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { openModal } = useModal();
  const showToast = useToast();

  const handleLogout = () => {
    logout();
    showToast("Logged out. See you soon! 👋");
  };

  return (
    <nav className="topnav">
      <div className="topnav-left">
        <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`} end>Home</NavLink>
        <NavLink to="/search" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>Search</NavLink>
        <NavLink to="/discover" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>Discover</NavLink>
        <NavLink to="/events" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>Events</NavLink>
        {user && (
          <NavLink to="/messages" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>Messages</NavLink>
        )}
        {user?.is_admin && (
          <NavLink to="/admin" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>Admin</NavLink>
        )}
      </div>
      <div className="topnav-logo">
        <span className="logo-icon">🤝</span>
        <span className="logo-text">Me Too!</span>
      </div>
      <div className="topnav-right">
        {user ? (
          <>
            <span style={{ color: "rgba(255,255,255,.8)", fontSize: 14 }}>Hi, {user.name.split(" ")[0]}</span>
            <button className="btn-primary" onClick={handleLogout}>Log Out</button>
          </>
        ) : (
          <>
            <button className="btn-ghost" onClick={() => openModal(<LoginModal />)}>Log In</button>
            <button className="btn-primary" onClick={() => openModal(<SignupModal />)}>Join Free</button>
          </>
        )}
      </div>
    </nav>
  );
}
