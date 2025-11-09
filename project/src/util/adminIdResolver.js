// src/util/adminIdResolver.js
export function isNumericId(v) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0;
}

export function decodeJwtPayload(token) {
  try {
    const b = token.split(".")[1];
    const json = atob(b.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function pickShallowId(obj) {
  if (!obj) return 0;
  return obj.userId ?? obj.id ?? obj.memberId ?? obj.adminId ?? 0;
}

/**
 * adminId를 가능한 모든 경로에서 추출:
 * - loginState/cookie의 userId, id 등
 * - JWT payload의 userId, id(있다면)
 * - 환경변수 REACT_APP_ADMIN_ID
 * - (옵션) username === 'admin' 매핑(DEV 임시)
 */
export function resolveAdminId({ user, cookieMember, token, devUsernameMap = { admin: 1 } }) {
  const fromState = pickShallowId(user);
  const fromCookie = pickShallowId(cookieMember);

  let fromJwt = 0;
  if (token) {
    const p = decodeJwtPayload(token);
    if (p) {
      fromJwt = p.userId ?? p.id ?? p.memberId ?? p.adminId ?? 0;
    }
  }

  const fromEnv = Number(process.env.REACT_APP_ADMIN_ID);

  // 우선순위: state → cookie → jwt → env → devUsernameMap
  const candidates = [fromState, fromCookie, fromJwt, fromEnv].filter(isNumericId);
  if (candidates.length > 0) return Number(candidates[0]);

  // DEV fallback: username → id 매핑(로컬 테스트용)
  const username =
    user?.username || user?.name || cookieMember?.username || cookieMember?.name || "";
  if (username && devUsernameMap && isNumericId(devUsernameMap[username])) {
    return Number(devUsernameMap[username]);
  }

  return 0;
}
