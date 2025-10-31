import axios from "axios";

const publicAxios = axios.create({
  baseURL: process.env.REACT_APP_API_BASE || "",
  withCredentials: false, // 공개 호출: 쿠키/토큰 전송 금지
  headers: { "Content-Type": "application/json" },
});

export default publicAxios;
