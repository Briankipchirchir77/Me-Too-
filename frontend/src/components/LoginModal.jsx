import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useModal } from "../context/ModalContext";
import { useToast } from "../context/ToastContext";
import SignupModal from "./SignupModal";
import PasswordInput from "./PasswordInput";
import ForgotPasswordModal from "./ForgotPasswordModal";

export default function LoginModal() {
  const { login } = useAuth();
  const { openModal, closeModal } = useModal();
  const showToast = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      showToast("Enter email and password.", "error");
      return;
    }
    setSubmitting(true);
    try {
      const user = await login(email.trim(), password);
      closeModal();
      showToast(`Welcome, ${user.name.split(" ")[0]}! 🎉`, "success");
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-body">
      <h2>Welcome Back 👋</h2>
      <p>Log in to your Me Too! account.</p>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Email</label>
          <input type="email" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Password</label>
          <PasswordInput placeholder="Your password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <button className="form-submit" type="submit" disabled={submitting}>
          {submitting ? "Logging in…" : "Log In →"}
        </button>
      </form>
      <div className="form-switch">
        <a onClick={() => openModal(<ForgotPasswordModal />)}>Forgot password?</a>
      </div>
      <div className="form-switch">
        New here? <a onClick={() => openModal(<SignupModal />)}>Create account</a>
      </div>
    </div>
  );
}
