// src/hook/useCustomLogin.js
import { useDispatch, useSelector } from "react-redux";
import { Navigate, useNavigate } from "react-router-dom";
import { loginPostAsync, logout } from "../slice/loginSlice"; // 경로 네가 준 대로 유지
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
  } catch {
    return {};
  }
}

const useCustomLogin = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const loginState = useSelector((state) => state.loginSlice);

  const cookieMember = getCookie("member") || {};
  const accessToken = loginState?.accessToken || cookieMember?.accessToken || null;

  const decoded = parseJwt(accessToken);
  const userId = decoded?.userId || decoded?.id || decoded?.uid || null;
  const username = decoded?.username || decoded?.sub || loginState?.username || cookieMember?.username;

  const enhancedLoginState = {
    ...loginState,
    userId,
    username,
    accessToken,
  };

  // ✅ 실패 시 throw, 성공 시 data (unwrap)
  const doLogin = (loginParam) => dispatch(loginPostAsync(loginParam)).unwrap();

  const doLogout = () => dispatch(logout());

  const moveToPath = (path) => navigate({ pathname: path }, { replace: true });

  const moveToLogin = () => navigate({ pathname: "/user/login" }, { replace: true });

  const moveToLoginReturn = () => <Navigate replace to="/user/login" />;

  const isLogin = !!accessToken; // 최소 기준: 토큰 존재

  return {
    loginState: enhancedLoginState,
    isLogin,
    doLogin,
    doLogout,
    moveToPath,
    moveToLogin,
    moveToLoginReturn,
  };
};

export default useCustomLogin;
