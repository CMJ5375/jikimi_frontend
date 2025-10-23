// HTTP 요청을 위한 axios 라이브러리 임포트
import axios from "axios"
// 백엔드 API 서버의 기본 호스트 주소를 userApi 파일에서 임포트
import { API_SERVER_HOST } from "./userApi"

// === 카카오 API 설정 정보 ===

// 카카오 디벨로퍼스에서 발급받은 REST API 키
const rest_api_key = `82ca008b766f817676784e0da82ce811`
// 카카오 로그인 성공 후 인가 코드를 받을 리디렉션 URI
const redirect_uri = `http://localhost:3000/user/kakao`
// 인가 코드(Authorization Code)를 요청하는 카카오 인증 서버 경로
const auth_code_path = `https://kauth.kakao.com/oauth/authorize`
// 액세스 토큰(Access Token)을 요청하는 카카오 토큰 서버 경로
const access_token_url = `https://kauth.kakao.com/oauth/token`

// 카카오 로그인 페이지로 이동할 URL을 생성하여 반환하는 함수
export const getKakaoLoginLink = () => {
    // 필수 파라미터(client_id, redirect_uri, response_type=code)를 포함하여 URL 생성
    const kakaoURL = `${auth_code_path}?client_id=${rest_api_key}&redirect_uri=${redirect_uri}&response_type=code`

    return kakaoURL
}

// 카카오 인가 코드를 사용하여 액세스 토큰을 요청하는 비동기 함수
export const getAccessToken = async (authCode) => {
    // POST 요청 시 필요한 헤더 설정 (Content-Type을 application/x-www-form-urlencoded로 설정)
    const header = {
        headers: {
            "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
        }
    }

    // 액세스 토큰 요청에 필요한 파라미터 객체
    const params = {
        grant_type: "authorization_code", // 토큰 발급 유형 (인가 코드 방식)
        client_id: rest_api_key,          // REST API 키
        redirect_uri: redirect_uri,        // 리디렉션 URI
        code: authCode                     // 전달받은 인가 코드
    }

    // 카카오 토큰 서버에 액세스 토큰 발급 요청
    const res = await axios.post(access_token_url, params, header)
    
    // 응답 데이터에서 액세스 토큰 추출
    const accessToken = res.data.access_token
    
    // 액세스 토큰 반환
    return accessToken
}

// 발급받은 액세스 토큰을 백엔드 서버에 전달하여 사용자 정보를 요청하는 비동기 함수
export const getUserWithAccessToken = async (accessToken) => {
    // 백엔드 API 엔드포인트에 액세스 토큰을 쿼리 파라미터로 포함하여 GET 요청
    // 이 요청을 통해 백엔드 서버가 카카오 사용자 정보를 가져와 자체 로그인 처리를 수행
    const res = await axios.get(`${API_SERVER_HOST}/project/user/kakao?accessToken=${accessToken}`)
    
    // 백엔드 서버에서 처리된 사용자 정보를 반환 (예: JWT, 사용자 정보 객체 등)
    return res.data
}
