// HTTP 통신을 위한 axios 라이브러리를 임포트합니다.
import axios from 'axios'
import jwtAxios from '../util/jwtUtil'

// 백엔드 API 서버의 기본 호스트 주소를 정의합니다.
// 이 값은 다른 API 파일(예: kakaoApi.js)에서 임포트하여 사용됩니다.
export const API_SERVER_HOST = 'http://localhost:8080'
// 사용자 관련 API의 기본 경로를 설정합니다. (예: http://localhost:8080/project/user)
const host = `${API_SERVER_HOST}/project/user`

/**
 * 일반 사용자 로그인을 위한 POST 요청을 처리하는 비동기 함수입니다.
 * @param {object} loginParam - 로그인에 필요한 사용자 이름(username)과 비밀번호(password)를 포함하는 객체
 * @returns {Promise<any>} - 로그인 성공 시 서버에서 반환하는 데이터 (예: JWT 토큰, 사용자 정보)
 */
export const loginPost = async (loginParam) => {
    const header = { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    const form = new FormData()
    form.append('username', loginParam.username) // 사용자 이름을 폼 데이터에 추가
    form.append('password', loginParam.password) // 비밀번호를 폼 데이터에 추가
    
    // 백엔드 서버의 로그인 엔드포인트(`/login`)에 POST 요청을 보냅니다.
    const res = await axios.post(`${host}/login`, form, header)
    
    // 서버 응답 데이터를 반환합니다.
    return res.data
}

/**
 * 사용자 회원가입을 위한 POST 요청을 처리할 비동기 함수입니다.
 * 현재는 구현되어 있지 않으며, 향후 사용자 객체(user)를 받아 회원가입 로직을 추가해야 합니다.
 * @param {object} user - 회원가입에 필요한 사용자 정보를 담는 객체
 */


// 회원정보 수정
export const modifyUser = async (user) => {
    const res = await jwtAxios.put(`${host}/modify/${user.username}`, user)
    return res.data
}
