import { apiRequest } from "./client";

export function listEvents(category) {
  return apiRequest("/events", { params: { category } });
}

export function rsvpToEvent(id) {
  return apiRequest(`/events/${id}/rsvp`, { method: "POST" });
}

export function cancelRsvp(id) {
  return apiRequest(`/events/${id}/rsvp`, { method: "DELETE" });
}

export function createEvent(payload) {
  return apiRequest("/events", { method: "POST", body: payload });
}

export function updateEvent(id, payload) {
  return apiRequest(`/events/${id}`, { method: "PATCH", body: payload });
}

export function deleteEvent(id) {
  return apiRequest(`/events/${id}`, { method: "DELETE" });
}
