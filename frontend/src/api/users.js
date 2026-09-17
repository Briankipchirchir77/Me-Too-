import { apiRequest } from "./client";

export function listUsers(params) {
  return apiRequest("/users", { params });
}

export function getUser(id) {
  return apiRequest(`/users/${id}`);
}

export function uploadAvatar(file) {
  const formData = new FormData();
  formData.append("file", file);
  return apiRequest("/users/me/avatar", { method: "POST", formData });
}

export function deleteAvatar() {
  return apiRequest("/users/me/avatar", { method: "DELETE" });
}
