// src/api/postApi.js
import jwtAxios from "../util/jwtUtil";
import { API_SERVER_HOST } from "../config/api";

const prefix = `${API_SERVER_HOST}/api/posts`;

/** ========== 인증 필요 API (로그인 전용) ========== */

// 단건 조회(게시글 읽기)
export const getOne = async (postId) => {
  const res = await jwtAxios.get(`${prefix}/${postId}`);
  return res.data;
};

// 목록 조회
export const getList = async ({ page = 1, size = 10, q = "", boardCategory = "", sort = "DEFAULT", days = "7" }) => {
  const res = await jwtAxios.get(`${prefix}/list`, {
    params: { page, size, q, boardCategory, sort, days },
  });
  return res.data;
};

// 상단 고정 인기글
export const getHotPins = async () => {
  const res = await jwtAxios.get(`${prefix}/hot/pins`);
  return res.data;
};

// 조회수 증가 (로그인 전용으로 맞춘다면 이것도 jwtAxios)
export const increaseView = async (postId) => {
  const res = await jwtAxios.patch(`${prefix}/${postId}/views`);
  return res.data; // { viewCount }
};

// 좋아요 토글
export const increaseLike = async (postId, username) => {
  const res = await jwtAxios.patch(`${prefix}/${postId}/likes`, null, {
    params: { username },
  });
  return res.data;
};

// 글 생성 (멀티파트)
export const createPost = async (postData) => {
  const formData = new FormData();
  const postJson = {
    title: postData.title,
    content: postData.content,
    boardCategory: postData.boardCategory,
    authorUsername: postData.authorUsername,
  };
  formData.append("post", new Blob([JSON.stringify(postJson)], { type: "application/json" }));
  if (postData.files?.length > 0) formData.append("file", postData.files[0]);

  const res = await jwtAxios.post(`${prefix}/add`, formData);
  return res.data; // 새 postId
};

export const updatePost = async (postId, post) => {
  const res = await jwtAxios.put(`${prefix}/${postId}`, post);
  return res.data;
};

export const deletePost = async (postId) => {
  const res = await jwtAxios.delete(`${prefix}/${postId}`);
  return res.data;
};

// 내 글 목록 (마이페이지)
export async function fetchMyPosts() {
  const res = await jwtAxios.get(`${prefix}/my`);
  const data = res.data;
  if (Array.isArray(data)) return data;
  if (data?.data && Array.isArray(data.data)) return data.data;
  console.warn("fetchMyPosts: 예상치 못한 응답", data);
  return [];
}
