import { apiRequest } from "./client";

export function listInterests() {
  return apiRequest("/interests");
}
