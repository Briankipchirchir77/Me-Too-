import { useModal } from "../context/ModalContext";

export default function SafetyModal() {
  const { closeModal } = useModal();
  return (
    <div className="modal-body">
      <h2>🛡️ Safe & Verified</h2>
      <p>Your safety is our top priority. Here's how we keep Me Too! secure:</p>
      <ul className="safety-list">
        <li><span>✅</span><span><strong>Profile Review:</strong> Every new account is manually reviewed before going live.</span></li>
        <li><span>🔒</span><span><strong>Private Info:</strong> Your email and password are never shared with other users.</span></li>
        <li><span>🚫</span><span><strong>Block & Report:</strong> See something wrong? Block or report any profile instantly.</span></li>
        <li><span>👮</span><span><strong>Moderation:</strong> Our team monitors activity 24/7 to remove bad actors fast.</span></li>
        <li><span>💚</span><span><strong>Friend-First:</strong> All connections require mutual acceptance — no unsolicited contact.</span></li>
      </ul>
      <button className="form-submit" onClick={closeModal}>Got it, thanks!</button>
    </div>
  );
}
