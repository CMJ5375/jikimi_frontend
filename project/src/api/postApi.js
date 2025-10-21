import axios from "axios"
// import jwtAxios from "../util/jwtUtil"

export const API_SERVER_HOST = 'http://localhost:8080'

// Post 엔드포인트 기본 주소
const prefix = `${API_SERVER_HOST}/api/posts`

// 단일 게시글 조회
// GET http://localhost:8080/api/posts/1
export const getOne = async (postId) => {
  const res = await axios.get(`${prefix}/${postId}`)
  return res.data
}

// 게시글 목록 조회 (페이지네이션)
// GET http://localhost:8080/api/posts?page=1&size=10
export const getList = async (pageParam) => {
  const { page, size } = pageParam
  const res = await axios.get(`${prefix}/list`, { params: { page, size } })
  return res.data
}

// 게시글 등록
// POST http://localhost:8080/api/posts
export const createPost = async (post) => {
  const res = await axios.post(`${prefix}/add`, post)
  return res.data
}

// 게시글 수정
// PUT http://localhost:8080/api/posts/{postId}
export const updatePost = async (postId, post) => {
  const res = await axios.put(`${prefix}/${postId}`, post)
  return res.data
}

// 게시글 삭제
// DELETE http://localhost:8080/api/posts/{postId}
export const deletePost = async (postId) => {
  const res = await axios.delete(`${prefix}/${postId}`)
  return res.data
}
