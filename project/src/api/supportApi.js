// src/api/supportApi.js
import axios from "axios";
import jwtAxios from "../util/jwtUtil";
import publicAxios from "../util/publicAxios"; // ✅ 추가: HTTPS 강제 인터셉터 포함
import { API_SERVER_HOST } from "../config/api";

// 공통 Prefix (절대 URL)
const SUP_PREFIX = `${API_SERVER_HOST}/project/support`;

// 공통: type 문자열을 서버 포맷으로 정규화
const normType = (type) => String(type || "").toLowerCase();

// 다운로드 URL 생성 (절대 경로로 교체)
export const buildFileDownloadUrl = (supportId, fileName) => {
  if (!supportId || !fileName) return "";
  return `${API_SERVER_HOST}/files/${supportId}/${encodeURIComponent(fileName)}`;
};

/** -------------------- 공개 API (인증 불필요) -------------------- */

// 목록 조회(검색 포함)  ✅ axios → publicAxios (혼합콘텐츠 방지)
export async function listSupport({ type, page = 1, size = 10, q = "" }) {
  const t = normType(type);
  const res = await publicAxios.get(`${SUP_PREFIX}/${t}/list`, {
    params: { page: page - 1, size, keyword: q || undefined },
  });
  return res.data;
}

// 단건 조회 (increaseView 플래그 가능)  ✅ axios → publicAxios
export async function getSupport({ type, id, increaseView = true }) {
  const t = normType(type);
  const res = await publicAxios.get(`${SUP_PREFIX}/${t}/${id}`, {
    params: { increaseView },
  });
  return res.data;
}

// 상단 고정 리스트  ✅ axios → publicAxios
export const listPinnedSupport = async ({ type }) => {
  const t = normType(type);
  const res = await publicAxios.get(`${SUP_PREFIX}/${t}/pinned`);
  return res.data;
};

/** -------------------- 관리자/인증 필요 API -------------------- */

// 생성(관리자) — 멀티파트 ＊기존 axios 사용 유지
export async function createSupport({ type, formData, token, adminId }) {
  // adminId를 쿼리스트링으로도, form-data로도 같이 넣어줌 (컨트롤러 양쪽 수용)
  if (adminId && !formData.has("adminId")) {
    formData.append("adminId", String(adminId));
  }

  const url = `${API_SERVER_HOST}/project/support/${type}${
    adminId ? `?adminId=${encodeURIComponent(String(adminId))}` : ""
  }`;

  const res = await axios.post(url, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      // Content-Type은 FormData일 때 axios가 자동으로 설정하므로 지정하지 않습니다.
    },
    withCredentials: false,
  });
  return res.data;
}

// 수정(관리자)
export async function updateSupport({ type, id, dto, adminId, token }) {
  const t = normType(type);
  const safeAdminId = adminId ?? 0;
  await jwtAxios.put(`${SUP_PREFIX}/${t}/${id}`, dto, {
    params: { adminId: safeAdminId },
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
}

// 삭제(관리자)
export async function removeSupport({ type, id, adminId, token }) {
  const t = normType(type);
  const safeAdminId = adminId ?? 0;
  await jwtAxios.delete(`${SUP_PREFIX}/${t}/${id}`, {
    params: { adminId: safeAdminId },
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
}

// 상단 고정(관리자)
export async function pinSupport({ type, id, adminId, token }) {
  const t = normType(type);
  const safeAdminId = adminId ?? 0;
  await jwtAxios.post(`${SUP_PREFIX}/${t}/${id}/pin`, null, {
    params: { adminId: safeAdminId },
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
}

// 상단 고정 해제(관리자)
export async function unpinSupport({ type, id, adminId, token }) {
  const t = normType(type);
  const safeAdminId = adminId ?? 0;
  await jwtAxios.delete(`${SUP_PREFIX}/${t}/${id}/unpin`, {
    params: { adminId: safeAdminId },
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
}

// 좋아요 토글 (서버 계약 유지: POST /like + body{userId})
export async function toggleSupportLike({ type, id, userId, token }) {
  const t = normType(type);
  const res = await jwtAxios.post(
    `${SUP_PREFIX}/${t}/${id}/like`,
    { userId },
    {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    }
  );
  return res.data;
}

// 좋아요 상태 조회 (GET, 필요 시 토큰 헤더 동봉)
export async function getSupportLikeStatus({ type, id, userId, token }) {
  const t = normType(type);
  const res = await jwtAxios.get(`${SUP_PREFIX}/${t}/${id}/like/status`, {
    params: { userId },
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  return res.data;
}
