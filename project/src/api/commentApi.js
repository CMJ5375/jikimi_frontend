// src/api/commentApi.js
import jwtAxios from "../util/jwtUtil";
import { API_SERVER_HOST } from "./userApi";
import { getCookie } from "../util/cookieUtil";

const COMMENT_BASE = `${API_SERVER_HOST}/api/posts`;
const API_BASE = `${API_SERVER_HOST}/api`;

// 쿠키에서 accessToken을 안전하게 꺼내 Authorization 헤더 구성
const getAuthHeader = () => {
  try {
    const raw = getCookie("member");
    const obj = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (obj?.accessToken) return { Authorization: `Bearer ${obj.accessToken}` };
  } catch {}
  return {};
};

/** 게시글별 댓글 목록 (최신순은 서버에서 정렬) */
export const fetchComments = (postId, { page = 1, size = 20 } = {}) =>
  jwtAxios
    .get(`${COMMENT_BASE}/${postId}/comments/list`, { params: { page, size } })
    .then((res) => res.data);

/** 댓글 등록 (작성자는 서버에서 Principal로 확정) */
export const addComment = (postId, content) =>
  jwtAxios
    .post(`${COMMENT_BASE}/${postId}/comments/add`, { content })
    .then((res) => res.data); // returns commentId

/** 댓글 수정 (본인만) */
export const updateComment = (postId, commentId, content) =>
  jwtAxios
    .put(`${COMMENT_BASE}/${postId}/comments/${commentId}`, { content })
    .then((res) => res.data);

/** 댓글 삭제 (본인만) */
export const deleteComment = (postId, commentId) =>
  jwtAxios
    .delete(`${COMMENT_BASE}/${postId}/comments/${commentId}`)
    .then((res) => res.data);

/** 내가 작성한 댓글 목록 (페이지네이션) — 헤더 강제 부착 */
export const fetchMyComments = ({ page = 1, size = 10 } = {}) =>
  jwtAxios
    .get(`${API_BASE}/comments/my`, {
      params: { page, size },
      headers: getAuthHeader(),
    })
    .then((res) => res.data);
