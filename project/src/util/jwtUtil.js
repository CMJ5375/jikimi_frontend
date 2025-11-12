// src/util/jwtUtil.js
import axios from "axios";
import { getCookie, setCookie } from "./cookieUtil";
import { API_SERVER_HOST, apiUrl } from "../config/api";

// === axios 인스턴스 (JWT 전용) ===
const jwtAxios = axios.create({
  baseURL: API_SERVER_HOST, // 반드시 공통 호스트 사용
  timeout: 15000,
});

// http -> https 승격 (혹시 모를 실수 방지)
jwtAxios.interceptors.request.use((config) => {
  if (typeof config.url === "string" && /^http:\/\//i.test(config.url)) {
    config.url = config.url.replace(/^http:\/\//i, "https://");
  }
  if (config.baseURL && /^http:\/\//i.test(config.baseURL)) {
    config.baseURL = config.baseURL.replace(/^http:\/\//i, "https://");
  }
  return config;
});

// ==== Refresh 요청 (글로벌 axios 사용) ====
async function refreshJWT(accessToken, refreshToken) {
  const header = { headers: { Authorization: `Bearer ${accessToken}` } };
  const url = apiUrl(
    `/project/user/refresh?refreshToken=${encodeURIComponent(refreshToken)}`
  );
  const res = await axios.get(url, header);
  return res.data; // { accessToken, refreshToken? }
}

// ==== 동시 요청 큐 ====
let isRefreshing = false;
let waitQueue = [];
const subscribe = (cb) => waitQueue.push(cb);
const publish = (newAccessBearer) => {
  waitQueue.forEach((cb) => cb(newAccessBearer));
  waitQueue = [];
};

// ==== 요청 인터셉터 ====
jwtAxios.interceptors.request.use(
  (config) => {
    // member 쿠키가 문자열일 수도 있으니 방어적으로 파싱
    let user = getCookie("member");
    if (user && typeof user === "string") {
      try {
        user = JSON.parse(user);
      } catch {
        /* noop */
      }
    }

    if (!user) {
      // jwtAxios는 인증 필요한 요청들만 써야 함 (공개 API는 publicAxios 사용)
      return Promise.reject({ response: { data: { error: "REQUIRE_LOGIN" } } });
    }

    if (user?.accessToken) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${user.accessToken}`;
    }
    return config;
  },
  (err) => Promise.reject(err)
);

// ==== 응답 인터셉터 ====
jwtAxios.interceptors.response.use(
  async (res) => {
    const data = res?.data;
    if (data && data.error === "ERROR_ACCESS_TOKEN") {
      return handleRefreshAndRetry(res.config);
    }
    return res;
  },
  async (error) => {
    const { response, config } = error || {};
    if (!response) return Promise.reject(error);

    if (response.status === 401 && !config?._retry) {
      return handleRefreshAndRetry(config);
    }
    return Promise.reject(error);
  }
);

// ==== 공통 재시도 로직 ====
async function handleRefreshAndRetry(originalConfig) {
  if (originalConfig._retry) {
    return Promise.reject({ message: "retry loop blocked" });
  }
  originalConfig._retry = true;

  let user = getCookie("member");
  if (user && typeof user === "string") {
    try {
      user = JSON.parse(user);
    } catch {
      /* noop */
    }
  }
  if (!user?.refreshToken) {
    return Promise.reject({ message: "No refresh token" });
  }

  if (isRefreshing) {
    return new Promise((resolve) => {
      subscribe((bearer) => {

        originalConfig.headers = {
          ...(originalConfig.headers || {}),
          Authorization: bearer,
        };

  
        if (
          typeof FormData !== "undefined" &&
          originalConfig.data instanceof FormData
        ) {
          delete originalConfig.headers["Content-Type"];
        }

        resolve(jwtAxios(originalConfig));
      });
    });
  }

  try {
    isRefreshing = true;
    const result = await refreshJWT(user.accessToken, user.refreshToken);

    const updated = {
      ...user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken ?? user.refreshToken,
    };
    // 쿠키 유틸이 객체 저장을 지원한다고 전제
    setCookie("member", updated, 1);

    const bearer = `Bearer ${updated.accessToken}`;
    publish(bearer);

    // ★ PATCH: 원 요청에 새 토큰 반영
    originalConfig.headers = {
      ...(originalConfig.headers || {}),
      Authorization: bearer,
    };

    // ★ PATCH: 원 요청이 FormData였으면 Content-Type 제거
    if (
      typeof FormData !== "undefined" &&
      originalConfig.data instanceof FormData
    ) {
      delete originalConfig.headers["Content-Type"];
    }

    return jwtAxios(originalConfig);
  } finally {
    isRefreshing = false;
  }
}

export default jwtAxios;

export const decodeToken = (token) => {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
};
