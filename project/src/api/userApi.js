// HTTP 통신을 위한 axios 라이브러리를 임포트합니다.
import axios from 'axios'
import jwtAxios from '../util/jwtUtil'
import { getCookie, setCookie } from '../util/cookieUtil'
import { API_SERVER_HOST } from "../config/api";

const host = `${API_SERVER_HOST}/project/user`

/**
 * 일반 사용자 로그인을 위한 POST 요청을 처리하는 비동기 함수입니다.
 * @param {object} loginParam - 로그인에 필요한 사용자 이름(username)과 비밀번호(password)를 포함하는 객체
 * @returns {Promise<any>} - 로그인 성공 시 서버에서 반환하는 데이터 (예: JWT 토큰, 사용자 정보)
 */
export const loginPost = async ({ username, password }) => {
  const { data } = await axios.post(
    `${host}/login`,
    { username, password },
    { headers: { 'Content-Type': 'application/json' } }
  )
  return data
}

// 계정찾기(아이디 찾기) 전용 API Base
const ACCOUNT_BASE = `${API_SERVER_HOST}/api/account`;

/** 인증코드 발송 */
export const sendCodeApi = (email) => {
  return axios.post(`${ACCOUNT_BASE}/send-code`, { email }, {
    headers: { "Content-Type": "application/json" }
  }); // 성공 시 204 No Content
};

/** 인증코드 검증 */
export const verifyCodeApi = (email, code) => {
  return axios.post(`${ACCOUNT_BASE}/verify-code`, { email, code }, {
    headers: { "Content-Type": "application/json" }
  }); // { verified: true|false }
};

/** 이메일로 username(아이디) 조회 */
export const getUsernameApi = (email) => {
  return axios.get(`${ACCOUNT_BASE}/username`, {
    params: { email }
  }); // { username: "..." }
};

// 비밀번호 찾기 부분
const PWD_BASE = `${API_SERVER_HOST}/api/password`;
export const sendPwdCodeApi = (username, email) =>
  axios.post(`${PWD_BASE}/send-code`, { username, email }, {
    headers: { "Content-Type": "application/json" }
  }); // 204

export const verifyPwdCodeApi = (username, email, code) =>
  axios.post(`${PWD_BASE}/verify-code`, { username, email, code }, {
    headers: { "Content-Type": "application/json" }
  }); // { verified: true|false }

export const resetPasswordApi = (username, email, code, newPassword) =>
  axios.post(`${PWD_BASE}/reset`, { username, email, code, newPassword }, {
    headers: { "Content-Type": "application/json" }
  }); // { reset: true }

/**
 * 사용자 정보 수정
 */
export const modifyUser = async (user) => {
  const ageNum = user.age === "" || user.age == null ? null : Number(user.age);
  const payload = {
    email: user.email ?? null,
    address: user.address ?? null,
    age: Number.isNaN(ageNum) ? null : ageNum,
  };
  
  const { data } = await jwtAxios.put(
    `/project/user/modify/${encodeURIComponent(user.username)}`,
    payload,
    { headers: { "Content-Type": "application/json" } }
  );
  return data;
};

/**
 * 프로필 업로드 (FormData: field name = "file")
 * - 기존 로직 유지: 업로드 성공 시 쿠키(member) 갱신
 * - fetch 기반 중복 블록 제거
 */
export async function updateProfileApi(username, formOrObjOrFile) {
  let form;

  if (formOrObjOrFile instanceof FormData) {
    // MyPage에서 이미 FormData(name/address/age/image)를 만들어 넘기는 패턴
    form = formOrObjOrFile;
  } else if (
    formOrObjOrFile instanceof File ||
    (typeof Blob !== "undefined" && formOrObjOrFile instanceof Blob)
  ) {
    // 파일만 전달한 경우 (이전 방식 호환)
    form = new FormData();
    form.append("image", formOrObjOrFile);
  } else if (formOrObjOrFile && typeof formOrObjOrFile === "object") {
    // { name, address, age, file } 형태
    const { name, address, age, file } = formOrObjOrFile;
    form = new FormData();
    if (name) form.append("name", name);
    if (address) form.append("address", address);
    if (age !== undefined && age !== null && `${age}` !== "") {
      form.append("age", age);
    }
    if (file) form.append("image", file);
  } else {
    // 아무것도 없으면 빈 폼(서버가 필요한 것만 쓰도록)
    form = new FormData();
  }

  const res = await jwtAxios.patch(
    `/project/user/profile/${encodeURIComponent(username)}`,
    form // Content-Type은 axios가 자동 지정
  );

  // 서버 응답(JSON) 안전 처리
  const data = res?.data ?? {};

  // ✅ 쿠키(member) 동기화 (백이 내려주는 키 사용)
  const prev = getCookie("member") || {};
  const next = {
    ...prev,
    username: data.username ?? prev.username,
    name: data.name ?? prev.name,
    address: data.address ?? prev.address,
    age: data.age ?? prev.age,
    email: data.email ?? prev.email,
    profileImage: data.profileImage ?? prev.profileImage,
    accessToken: data.accessToken ?? prev.accessToken,
    refreshToken: data.refreshToken ?? prev.refreshToken,
  };
  setCookie("member", next, 1);

  return data;
}
