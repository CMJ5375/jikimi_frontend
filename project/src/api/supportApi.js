// src/api/supportApi.js
import publicAxios from "../util/publicAxios";
import jwtAxios from "../util/jwtUtil";

/** 목록/검색 */
export const fetchSupportList = (type, page = 0, size = 10, keyword = "") =>
  publicAxios
    .get(`/project/support/${type}/list`, { params: { page, size, keyword } })
    .then(res => res.data);

/** 상세 */
export const fetchSupportDetail = (type, id) =>
  publicAxios.get(`/project/support/${type}/${id}`).then(res => res.data);

/** 등록 */
export const createSupport = (type, dto, adminId) =>
  jwtAxios.post(`/project/support/${type}?adminId=${adminId}`, dto).then(res => res.data);

/** 수정 */
export const updateSupport = (type, id, dto, adminId) =>
  jwtAxios.put(`/project/support/${type}/${id}?adminId=${adminId}`, dto).then(res => res.data);

/** 삭제 */
export const deleteSupport = (type, id, adminId) =>
  jwtAxios.delete(`/project/support/${type}/${id}?adminId=${adminId}`).then(res => res.data);

/** 상단 고정/해제 */
export const pinSupport = (type, id, adminId) =>
  jwtAxios.post(`/project/support/${type}/${id}/pin?adminId=${adminId}`);
export const unpinSupport = (type, id, adminId) =>
  jwtAxios.delete(`/project/support/${type}/${id}/unpin?adminId=${adminId}`);