// src/util/jwtUtil.js
import axios from "axios";
import { getCookie, setCookie } from "./cookieUtil";
import { API_SERVER_HOST } from "../config/api";

// baseURL 고정
const jwtAxios = axios.create({
  baseURL: API_SERVER_HOST,
});

// ==== Refresh 요청 (글로벌 axios 사용) ====
async function refreshJWT(accessToken, refreshToken) {
  const header = { headers: { Authorization: `Bearer ${accessToken}` } };
  const url = `${API_SERVER_HOST}/project/user/refresh?refreshToken=${refreshToken}`;
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
    const user = getCookie("member"); // ✅ 이제 항상 ‘객체’ 기준
    if (!user) {
      return Promise.reject({ response: { data: { error: "REQUIRE_LOGIN" } } });
    }
    if (user?.accessToken) {
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

  const user = getCookie("member"); // ✅ 객체
  if (!user?.refreshToken) {
    return Promise.reject({ message: "No refresh token" });
  }

  if (isRefreshing) {
    return new Promise((resolve) => {
      subscribe((bearer) => {
        originalConfig.headers.Authorization = bearer;
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
    // ✅ 객체 그대로 저장
    setCookie("member", updated, 1);

    const bearer = `Bearer ${updated.accessToken}`;
    publish(bearer);

    originalConfig.headers.Authorization = bearer;
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
