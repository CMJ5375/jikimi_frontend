import axios from "axios"
import { API_SERVER_HOST } from "./userApi"

const rest_api_key = `82ca008b766f817676784e0da82ce811`
const redirect_uri = `http://localhost:3000/user/kakao`
// 인가코드 받기
const auth_code_path = `https://kauth.kakao.com/oauth/authorize`
//공식문서에서 주소 가져온다
const access_token_url = `https://kauth.kakao.com/oauth/token`

export const getKakaoLoginLink = () => {
    const kakaoURL = `${auth_code_path}?client_id=${rest_api_key}&redirect_uri=${redirect_uri}&response_type=code`

    return kakaoURL
}

export const getAccessToken = async (authCode) => {
    const header = {
        headers: {
            "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
        }
    }

    const params = {
        grant_type: "authorization_code",
        client_id: rest_api_key,
        redirect_uri: redirect_uri,
        code: authCode
    }

    const res = await axios.post(access_token_url, params, header)
    const accessToken = res.data.access_token
    return accessToken
}

export const getUserWithAccessToken = async (accessToken) => {
    const res = await axios.get(`${API_SERVER_HOST}/project/user/kakao?accessToken=${accessToken}`)
    return res.data
}