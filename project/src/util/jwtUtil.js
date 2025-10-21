// src/util/jwtUtil.js
import axios from 'axios'

// JWT 토큰 자동 첨부용 axios 인스턴스
const jwtAxios = axios.create()

jwtAxios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

export default jwtAxios