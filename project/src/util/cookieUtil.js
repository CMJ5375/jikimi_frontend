import {Cookies} from "react-cookie"

const cookies = new Cookies()

// 쿠키저장
export const setCookie = (name, value, days) => {
    const expires = new Date()
    expires.setUTCDate(expires.getUTCDate() + days)
    return cookies.set(name, value, {path: '/', expires: expires})
}

// 조회
export const getCookie = (name) => {
    return cookies.get(name)
}

// 쿠키삭제
export const removeCookie = (name, path = "/") => {
    cookies.remove(name, {path})
}