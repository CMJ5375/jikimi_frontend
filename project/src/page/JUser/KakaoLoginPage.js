// src/page/JUser/KakaoLoginPage.js
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getAccessToken, getUserWithAccessToken } from "../../api/kakaoApi";
import { setCookie } from "../../util/cookieUtil";

export default function KakaoLoginPage() {
  const { search } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const params = new URLSearchParams(search);
        const code = params.get("code");

        if (!code) {
          // code 없이 /user/kakao 들어온 경우 → 로그인 화면으로
          navigate("/", { replace: true });
          return;
        }

        // 1) 카카오 access_token 먼저 획득
        const kakaoAccessToken = await getAccessToken(code);
        if (!kakaoAccessToken) {
          throw new Error("카카오 access_token 발급 실패");
        }

        // 2) Kakao access_token을 백엔드에 넘겨서
        //    우리 서비스 유저 + JWT(accessToken, refreshToken) 받기
        const data = await getUserWithAccessToken(kakaoAccessToken);

        // 3) 일반 로그인과 동일한 형태로 쿠키/로컬스토리지 저장
        setCookie("member", data, 1);
        if (data?.accessToken) {
          localStorage.setItem("accessToken", data.accessToken);
        }
        if (data?.refreshToken) {
          localStorage.setItem("refreshToken", data.refreshToken);
        }

        // 4) 전체 새로고침해서 jwtAxios 등 상태 초기화
        window.location.replace("/");
      } catch (e) {
        console.error("카카오 로그인 실패:", e);
      }
    })();
  }, [search, navigate]);

  return null;
}
