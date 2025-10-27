import axios from "axios";
import { API_SERVER_HOST } from "../api/userApi";
import { getCookie, setCookie } from "./cookieUtil";


const jwtAxios = axios.create({
  baseURL: API_SERVER_HOST,
  withCredentials: true,
})

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
