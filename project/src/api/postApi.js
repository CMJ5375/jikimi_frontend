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

// export const createPost = async (postData) => {
//   const res = await jwtAxios.post(`${prefix}/add`, postData);
//   return res.data;
// };

// ✅ 멀티파트로 글 + 파일 같이 보내는 최종 버전
export const createPost = async (postData, token) => {
  // postData는 BoardCreat에서 넘길 예정:
  // {
  //   title,
  //   content,
  //   boardCategory,
  //   authorUsername,
  //   files: [File, File, ...]  // input[type=file]에서 온 File[]
  // }

  const formData = new FormData();

  // 백엔드는 @RequestPart("post") JPostDTO dto 로 받으니까
  // 이 "post"라는 키에 JSON을 Blob으로 싸서 넣어준다.
  const postJson = {
    title: postData.title,
    content: postData.content,
    boardCategory: postData.boardCategory,
    authorUsername: postData.authorUsername,
  };

  formData.append(
    "post",
    new Blob([JSON.stringify(postJson)], { type: "application/json" })
  );

  // 파일은 @RequestPart("file") MultipartFile file 로 받으니까
  // key 이름은 "file"이어야 하고 딱 하나만 보낼 거라고 가정
  if (postData.files && postData.files.length > 0) {
    formData.append("file", postData.files[0]);
  }

  const res = await axios.post(
    `${prefix}/add`,
    formData,
    {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        // ❌ 절대 수동으로 Content-Type 넣지 말 것.
        // axios가 FormData 주면 boundary 포함된 올바른 multipart/form-data로 넣어줌
      },
    }
  );

  return res.data; // 새 postId(Long) 리턴
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