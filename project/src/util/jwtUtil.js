// src/util/jwtUtil.js

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
    const user = getCookie("member");
    if (!user) {
      return Promise.reject({
        response: { data: { error: "REQUIRE_LOGIN" } },
      });
    }
    config.headers.Authorization = `Bearer ${user.accessToken}`;
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

  const user = getCookie("member");
  if (!user?.refreshToken) {
    return Promise.reject({ message: "No refresh token" });
  }

  if (isRefreshing) {
    // 다른 요청들이 갱신 중이면 대기 후 재시도
    return new Promise((resolve) => {
      subscribe((bearer) => {
        originalConfig.headers.Authorization = bearer;
        resolve(axios(originalConfig));
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
    setCookie("member", updated, 1);

    const bearer = `Bearer ${result.accessToken}`;
    publish(bearer);

    originalConfig.headers.Authorization = bearer;
    return axios(originalConfig);
  } finally {
    isRefreshing = false;
  }
}

/* ======================= 내보내기 ============================ */
// 다른 파일들이 이미 이렇게 쓰고 있으니 그대로 둡니다.
export default jwtAxios;

// 혹시 유틸 함수들을 여기서 함께 export 하던 프로젝트라면
// 아래처럼 보조 유틸을 추가로 유지할 수 있습니다.
// (필요 없으면 지워도 됨)
export const decodeToken = (token) => {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
};
