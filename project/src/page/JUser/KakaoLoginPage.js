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
        if (!code) return; // 일반 로그인 화면 진입일 수 있음

        // 1) 카카오에서 access_token 발급
        const kakaoAccessToken = await getAccessToken(code);

        // 2) 백엔드에 전달하여 우리 서비스 토큰/유저정보 수령
        const user = await getUserWithAccessToken(kakaoAccessToken);

        // 3) member 쿠키 저장
        setCookie("member", user, 1);

        // 4) 홈으로 이동
        navigate("/", { replace: true });
      } catch (e) {
        console.error("카카오 로그인 실패:", e);
        // 실패시에도 화면은 유지되게
      }
    })();
  }, [search, navigate]);

  return null; // 별도 렌더링 요소 없이 처리만
}
