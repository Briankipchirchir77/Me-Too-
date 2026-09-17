import { apiRequest } from "./client";

export function sendFriendRequest(toId) {
  return apiRequest("/friends/requests", { method: "POST", body: { to_id: toId } });
}

export function listFriendRequests() {
  return apiRequest("/friends/requests");
}

export function acceptFriendRequest(id) {
  return apiRequest(`/friends/requests/${id}/accept`, { method: "POST" });
}

export function declineFriendRequest(id) {
  return apiRequest(`/friends/requests/${id}/decline`, { method: "POST" });
}

export function listFriends() {
  return apiRequest("/friends");
}
