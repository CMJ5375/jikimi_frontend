import axios from "axios"
import jwtAxios from "../util/jwtUtil"

export const API_SERVER_HOST = 'http://localhost:8080'

const prefix =  `${API_SERVER_HOST}/api/todo`

// 특정번호의 todo 조회
//http://localhost:8080/api/post/1
export const getOne = async (tno) => {
   const res = await jwtAxios.get(`${prefix}/${tno}`)
   return res.data
}

// 페이지, 사이즈 => 여러개가 넘어오므로 객체로 받는다
//http://localhost:8080/api/post/list?page=3
export const getList = async (pageParam) => {
    const {page, size} = pageParam
    const res = await jwtAxios.get(`${prefix}/list`, {params: {page:page, size:size}})
    return res.data
}