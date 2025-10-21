import axios from "axios";
import { getCookie, setCookie } from "./cookieUtil";
import { API_SERVER_HOST } from "../api/userApi";

const jwtAxios = axios.create()

const refreshJWT = async (accessToken, refreshToken) => {
    const host = API_SERVER_HOST
    const header = {headers: {"Authorization" : `Bearer ${accessToken}`}}
    // refreshToken을 쿼리로 붙여서 보낸다.
    const res = await axios.get(`${host}/project/user/refresh?refreshToken=${refreshToken}`)
    console.log("새로 만들어진 refreshToken {}", res.data)
    return res.data
}

// before request
const beforeReq = (config) => {
    console.log("before request......")
    const userInfo = getCookie("member")
    if(!userInfo) {
        console.log("User NOT FOUND")
        return Promise.reject(
            {
                response:
                {
                    data:
                        {error: "REQUIRE_LOGIN"}
                }
            }
        )
    }
    const {accessToken} = userInfo
    config.headers.Authorization = `Bearer ${accessToken}`
    return config
}

// fail request
const requestFail = (err) => {
    console.log("request error........")
    return Promise.reject(err)
}

// before return response
const beforeRes = async (res) => {
    console.log("before return response.........")
    console.log(res)
    const data = res.data
    if(data && data.error === 'ERROR_ACCESS_TOKEN') {
        const userCookieValue = getCookie("member")
        const result = await refreshJWT(userCookieValue.accessToken, userCookieValue.refreshToken)
        console.log("refreshJWT RESULT", result)

        userCookieValue.accessToken = result.accessToken
        userCookieValue.refreshToken = result.refreshToken

        setCookie("member", JSON.stringify(userCookieValue), 1)

        const originalRequest = res.config
        
        originalRequest.headers.Authorization = `Bearer ${result.accessToken}`

        return await axios(originalRequest)
    }
    return res
}

// fail response
const responseFail = (err) => {
    console.log("rseponse fail error.........")
    return Promise.reject(err)
}

jwtAxios.interceptors.request.use(beforeReq, requestFail)
jwtAxios.interceptors.response.use(beforeRes, responseFail)

export default jwtAxios