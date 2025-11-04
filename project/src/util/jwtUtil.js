import axios from "axios";
import { getCookie, setCookie } from "./cookieUtil";

// 백엔드 호스트 — 이 파일 내부에서만 사용 (외부로 export 금지)
const API_SERVER_HOST = "http://localhost:8080";

// baseURL을 박아둔 axios 인스턴스
const jwtAxios = axios.create({ baseURL: API_SERVER_HOST });

/* ======================== Refresh 요청 ======================== */
async function refreshJWT(accessToken, refreshToken) {
  const header = { headers: { Authorization: `Bearer ${accessToken}` } };
  const res = await axios.get(
    `${API_SERVER_HOST}/project/user/refresh?refreshToken=${refreshToken}`,
    header
  );
  return res.data; // { accessToken, refreshToken? }
}

/* ==================== 동시 요청 큐 처리 ====================== */
let isRefreshing = false;
let waitQueue = [];
const subscribe = (cb) => waitQueue.push(cb);
const publish = (newAccessBearer) => {
  waitQueue.forEach((cb) => cb(newAccessBearer));
  waitQueue = [];
};

/* ====================== 요청 인터셉터 ======================== */
jwtAxios.interceptors.request.use(
  (config) => {
    const raw = getCookie("member");
    const user = typeof raw === "string" ? JSON.parse(raw) : raw;

    if (!user) {
      return Promise.reject({
        response: { data: { error: "REQUIRE_LOGIN" } },
      });
    }

    if (user?.accessToken) {
      config.headers.Authorization = `Bearer ${user.accessToken}`;
    }
    return config;
  },
  (err) => Promise.reject(err)
);

/* ====================== 응답 인터셉터 ======================== */
jwtAxios.interceptors.response.use(
  async (res) => {
    const data = res?.data;
    // 서버가 본문으로 만료 신호를 주는 케이스
    if (data && data.error === "ERROR_ACCESS_TOKEN") {
      return handleRefreshAndRetry(res.config);
    }
    return res;
  },
  async (error) => {
    const { response, config } = error || {};
    if (!response) return Promise.reject(error);
    // 401이면 리프레시 시도
    if (response.status === 401 && !config?._retry) {
      return handleRefreshAndRetry(config);
    }
    return Promise.reject(error);
  }
);

/* ===================== 공통 재시도 로직 ====================== */
async function handleRefreshAndRetry(originalConfig) {
  if (originalConfig._retry) {
    return Promise.reject({ message: "retry loop blocked" });
  }
  originalConfig._retry = true;

  const rawMember = getCookie("member");
  const user =
    typeof rawMember === "string" ? JSON.parse(rawMember) : rawMember;

  if (!user?.refreshToken) {
    return Promise.reject({ message: "No refresh token" });
  }

  if (isRefreshing) {
    // 다른 요청들이 갱신 중이면 대기 후 재시도
    return new Promise((resolve) => {
      subscribe((bearer) => {
        originalConfig.headers.Authorization = bearer;
        resolve(jwtAxios(originalConfig)); // axios → jwtAxios 로 변경
      });
    });
  }

  try {
    isRefreshing = true;
    const result = await refreshJWT(user.accessToken, user.refreshToken);

    const updated = {
      ...user,
      accessToken: result.accessToken,
      // 서버가 refreshToken을 매번 안 주면 기존 값 유지
      refreshToken: result.refreshToken ?? user.refreshToken,
    };

    // JSON 문자열로 저장
    setCookie("member", JSON.stringify(updated), 1);

    const bearer = `Bearer ${result.accessToken}`;
    publish(bearer);

    // 새 토큰으로 Authorization 갱신
    originalConfig.headers.Authorization = bearer;

    // axios → jwtAxios 로 변경 (baseURL & interceptors 유지)
    return jwtAxios(originalConfig);
  } finally {
    isRefreshing = false;
  }
}

/* ======================= 내보내기 ============================ */
export default jwtAxios;

// 보조 유틸 유지
export const decodeToken = (token) => {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
};