import { apiRequest } from "./client";

export function signup(payload) {
  return apiRequest("/auth/signup", { method: "POST", body: payload });
}

export function login(payload) {
  return apiRequest("/auth/login", { method: "POST", body: payload });
}

export function fetchMe() {
  return apiRequest("/auth/me");
}

export function forgotPassword(email) {
  return apiRequest("/auth/forgot-password", { method: "POST", body: { email } });
}

export function resetPassword(token, password) {
  return apiRequest("/auth/reset-password", { method: "POST", body: { token, password } });
}

export function verifyEmail(token) {
  return apiRequest("/auth/verify-email", { method: "POST", body: { token } });
}

export function resendVerification() {
  return apiRequest("/auth/resend-verification", { method: "POST" });
}
