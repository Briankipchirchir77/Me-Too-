import { useState } from "react";
import { forgotPassword } from "../api/auth";
import { useModal } from "../context/ModalContext";
import { useToast } from "../context/ToastContext";
import LoginModal from "./LoginModal";
import ResetPasswordModal from "./ResetPasswordModal";

export default function ForgotPasswordModal() {
  const { openModal } = useModal();
  const showToast = useToast();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    try {
      const res = await forgotPassword(email.trim());
      setSent(true);
      // No email provider is configured for this project, so in dev mode the
      // API returns the reset token directly instead of emailing it.
      if (res.dev_token) {
        showToast("Dev mode: reset token generated — opening reset form.", "success");
        setTimeout(() => openModal(<ResetPasswordModal prefilledToken={res.dev_token} />), 800);
      }
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-body">
      <h2>Forgot Password? 🔑</h2>
      <p>Enter your email and we'll send you a reset link.</p>
      {sent ? (
        <p style={{ color: "#28a428", fontWeight: 600 }}>
          If that email is registered, a reset link has been sent.
        </p>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input type="email" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <button className="form-submit" type="submit" disabled={submitting}>
            {submitting ? "Sending…" : "Send Reset Link →"}
          </button>
        </form>
      )}
      <div className="form-switch">
        Remembered it? <a onClick={() => openModal(<LoginModal />)}>Log In</a>
      </div>
    </div>
  );
}
