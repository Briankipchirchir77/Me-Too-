import { useCallback, useEffect, useState } from "react";
import { listFriendRequests, sendFriendRequest } from "../api/friends";
import { useAuth } from "../context/AuthContext";
import { useModal } from "../context/ModalContext";
import { useToast } from "../context/ToastContext";
import LoginModal from "../components/LoginModal";

export default function useConnect() {
  const { user } = useAuth();
  const showToast = useToast();
  const { openModal } = useModal();
  const [pendingSentIds, setPendingSentIds] = useState(new Set());

  const refreshOutgoing = useCallback(() => {
    if (!user) {
      setPendingSentIds(new Set());
      return;
    }
    listFriendRequests()
      .then((data) => setPendingSentIds(new Set(data.outgoing.map((r) => r.to_user.id))))
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    refreshOutgoing();
  }, [refreshOutgoing]);

  const connect = useCallback(
    async (targetUser) => {
      if (!user) {
        showToast("Please log in to connect!", "error");
        openModal(<LoginModal />);
        return;
      }
      try {
        await sendFriendRequest(targetUser.id);
        showToast(`Friend request sent to ${targetUser.name}! 🎉`, "success");
        setPendingSentIds((prev) => new Set(prev).add(targetUser.id));
      } catch (err) {
        showToast(err.message, "error");
      }
    },
    [user, showToast, openModal]
  );

  return { pendingSentIds, connect };
}
