import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { verifyEmail } from "../api/auth";
import { useAuth } from "../context/AuthContext";
import { useModal } from "../context/ModalContext";
import { useToast } from "../context/ToastContext";
import ResetPasswordModal from "./ResetPasswordModal";

export default function DeepLinkHandler() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { openModal } = useModal();
  const showToast = useToast();
  const { refreshUser, user } = useAuth();

  useEffect(() => {
    const resetToken = searchParams.get("reset_token");
    if (resetToken) {
      openModal(<ResetPasswordModal prefilledToken={resetToken} />);
      searchParams.delete("reset_token");
      setSearchParams(searchParams, { replace: true });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const verifyToken = searchParams.get("verify_token");
    if (verifyToken) {
      verifyEmail(verifyToken)
        .then(() => {
          showToast("Email verified! ✅", "success");
          if (user) refreshUser();
        })
        .catch((err) => showToast(err.message, "error"))
        .finally(() => {
          searchParams.delete("verify_token");
          setSearchParams(searchParams, { replace: true });
        });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
