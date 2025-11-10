// src/util/publicAxios.js
import axios from "axios";
import { API_SERVER_HOST } from "../config/api";

const instance = axios.create({
  baseURL: API_SERVER_HOST, // 반드시 API_SERVER_HOST 사용
  withCredentials: false,   // 필요 시 개별요청에서 true로
  timeout: 15000,
});

// 모든 요청을 최종 HTTPS로 강제
instance.interceptors.request.use((config) => {
  if (typeof config.url === "string" && /^http:\/\//i.test(config.url)) {
    config.url = config.url.replace(/^http:\/\//i, "https://");
  }
  if (config.baseURL && /^http:\/\//i.test(config.baseURL)) {
    config.baseURL = config.baseURL.replace(/^http:\/\//i, "https://");
  }
  return config;
});

export default instance;
