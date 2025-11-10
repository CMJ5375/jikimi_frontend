import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { getAccessToken, getUserWithAccessToken } from "../../api/kakaoApi";
import { setCookie } from "../../util/cookieUtil";

export default function KakaoLoginPage() {
  const { search } = useLocation();

  useEffect(() => {
    (async () => {
      try {
        const params = new URLSearchParams(search);
        const code = params.get("code");
        if (!code) return; // 일반 로그인 화면 진입일 수 있음

        // 1) 카카오 액세스토큰
        const kakaoAccessToken = await getAccessToken(code);
        if (!kakaoAccessToken) throw new Error("No kakao access token");

        // 2) 백엔드 로그인(우리 서비스 토큰 수령)
        const user = await getUserWithAccessToken(kakaoAccessToken);
        if (!user?.accessToken) throw new Error("No service access token");

        // 3) member 쿠키 저장 (jwtUtil이 기대하는 형태)
        setCookie("member", user, 1);

        // 4) ★ 전역 상태 강제 동기화: 새로고침(라우팅+상태 초기화)
        window.location.replace("/");
      } catch (e) {
        console.error("카카오 로그인 실패:", e);
        // 실패 시 현재 페이지 유지 (원하면 /login 으로 보내도 됨)
      }
    })();
  }, [search]);

  return null;
}
