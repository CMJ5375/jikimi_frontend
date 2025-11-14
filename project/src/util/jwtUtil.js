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

// 공통 쿠키 파싱 함수 (문자열/인코딩 모두 방어적으로 처리)
function parseMemberCookie() {
  let raw = getCookie("member");
  if (!raw) return null;

  if (typeof raw === "object") return raw;

  if (typeof raw === "string") {
    // 1차 시도: 그대로 JSON.parse
    try {
      return JSON.parse(raw);
    } catch (_) {
      // 2차 시도: decodeURIComponent 후 파싱 (encodeURIComponent 로 저장했을 수도 있음)
      try {
        return JSON.parse(decodeURIComponent(raw));
      } catch (e) {
        console.error("member 쿠키 파싱 실패:", e, raw);
        return null;
      }
    }
  }

  return null;
}

// user 객체에서 토큰 후보들 뽑는 헬퍼
function getTokenFromUser(user) {
  if (!user) return null;
  return (
    user.accessToken ||      // 우리가 맞춘 표준 이름
    user.jwtAccessToken ||   // 혹시 이렇게 내려오는 경우 대비
    user.token ||            // 예전 이름 대비
    null
  );
}

// 현재 토큰을 쿠키/로컬스토리지에서 최대한 찾아오는 헬퍼
function getCurrentToken() {
  const user = parseMemberCookie();
  let token = getTokenFromUser(user);

  // 쿠키에 없으면 localStorage에서 시도
  if (!token) {
    const ls = localStorage.getItem("accessToken");
    if (ls && ls !== "null" && ls !== "undefined") {
      token = ls;
    }
  }

  return token;
}

// ==== 요청 인터셉터 ====
// → 항상 최신 member 쿠키/로컬스토리지 보고 Authorization 헤더를 붙인다.
jwtAxios.interceptors.request.use(
  (config) => {
    const token = getCurrentToken();

    if (!token) {
      // jwtAxios는 인증 필요한 요청들만 써야 함 (공개 API는 publicAxios 사용)
      return Promise.reject({ response: { data: { error: "REQUIRE_LOGIN" } } });
    }

    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (err) => Promise.reject(err)
);

// ==== 공통 재시도 로직 ====
// (토큰 리프레시 + 원 요청 재시도)
async function handleRefreshAndRetry(originalConfig) {
  if (originalConfig._retry) {
    return Promise.reject({ message: "retry loop blocked" });
  }
  originalConfig._retry = true;

  const user = parseMemberCookie();
  if (!user?.refreshToken) {
    return Promise.reject({ message: "No refresh token" });
  }

  if (isRefreshing) {
    // 이미 다른 요청이 리프레시 중이면 큐에 넣고, 끝난 뒤 새 토큰으로 재요청
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

    // 리프레시 시도용으로는 user.accessToken, user.refreshToken 사용
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

    // 원 요청에 새 토큰 반영
    originalConfig.headers = {
      ...(originalConfig.headers || {}),
      Authorization: bearer,
    };

    // FormData였으면 Content-Type 제거 (axios가 boundary 다시 세팅)
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

// ==== 응답 인터셉터 ====
// 1) 서버에서 ERROR_ACCESS_TOKEN 을 주는 경우 → 토큰 리프레시
// 2) 401인 경우 → 최신 쿠키로 한 번 더 Authorization 붙여 재시도 후,
//                 그래도 안 되면 토큰 리프레시 시도
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
    if (!response || !config) return Promise.reject(error);

    if (response.status === 401 && !config._retry) {
      // ★ 1단계: 최신 토큰(쿠키/로컬스토리지)을 다시 읽어서 Authorization 붙여 재시도
      const token = getCurrentToken();
      if (token) {
        config._retry = true;
        config.headers = {
          ...(config.headers || {}),
          Authorization: `Bearer ${token}`,
        };

        if (
          typeof FormData !== "undefined" &&
          config.data instanceof FormData
        ) {
          delete config.headers["Content-Type"];
        }

        return jwtAxios(config);
      }

      // 토큰 자체가 없으면 리프레시 시도 (refreshToken 있는 경우)
      return handleRefreshAndRetry(config);
    }

    return Promise.reject(error);
  }
);

export default jwtAxios;

export const decodeToken = (token) => {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
};
