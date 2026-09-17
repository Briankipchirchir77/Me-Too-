import { useState } from "react";
import { resetPassword } from "../api/auth";
import { useModal } from "../context/ModalContext";
import { useToast } from "../context/ToastContext";
import LoginModal from "./LoginModal";
import PasswordInput from "./PasswordInput";

export default function ResetPasswordModal({ prefilledToken = "" }) {
  const { openModal, closeModal } = useModal();
  const showToast = useToast();
  const [token, setToken] = useState(prefilledToken);
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token.trim() || !password) {
      showToast("Enter the reset token and a new password.", "error");
      return;
    }
    setSubmitting(true);
    try {
      await resetPassword(token.trim(), password);
      showToast("Password reset! You can now log in.", "success");
      openModal(<LoginModal />);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-body">
      <h2>Reset Password 🔑</h2>
      <p>Paste the reset token from your email and choose a new password.</p>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Reset Token</label>
          <input type="text" placeholder="Reset token" value={token} onChange={(e) => setToken(e.target.value)} />
        </div>
        <div className="form-group">
          <label>New Password</label>
          <PasswordInput placeholder="Min 6 chars" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <button className="form-submit" type="submit" disabled={submitting}>
          {submitting ? "Resetting…" : "Reset Password →"}
        </button>
      </form>
      <div className="form-switch">
        <a onClick={closeModal}>Cancel</a>
      </div>
    </div>
  );
}
