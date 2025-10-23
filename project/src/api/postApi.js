// src/api/postApi.js
import axios from "axios";

export const API_SERVER_HOST = "http://localhost:8080";

/**
 * 서버가 RefreshToken을 "HTTP-Only 쿠키"로 보낸다고 가정합니다.
 * (백엔드 CORS: allowCredentials=true, allowedOrigins=http://localhost:3000 필요)
 */
const api = axios.create({
  baseURL: API_SERVER_HOST,
  withCredentials: true, // ← 쿠키로 refresh-token을 보낼 수 있게
});

// ===== 공통: accessToken 보관/적용 유틸 =====
const ACCESS_KEY = "accessToken";

const getAccessToken = () => localStorage.getItem(ACCESS_KEY);
const setAccessToken = (t) => t ? localStorage.setItem(ACCESS_KEY, t) : localStorage.removeItem(ACCESS_KEY);

// 요청 인터셉터: 매 요청 Authorization 헤더 주입
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ===== 응답 인터셉터: 만료 시 자동 갱신 → 원요청 재시도 =====
let isRefreshing = false;
let pendingQueue = [];

const runQueue = (error, token) => {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  pendingQueue = [];
};

api.interceptors.response.use(
  (res) => {
    // 서버가 200으로 내려주면서 body에 {error: 'ERROR_ACCESS_TOKEN'} 를 줄 수도 있으니 여기서도 체크
    if (res?.data && res.data.error === "ERROR_ACCESS_TOKEN") {
      const original = res.config;
      return handleRefreshAndRetry(original);
    }
    return res;
  },
  async (err) => {
    const original = err.config;

    // 401/403도 갱신 트리거
    const status = err?.response?.status;
    if ((status === 401 || status === 403) && !original?._retry) {
      return handleRefreshAndRetry(original);
    }
    return Promise.reject(err);
  }
);

// 실제 갱신 처리
async function handleRefreshAndRetry(originalConfig) {
  if (!originalConfig) return Promise.reject(new Error("No original request"));

  // 중복 호출 방지
  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      pendingQueue.push({
        resolve: (newToken) => {
          originalConfig.headers.Authorization = `Bearer ${newToken}`;
          resolve(api(originalConfig));
        },
        reject,
      });
    });
  }

  originalConfig._retry = true;
  isRefreshing = true;

  try {
    // === 중요 ===
    // 백엔드에 맞춰서 경로/메서드를 바꾸세요.
    // 예시 1) POST /api/auth/refresh  (쿠키의 refreshToken 사용)
    // 예시 2) GET  /api/user/refresh
    const { data } = await api.post("/api/auth/refresh");

    // 새 accessToken 저장
    const newToken = data?.accessToken;
    if (!newToken) throw new Error("No accessToken in refresh response");
    setAccessToken(newToken);

    // 대기중인 요청들 처리
    runQueue(null, newToken);

    // 원래 요청 재시도
    originalConfig.headers.Authorization = `Bearer ${newToken}`;
    return api(originalConfig);
  } catch (e) {
    runQueue(e, null);
    setAccessToken(null); // 토큰 정리
    // 선택: 로그인 페이지로 보내기
    // window.location.href = "/login";
    return Promise.reject(e);
  } finally {
    isRefreshing = false;
  }
}

// ======================= Posts API =======================
const prefix = `/api/posts`;

export const getOne = async (postId) => {
  const res = await api.get(`${prefix}/${postId}`);
  return res.data;
};

export const getList = async ({ page, size, boardCategory, q }) => {
  const res = await api.get(`${prefix}/list`, {
    params: { page, size, boardCategory, q },
  });
  return res.data;
};

export const createPost = async (post) => {
  const res = await api.post(`${prefix}/add`, post);
  return res.data;
};

export const updatePost = async (postId, post) => {
  const res = await api.put(`${prefix}/${postId}`, post);
  return res.data;
};

export const deletePost = async (postId) => {
  const res = await api.delete(`${prefix}/${postId}`);
  return res.data;
};