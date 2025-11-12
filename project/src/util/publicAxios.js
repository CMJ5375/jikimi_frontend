// src/util/publicAxios.js
import axios from "axios";
import { API_SERVER_HOST } from "../config/api";

const publicAxios = axios.create({
  baseURL: API_SERVER_HOST,
  timeout: 15000,
});

publicAxios.interceptors.request.use((config) => {
  if (typeof config.url === "string" && /^http:\/\//i.test(config.url)) {
    config.url = config.url.replace(/^http:\/\//i, "https://");
  }
  if (config.baseURL && /^http:\/\//i.test(config.baseURL)) {
    config.baseURL = config.baseURL.replace(/^http:\/\//i, "https://");
  }
  return config;
});

export default publicAxios;
