import { createContext, useCallback, useContext, useState } from "react";

const ModalContext = createContext(null);

export function ModalProvider({ children }) {
  const [content, setContent] = useState(null);

  const openModal = useCallback((node) => setContent(node), []);
  const closeModal = useCallback(() => setContent(null), []);

  return (
    <ModalContext.Provider value={{ openModal, closeModal }}>
      {children}
      <div className={`modal-overlay ${content ? "open" : ""}`} onClick={(e) => {
        if (e.target === e.currentTarget) closeModal();
      }}>
        <div className="modal">
          <button className="modal-close" onClick={closeModal}>✕</button>
          <div id="modal-body">{content}</div>
        </div>
      </div>
    </ModalContext.Provider>
  );
}

export function useModal() {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error("useModal must be used within a ModalProvider");
  return ctx;
}
