const RAW = process.env.REACT_APP_API_BASE || "https://jikimi.duckdns.org";

export const API_SERVER_HOST = RAW
  .replace(/^http:\/\//i, "https://") // http -> https 강제
  .replace(/\/+$/, "");               // 끝 슬래시 제거

// 편의용
export const apiUrl = (path = "") =>
  `${API_SERVER_HOST}${path.startsWith("/") ? "" : "/"}${path}`;
