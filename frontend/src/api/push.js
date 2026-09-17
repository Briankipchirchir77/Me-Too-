import { apiRequest } from "./client";

export function getVapidPublicKey() {
  return apiRequest("/push/vapid-public-key");
}

export function subscribePush(subscription) {
  return apiRequest("/push/subscribe", { method: "POST", body: subscription.toJSON() });
}

export function unsubscribePush(endpoint) {
  return apiRequest("/push/unsubscribe", { method: "POST", body: { endpoint } });
}
