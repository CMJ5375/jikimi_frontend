// src/util/publicAxios.js
import axios from "axios";

const API_HOST = "https://jikimi.duckdns.org".replace(/\/+$/, "");

const instance = axios.create({
  baseURL: API_HOST,              // 절대 https 고정
  withCredentials: false,         // 필요할 때 개별 요청에서 true로
});

// ★ 모든 요청 URL을 최종적으로 https로 강제
instance.interceptors.request.use((config) => {
  // 절대 URL이면 그대로 두되, http면 https로 승격
  if (typeof config.url === "string") {
    // 절대 URL이면서 http로 시작하면 https로 교체
    if (/^http:\/\//i.test(config.url)) {
      config.url = config.url.replace(/^http:\/\//i, "https://");
    }
    // 상대경로면 baseURL(이미 https)에 붙어서 나감
  }
  // 혹시라도 baseURL이 http면 승격
  if (config.baseURL && /^http:\/\//i.test(config.baseURL)) {
    config.baseURL = config.baseURL.replace(/^http:\/\//i, "https://");
  }
  return config;
});

export default instance;
