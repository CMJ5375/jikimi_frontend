<<<<<<< HEAD
import axios from "axios";
import { API_SERVER_HOST } from "../api/userApi";
import { getCookie, setCookie } from "./cookieUtil";


const jwtAxios = axios.create()

const refreshJWT = async (accessToken, refreshToken) => {
  const host = API_SERVER_HOST
  const header = {headers : {"Authorization" : `Bearer ${accessToken}`}}

  // refreshToken을 쿠러리로 붙여서 보낸다.
  const res = await axios.get(`${host}/project/user/refresh?refreshToken=${refreshToken}`, header)
  console.log("새로 만듦 refreshToken {}", res.data)
  return res.data
}

const beforeReq = (config) => {
  const userInfo = getCookie("member")

  if(!userInfo) {
    return Promise.reject(
      {
        response:
        {
          data:
          {error : "REQUIRE_LOGIN"}
        }
      }
    )
  }

  const {accessToken} = userInfo
  // Authorization
  config.headers.Authorization = `Bearer ${accessToken}`
  return config
}

const requestFail = (err) => {
  return Promise.reject(err)
}

const beforeRes = async (res) => {
  const data = res.data
  if(data && data.error === 'ERROR_ACCESS_TOKEN') {
    const userCookieValue = getCookie("member")
    const result = await refreshJWT(userCookieValue.accessToken, userCookieValue.refreshToken)

    userCookieValue.accessToken = result.accessToken
    userCookieValue.refreshToken = result.refreshToken

    setCookie("member", JSON.stringify(userCookieValue), 1) //1일

    const originalRequest = res.config
    originalRequest.headers.Authorization = `Bearer ${result.accessToken}`

    return await axios(originalRequest)
  }

  return res
}

const responseFail = (err) => {
  return Promise.reject(err)
}

jwtAxios.interceptors.request.use(beforeReq, requestFail)
jwtAxios.interceptors.response.use(beforeRes, responseFail)
export default jwtAxios
=======
// src/util/jwtUtil.js
import axios from 'axios';

// 공통 axios 인스턴스 생성
const jwtAxios = axios.create({
  baseURL: '/project',
});

// 요청 시 Access Token 자동 첨부
jwtAxios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// 응답 시 401 감지 → /refresh 호출 후 재시도
jwtAxios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const accessToken = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');

      try {
        // APIRefreshController 규칙에 맞게 GET + 쿼리로 호출
        const res = await axios.get(
          `/project/user/refresh?refreshToken=${refreshToken}`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        const newAccessToken = res.data.accessToken;
        const newRefreshToken = res.data.refreshToken;

        // 새 토큰 저장
        localStorage.setItem('accessToken', newAccessToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        // 헤더 갱신 후 원래 요청 재시도
        jwtAxios.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return jwtAxios(originalRequest);
      } catch (refreshError) {
        console.error('Refresh token expired or invalid', refreshError);
        localStorage.clear();
        window.location.href = '/user/login';
      }
    }
    return Promise.reject(error);
  }
);

export default jwtAxios;
>>>>>>> YJ
