import axios from "axios";
import jwtAxios from '../util/jwtUtil'

export const API_SERVER_HOST = "http://localhost:8080";

const prefix = `${API_SERVER_HOST}/api/posts`;

export const getOne = async (postId) => {
  const res = await jwtAxios.get(`${prefix}/${postId}`);
  return res.data;
};

export const getList = async ({ page, size, boardCategory, q }) => {
  const res = await jwtAxios.get(`${prefix}/list`, {
    params: { page, size, boardCategory, q },
  });
  return res.data;
};

export const createPost = async (postData) => {
  const res = await jwtAxios.post(`${prefix}/add`, postData);
  return res.data;
};

export const updatePost = async (postId, post) => {
  const res = await jwtAxios.put(`${prefix}/${postId}`, post);
  return res.data;
};

export const deletePost = async (postId) => {
  const res = await jwtAxios.delete(`${prefix}/${postId}`);
  return res.data;
};

// 조회수 증가 API
export const increaseView = async (postId) => {
  const res = await jwtAxios.patch(`${prefix}/${postId}/views`);
  return res.data; // { viewCount: number }
};

// 좋아요 증가 API
// 버튼을 눌렀을대 호출되는 아이
// 1. 이미 좋아요 눌렀으면 취소 2.안눌렀다면 좋아요 추가
export const increaseLike = async (postId, username) => {
  const res = await jwtAxios.patch(
    `${prefix}/${postId}/likes`, null,
    { params: { username } } // ← ?username=...
  );
  return res.data;
};

// 페이지를 처음 열때 호출되는 아이
// 1.이 로그인 유저가 이글을 좋아요 한적이 있는가? 2.좋아요 수가 몇개인가
export const getLikeStatus = async (postId, username) => {
  const res = await jwtAxios.get(`${prefix}/${postId}/likes/status`, {
    params: { username },
  });
  // res.data 형태: { liked: boolean, likeCount: number }
  return res.data;
};

export async function fetchMyPosts() {
  try {
    const res = await jwtAxios.get("/api/posts/my"); // 백엔드 경로에 맞춰 조정 가능
    const data = res.data;
    if (Array.isArray(data)) return data;
    if (data?.data && Array.isArray(data.data)) return data.data;
    console.warn("fetchMyPosts: 예상치 못한 응답", data);
    return [];
  } catch (err) {
    console.error("fetchMyPosts 실패:", err);
    throw err;
  }
}