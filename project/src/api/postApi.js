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
export const increaseLike = async (postId, username) => {
  const res = await jwtAxios.patch(
    `${prefix}/${postId}/likes`, null,
    { params: { username } } // ← ?username=...
  );
  return res.data;
};