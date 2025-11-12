// src/api/postApi.js
import jwtAxios from "../util/jwtUtil";
import publicAxios from "../util/publicAxios"; 
import { API_SERVER_HOST } from "../config/api";

const prefix = `${API_SERVER_HOST}/api/posts`;

/**
 * =========================================
 * 공개 가능 API (로그인 없어도 되는 것들)
 * -> publicAxios 사용
 * =========================================
 */

// 단건 조회 (GET /api/posts/{id})
// 백엔드에서 자체적으로 조회수 증가까지 처리하잖아?
export const getOne = async (postId) => {
  const res = await publicAxios.get(`${prefix}/${postId}`);
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
  const res = await publicAxios.get(`${prefix}/list`, {
    params: { page, size, q, boardCategory, sort, days },
  });
  return res.data;
};

// 상단 고정 인기글 (GET /api/posts/hot/pins)
export const getHotPins = async () => {
  const res = await publicAxios.get(`${prefix}/hot/pins`);
  return res.data;
};

// 조회수 증가(별도 PATCH /api/posts/{id}/views)도 공개로 열어놨었지?
// 굳이 auth 필요 없으면 publicAxios로. 만약 이건 보호하고 싶으면 jwtAxios로 바꿔.
export const increaseView = async (postId) => {
  const res = await publicAxios.patch(`${prefix}/${postId}/views`);
  return res.data; // { viewCount }
};


/**
 * =========================================
 * 인증 필요한 API (JWT 필요)
 * -> jwtAxios 사용
 * =========================================
 */

// 좋아요 토글 (PATCH /api/posts/{id}/likes?username=xxx)
// -> 로그인 유저만 가능해야 하니까 jwtAxios
export const increaseLike = async (postId, username) => {
  const res = await jwtAxios.patch(`${prefix}/${postId}/likes`, null, {
    params: { username },
  });
  return res.data; // { likeCount, liked }
};

// 새 글 등록 (POST /api/posts/add, multipart/form-data)
// -> JWT 필요
export async function createPost(payload) {
  const { title, content, boardCategory, authorUsername, files } = payload;

  // 방어: 로그인 정보 깨졌으면 바로 막자
  if (!authorUsername) {
    throw new Error(
      "authorUsername 누락: 쿠키(member)에서 username 안 들어왔어요."
    );
  }

  // 백엔드 시그니처:
  // @RequestPart("post") JPostDTO dto
  // @RequestPart(value="file", required=false) MultipartFile file
  //
  // → 즉 FormData 안에 "post": JSON Blob, "file": 1개
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

  // ⚠ 절대 Content-Type 수동으로 넣지 말기.
  // axios가 boundary 자동으로 붙여줘야 함.
  // jwtAxios는 Authorization 헤더 자동 주입 (jwtUtil에서 처리)
  const res = await jwtAxios.post(`${prefix}/add`, fd);

  // 백엔드는 postId(Long) 리턴
  return res.data;
}

// 수정 (PUT /api/posts/{postId})
// -> 서버에서 작성자 or 관리자 권한 검사
export const updatePost = async (postId, post) => {
  const res = await jwtAxios.put(`${prefix}/${postId}`, post);
  return res.data;
};

// 삭제 (DELETE /api/posts/{postId})
// -> 서버에서 작성자 or 관리자 권한 검사
export const deletePost = async (postId) => {
  const res = await jwtAxios.delete(`${prefix}/${postId}`);
  return res.data;
};

// 내 글 목록 (GET /api/posts/my) -> 로그인 필요
export async function fetchMyPosts() {
  const res = await jwtAxios.get(`${prefix}/my`);
  const data = res.data;

  if (Array.isArray(data)) return data;
  if (data?.data && Array.isArray(data.data)) return data.data;

  console.warn("fetchMyPosts: 예상치 못한 응답", data);
  return [];
}
