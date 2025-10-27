import jwtAxios from "../util/jwtUtil";
import { API_SERVER_HOST } from "./userApi";

const COMMENT_BASE = `${API_SERVER_HOST}/api/posts`;

// 목록 (DESC는 서버에서 정렬됨)
export const fetchComments = (postId, { page = 1, size = 20 } = {}) =>
  jwtAxios.get(`${COMMENT_BASE}/${postId}/comments/list`, { params: { page, size } })
          .then(res => res.data);

// 등록 (작성자는 서버에서 principal로 확정)
export const addComment = (postId, content) =>
  jwtAxios.post(`${COMMENT_BASE}/${postId}/comments/add`, { content })
          .then(res => res.data); // commentId

// 수정 (본인만)
export const updateComment = (postId, commentId, content) =>
  jwtAxios.put(`${COMMENT_BASE}/${postId}/comments/${commentId}`, { content });

// 삭제 (본인만)
export const deleteComment = (postId, commentId) =>
  jwtAxios.delete(`${COMMENT_BASE}/${postId}/comments/${commentId}`);
