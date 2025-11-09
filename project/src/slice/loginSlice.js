// src/slice/loginSlice.js
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit"
import { loginPost } from "../api/userApi"
import { setCookie, getCookie, removeCookie } from "../util/cookieUtil"

const initState = { username: '' }

const loadUserCookie = () => {
  const userInfo = getCookie("member")
  if (userInfo && userInfo.username) {
    userInfo.username = decodeURIComponent(userInfo.username)
  }
  return userInfo
}

export const loginPostAsync = createAsyncThunk('loginPostAsync', (param) => loginPost(param))

const loginSlice = createSlice({
  name: 'LoginSlice',
  initialState: loadUserCookie() || initState,
  reducers: {
    login: (state, action) => {
      const payload = action.payload
      // ✅ 객체 그대로 저장 (JSON.stringify 금지)
      setCookie("member", payload, 1)
      if (payload?.accessToken) localStorage.setItem("accessToken", payload.accessToken)
      if (payload?.refreshToken) localStorage.setItem("refreshToken", payload.refreshToken)
      return payload
    },
    logout: () => {
      removeCookie("member")
      localStorage.removeItem("accessToken")
      localStorage.removeItem("refreshToken")
      return { ...initState }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginPostAsync.pending, () => {
        console.log("pending: 데이터 오는중")
      })
      .addCase(loginPostAsync.fulfilled, (state, action) => {
        console.log("fulfilled : 성공")
        const payload = action.payload
        if (!payload?.error) {
          // ✅ 여기서도 객체 그대로
          setCookie("member", payload, 1)
          if (payload?.accessToken) localStorage.setItem("accessToken", payload.accessToken)
          if (payload?.refreshToken) localStorage.setItem("refreshToken", payload.refreshToken)
        }
        return payload
      })
      .addCase(loginPostAsync.rejected, () => {
        console.log("rejected : 실패")
      })
  }
})

export const { login, logout } = loginSlice.actions
export default loginSlice.reducer
