import { useDispatch, useSelector } from "react-redux"
import { Navigate, useNavigate } from "react-router-dom"
import { loginPostAsync, logout } from "../slice/loginSlice"
import { getCookie } from "../util/cookieUtil";

function parseJwt(token) {
  if (!token) return {};
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (err) {
    console.error("JWT 파싱 실패:", err);
    return {};
  }
}

const useCustomLogin = () => {
    const navigate = useNavigate()
    const dispatch = useDispatch()
    const loginState = useSelector(state => state.loginSlice)
    const isLogin = loginState.username ? true : false
    const cookieMember = getCookie("member") || {};
    const accessToken = loginState?.accessToken || cookieMember?.accessToken || null;
    const decoded = parseJwt(accessToken);
    const userId = decoded?.userId || decoded?.id || decoded?.uid || null;
    const username = decoded?.username || decoded?.sub || loginState?.username || cookieMember?.username;

    const mergedLogin = {
        ...loginState,
        accessToken,
        userId,
        username,
    };

    // 로그인 함수
    const doLogin = async (loginParam) => {
        const action = await dispatch(loginPostAsync(loginParam))
        return action.payload
    }
    // 로그아웃 함수
    const doLogout = () => {
        dispatch(logout())
    }
    // 페이지 이동
    const moveToPath = (path) => {
        navigate({pathname: path}, {replace: true})
    }
    // 로그인 페이지로 이동
    const moveToLogin = () => {
        navigate({pathname: '/user/login'}, {replace: true})
    }
    // 로그인 페이지로 이동 컴포넌트
    const moveToLoginReturn = () => {
        return <Navigate replace to="/login" />
    }
    // 로그인 객체 통합
    const enhancedLoginState = {
        ...loginState,
        userId,
        username,
        accessToken,
    };

    return {
        loginState: enhancedLoginState,
        isLogin,
        doLogin,
        doLogout,
        moveToPath,
        moveToLogin,
        moveToLoginReturn,
    }
}

export default useCustomLogin;