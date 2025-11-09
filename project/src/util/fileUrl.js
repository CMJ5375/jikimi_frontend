import { API_SERVER_HOST } from "../config/api";

export function resolveFileUrl(u) {
  if (!u) return "";
  return u.startsWith("http") ? u : `${API_SERVER_HOST}${u}`;
}

export function getFileNameFromUrl(u) {
  if (!u) return "";
  try {
    const url = new URL(u, "https://placeholder"); // 상대경로도 처리
    const pathname = url.pathname || "";
    const name = pathname.split("/").filter(Boolean).pop() || "";
    return decodeURIComponent(name);
  } catch {
    const parts = String(u).split("/").filter(Boolean);
    return decodeURIComponent(parts.pop() || "");
  }
}
