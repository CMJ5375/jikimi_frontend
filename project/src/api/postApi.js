// src/api/postApi.js
import jwtAxios from "../util/jwtUtil";
// import publicAxios from "../util/publicAxios";
import { API_SERVER_HOST } from "../config/api";

const prefix = `${API_SERVER_HOST}/api/posts`;


// 단건 조회 (GET /api/posts/{id})
export const getOne = async (postId) => {
  const res = await jwtAxios.get(`${prefix}/${postId}`);
  return res.data;
};

// 목록 조회 (GET /api/posts/list)
export const getList = async ({
  page = 1,
  size = 10,
  q = "",
  boardCategory = "",
  sort = "DEFAULT",
  days = "7",
}) => {
  const res = await jwtAxios.get(`${prefix}/list`, {
    params: { page, size, q, boardCategory, sort, days },
  });
  return res.data;
};

// 상단 고정 인기글 (GET /api/posts/hot/pins)
export const getHotPins = async () => {
  const res = await jwtAxios.get(`${prefix}/hot/pins`);
  return res.data;
};

// 조회수 증가 (PATCH /api/posts/{id}/views)
export const increaseView = async (postId) => {
  const res = await jwtAxios.patch(`${prefix}/${postId}/views`);
  return res.data; // { viewCount }
};

// 좋아요 토글 (PATCH /api/posts/{id}/likes?username=xxx)
export const increaseLike = async (postId, username) => {
  const res = await jwtAxios.patch(`${prefix}/${postId}/likes`, null, {
    params: { username },
  });
  return res.data; // { likeCount, liked }
};

// 새 글 등록 (POST /api/posts/add, multipart/form-data)
export async function createPost(payload) {
  const { title, content, boardCategory, authorUsername, files } = payload;

  if (!authorUsername) {
    throw new Error(
      "authorUsername 누락: 쿠키(member)에서 username 안 들어왔어요."
    );
  }

  const dto = {
    title,
    content,
    boardCategory,
    authorUsername,
  };

  const fd = new FormData();
  fd.append(
    "post",
    new Blob([JSON.stringify(dto)], { type: "application/json" })
  );

  if (files && files.length > 0) {
    fd.append("file", files[0]);
  }

  const res = await jwtAxios.post(`${prefix}/add`, fd);
  return res.data;
}

// 수정 (PUT /api/posts/{postId})
export const updatePost = async (postId, post) => {
  const res = await jwtAxios.put(`${prefix}/${postId}`, post);
  return res.data;
};

// 삭제 (DELETE /api/posts/{postId})
export const deletePost = async (postId) => {
  const res = await jwtAxios.delete(`${prefix}/${postId}`);
  return res.data;
};

// 내 글 목록 (GET /api/posts/my)
export async function fetchMyPosts() {
  const res = await jwtAxios.get(`${prefix}/my`);
  const data = res.data;

  if (Array.isArray(data)) return data;
  if (data?.data && Array.isArray(data.data)) return data.data;

  console.warn("fetchMyPosts: 예상치 못한 응답", data);
  return [];
}
