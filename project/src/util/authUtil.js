import { getCookie } from "./cookieUtil";

export function getLoginUser() {
  try {
    const raw = getCookie("member");
    if (!raw) return null;

    // member 쿠키가 JSON 문자열이라면 파싱
    // ex) {"userId":1,"username":"tester","accessToken":"...","refreshToken":"..."}
    const obj = typeof raw === "string" ? JSON.parse(raw) : raw;
    return obj;
  } catch (e) {
    console.error("getLoginUser parse fail", e);
    return null;
  }
}