import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useModal } from "../context/ModalContext";
import { useToast } from "../context/ToastContext";
import LoginModal from "./LoginModal";
import PasswordInput from "./PasswordInput";

const GENDER_OPTIONS = [
  { value: "female", label: "👩 Woman" },
  { value: "male", label: "👨 Man" },
  { value: "other", label: "🌟 Other" },
];

export default function SignupModal() {
  const { signup } = useAuth();
  const { openModal, closeModal } = useModal();
  const showToast = useToast();
  const [form, setForm] = useState({
    name: "", email: "", password: "", age: "", location: "", bio: "", interests: "",
  });
  const [gender, setGender] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password || !form.age || !form.location) {
      showToast("Please fill in all required fields.", "error");
      return;
    }
    setSubmitting(true);
    try {
      const user = await signup({ ...form, age: Number(form.age), gender });
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
      <h2>Join Me Too! 🎉</h2>
      <p>Create your free account and start connecting.</p>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Full Name</label>
          <input type="text" placeholder="Your name" value={form.name} onChange={update("name")} />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Email</label>
            <input type="email" placeholder="you@email.com" value={form.email} onChange={update("email")} />
          </div>
          <div className="form-group">
            <label>Password</label>
            <PasswordInput placeholder="Min 6 chars" value={form.password} onChange={update("password")} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Age</label>
            <input type="number" placeholder="25" min="18" max="99" value={form.age} onChange={update("age")} />
          </div>
          <div className="form-group">
            <label>Location</label>
            <input type="text" placeholder="Nairobi" value={form.location} onChange={update("location")} />
          </div>
        </div>
        <div className="form-group">
          <label>I identify as</label>
          <div className="gender-grid">
            {GENDER_OPTIONS.map((opt) => (
              <div
                key={opt.value}
                className={`gender-opt ${gender === opt.value ? "selected" : ""}`}
                onClick={() => setGender(opt.value)}
              >
                {opt.label}
              </div>
            ))}
          </div>
        </div>
        <div className="form-group">
          <label>Bio</label>
          <textarea placeholder="A little about yourself…" value={form.bio} onChange={update("bio")} />
        </div>
        <div className="form-group">
          <label>Interests (comma-separated)</label>
          <input type="text" placeholder="hiking, music, gaming" value={form.interests} onChange={update("interests")} />
        </div>
        <button className="form-submit" type="submit" disabled={submitting}>
          {submitting ? "Creating account…" : "Create Account →"}
        </button>
      </form>
      <div className="form-switch">
        Already have an account? <a onClick={() => openModal(<LoginModal />)}>Log In</a>
      </div>
    </div>
  );
}
