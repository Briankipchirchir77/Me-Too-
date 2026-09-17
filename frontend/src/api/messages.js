import { apiRequest } from "./client";

export function listThreads() {
  return apiRequest("/messages/threads");
}

export function getThread(otherUserId) {
  return apiRequest(`/messages/threads/${otherUserId}`);
}

export function sendMessage(otherUserId, body) {
  return apiRequest(`/messages/threads/${otherUserId}`, { method: "POST", body: { body } });
}
