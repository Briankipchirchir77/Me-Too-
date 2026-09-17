import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getThread, listThreads, sendMessage } from "../api/messages";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import Avatar from "../components/Avatar";

const POLL_MS = 4000;

export default function Messages() {
  const { user } = useAuth();
  const showToast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [threads, setThreads] = useState([]);
  const [activeThread, setActiveThread] = useState(null);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const activeUserId = searchParams.get("user") ? Number(searchParams.get("user")) : null;
  const requestSeqRef = useRef(0);

  const loadThreads = useCallback(() => {
    listThreads()
      .then((data) => setThreads(data.threads))
      .catch(() => {});
  }, []);

  const loadActiveThread = useCallback((otherId) => {
    if (!otherId) return;
    const seq = ++requestSeqRef.current;
    getThread(otherId)
      .then((data) => {
        // Ignore stale responses from an older request (e.g. a slow poll
        // resolving after a more recent send-triggered refresh).
        if (seq === requestSeqRef.current) setActiveThread(data);
      })
      .catch((err) => showToast(err.message, "error"));
  }, [showToast]);

  useEffect(() => {
    setLoading(true);
    loadThreads();
    setLoading(false);
  }, [loadThreads]);

  useEffect(() => {
    if (activeUserId) loadActiveThread(activeUserId);
    else setActiveThread(null);
  }, [activeUserId, loadActiveThread]);

  useEffect(() => {
    const interval = setInterval(() => {
      loadThreads();
      if (activeUserId) loadActiveThread(activeUserId);
    }, POLL_MS);
    return () => clearInterval(interval);
  }, [activeUserId, loadThreads, loadActiveThread]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeThread]);

  const openThread = (otherId) => setSearchParams({ user: String(otherId) });

  const handleSend = async (e) => {
    e.preventDefault();
    if (!draft.trim() || !activeUserId) return;
    const body = draft.trim();
    setDraft("");
    try {
      await sendMessage(activeUserId, body);
      loadActiveThread(activeUserId);
      loadThreads();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  return (
    <div>
      <div className="page-hero events-hero">
        <h1>💬 Messages</h1>
        <p>Chat with your friends on Me Too!</p>
      </div>
      <main className="main-content">
        <div className="messages-layout">
          <div className="thread-list">
            {loading ? (
              <p className="empty-msg">Loading…</p>
            ) : threads.length === 0 ? (
              <p className="empty-msg">No conversations yet. Message a friend to start one!</p>
            ) : (
              threads.map((t) => (
                <div
                  key={t.other_user.id}
                  className={`thread-item ${activeUserId === t.other_user.id ? "active" : ""}`}
                  onClick={() => openThread(t.other_user.id)}
                >
                  <Avatar name={t.other_user.name} avatarUrl={t.other_user.avatar_url} size={40} />
                  <div>
                    <div className="thread-item-name">{t.other_user.name}</div>
                    <div className="thread-item-preview">{t.last_message?.body || "No messages yet"}</div>
                  </div>
                  {t.unread_count > 0 && <span className="thread-unread-badge">{t.unread_count}</span>}
                </div>
              ))
            )}
          </div>

          <div className="thread-view">
            {!activeThread ? (
              <p className="empty-msg" style={{ margin: "auto" }}>Select a conversation to start chatting.</p>
            ) : (
              <>
                <div className="thread-messages">
                  {activeThread.messages.map((m) => (
                    <div key={m.id} className={`msg-bubble ${m.sender_id === user.id ? "mine" : "theirs"}`}>
                      {m.body}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
                <form className="thread-composer" onSubmit={handleSend}>
                  <input
                    type="text"
                    placeholder="Type a message…"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                  />
                  <button type="submit">Send</button>
                </form>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
