import { apiRequest } from "./client";

export function blockUser(userId) {
  return apiRequest(`/users/${userId}/block`, { method: "POST" });
}

export function unblockUser(userId) {
  return apiRequest(`/users/${userId}/block`, { method: "DELETE" });
}

export function listBlocked() {
  return apiRequest("/users/blocked");
}

export function reportUser(userId, reason, details) {
  return apiRequest(`/users/${userId}/report`, { method: "POST", body: { reason, details } });
}

export function listReports(status) {
  return apiRequest("/admin/reports", { params: { status } });
}

export function updateReport(reportId, status) {
  return apiRequest(`/admin/reports/${reportId}`, { method: "PATCH", body: { status } });
}
