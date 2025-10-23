import { createAsyncThunk, createSlice } from "@reduxjs/toolkit"
import { loginPost } from "../api/userApi"
import { setCookie, getCookie, removeCookie } from "../util/cookieUtil"

//유저 아이디를 기준
const initState = {
    username: ''
}

const loadUserCookie = () => {
    const userInfo = getCookie("member")
    // 닉네임처리
    if(userInfo && userInfo.username) {
        userInfo.username = decodeURIComponent(userInfo.username)
    }
    return userInfo
}

export const loginPostAsync = createAsyncThunk('loginPostAsync', (param) => {
    return loginPost(param)
})

const loginSlice = createSlice({
    name: 'LoginSlice',
    initialState: loadUserCookie() || initState,
    reducers: {
        login: (state, action) => {
            console.log("login")
            // 소셜로그인 회원이면
            const payload = action.payload
            setCookie("member", JSON.stringify(payload), 1) //1일
            return payload
        },
        logout: (state, action) => {
            console.log("logout")
            removeCookie("member")
            return {...initState}
        }
    },
    extraReducers: (builder) => {
        builder.addCase(loginPostAsync.pending, (state, action) => {
            console.log("pending: 데이터 오는중")
        })
            .addCase(loginPostAsync.fulfilled, (state, action) => {
                console.log("fulfilled : 성공")
                const payload = action.payload
                if(!payload.error) {
                    setCookie("member", JSON.stringify(payload), 1)
                }
                return payload
            })
            .addCase(loginPostAsync.rejected, (state, action) => {
                console.log("rejected : 실패")
            })
    }
})

export const {login, logout} = loginSlice.actions
export default loginSlice.reducer