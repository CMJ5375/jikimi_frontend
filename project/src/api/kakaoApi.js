// src/api/kakaoApi.js
import axios from "axios";
import { API_SERVER_HOST, apiUrl } from "../config/api";

/**
 * 배포/로컬 모두에서 현재 오리진을 사용 → CloudFront/localhost 자동 일치
 * App.js에 존재하는 경로(/user/kakao)로 리다이렉트
 */
const ORIGIN = window.location.origin;

// Kakao Developers REST API Key
const REST_API_KEY = "b8a3046848c797ecc91af475c7037a0e";

// SPA 404 방지: 실제 라우트(/user/kakao)로 설정
const REDIRECT_URI = `${ORIGIN}/user/kakao`;

// Kakao OAuth Endpoints
const AUTH_CODE_URL = "https://kauth.kakao.com/oauth/authorize";
const TOKEN_URL     = "https://kauth.kakao.com/oauth/token";

/** 카카오 로그인 링크 */
export const getKakaoLoginLink = () => {
  const query = new URLSearchParams({
    client_id: REST_API_KEY,
    redirect_uri: REDIRECT_URI,
    response_type: "code",
  }).toString();

  return `${AUTH_CODE_URL}?${query}`;
};

/** 1) 프론트에서 code -> Kakao access_token 교환 */
export const getAccessToken = async (authCode) => {
  const form = new URLSearchParams();
  form.set("grant_type", "authorization_code");
  form.set("client_id", REST_API_KEY);
  form.set("redirect_uri", REDIRECT_URI);
  form.set("code", authCode);

  const res = await axios.post(TOKEN_URL, form, {
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=utf-8" },
    timeout: 10000,
    withCredentials: false,
  });
  return res?.data?.access_token;
};

/** 2) Kakao access_token을 백엔드에 넘겨서, 우리 JWT + 유저 정보 받기 */
export const getUserWithAccessToken = async (accessToken) => {
  const url = `${API_SERVER_HOST}/project/user/kakao?accessToken=${encodeURIComponent(
    accessToken
  )}`;
  const res = await axios.get(url, {
    timeout: 10000,
    withCredentials: false,
  });
  return res.data; // { username, name, email, accessToken, refreshToken, ... }
};

/** 유틸: 현재 URL에서 code 추출 */
export const getAuthCodeFromLocation = () => {
  const params = new URLSearchParams(window.location.search);
  return params.get("code");
};

/** 유틸: 백엔드 헬스체크 */
export const pingBackend = async () => {
  try {
    const res = await axios.get(apiUrl("/project/health"), { timeout: 5000 });
    return res?.data ?? { ok: true };
  } catch (e) {
    return { ok: false, error: String(e?.message || e) };
  }
};
