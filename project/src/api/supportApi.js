// src/api/supportApi.js
import publicAxios from "../util/publicAxios";
import jwtAxios from "../util/jwtUtil";

// 공통: type 문자열을 서버 포맷으로 정규화
const normType = (type) => String(type || "").toUpperCase(); // "notice"->"NOTICE"

// 다운로드 URL 생성
export const buildFileDownloadUrl = (supportId, fileName) => {
  if (!supportId || !fileName) return "";
  // FileController가 /files/{id}/{fileName} 형태로 내려주는 것을 기준
  return `/files/${supportId}/${encodeURIComponent(fileName)}`;
};

/**
 * 목록 조회(검색 포함)
 * @param {{type:"NOTICE"|"FAQ"|"DATAROOM", page?:number, size?:number, q?:string}} params
 * @returns Page 응답(backend Page<JSupportDTO> 기반)
 */
export async function listSupport({ type, page = 1, size = 10, q = "" }) {
  const t = normType(type);
  const res = await publicAxios.get(`/project/support/${t}/list`, {
    params: {
      page,
      size,
      keyword: q || undefined,
    },
  });
  return res.data;
}

/**
 * 조회
 * @param {{type:"NOTICE"|"FAQ"|"DATAROOM", id:number, increaseView?:boolean}} params
 */
export async function getSupport({ type, id, increaseView = true }) {
  const t = normType(type);
  const res = await publicAxios.get(`/project/support/${t}/${id}`, {
    params: { increaseView },
  });
  return res.data;
}

/**
 * 생성(관리자)
 * @param {{type:"NOTICE"|"FAQ"|"DATAROOM", dto:Object, adminId:number, token?:string}} params
 *  dto: { title, content, fileName?, fileUrl? }  // DATAROOM의 경우 fileName/fileUrl 지원
 */
export async function createSupport({ type, dto, adminId, token }) {
  const t = String(type || "").toUpperCase();
  const axiosInstance = token ? jwtAxios : publicAxios;
  const safeAdminId = typeof adminId === "number" ? adminId : 0;
  const url = `/project/support/${t}?adminId=${safeAdminId}`;
  const res = await axiosInstance.post(url, dto, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  return res.data;
}

/**
 * 수정(관리자)
 * @param {{type:"NOTICE"|"FAQ"|"DATAROOM", id:number, dto:Object, adminId:number, token?:string}} params
 */
export async function updateSupport({ type, id, dto, adminId, token }) {
  const t = normType(type);
  const axios = token ? jwtAxios : publicAxios;
  const safeAdminId = adminId ?? 0;
  await axios.put(`/project/support/${t}/${id}`, dto, {
    params: { adminId: safeAdminId },
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
}

/**
 * 삭제(관리자)
 * @param {{type:"NOTICE"|"FAQ"|"DATAROM", id:number, adminId:number, token?:string}} params
 */
export async function removeSupport({ type, id, adminId, token }) {
  const t = normType(type);
  const axios = token ? jwtAxios : publicAxios;
  const safeAdminId = adminId ?? 0;
  await axios.delete(`/project/support/${t}/${id}`, {
    params: { adminId: safeAdminId },
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
}

/**
 * 상단 고정(관리자) — 공지/자료실 전용
 * @param {{type:"NOTICE"|"DATAROOM", id:number, adminId:number, token?:string}} params
 */
export async function pinSupport({ type, id, adminId, token }) {
  const t = normType(type);
  const axios = token ? jwtAxios : publicAxios;
  const safeAdminId = adminId ?? 0;
  await axios.post(`/project/support/${t}/${id}/pin`, null, {
    params: { adminId: safeAdminId },
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
}

/**
 * 상단 고정 해제(관리자)
 * @param {{type:"NOTICE"|"DATAROOM", id:number, adminId:number, token?:string}} params
 */
export async function unpinSupport({ type, id, adminId, token }) {
  const t = normType(type);
  const axios = token ? jwtAxios : publicAxios;
  const safeAdminId = adminId ?? 0;
  await axios.delete(`/project/support/${t}/${id}/unpin`, {
    params: { adminId: safeAdminId },
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
}