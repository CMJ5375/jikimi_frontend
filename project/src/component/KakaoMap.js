import { useEffect } from "react";

const KakaoMap = () => {
  useEffect(() => {
    const script = document.createElement("script");
    script.src =
      "//dapi.kakao.com/v2/maps/sdk.js?appkey=485d664e9dbeef94c4a676b73b34a111&autoload=false";
    script.async = true;
    document.head.appendChild(script);

    script.onload = () => {
      // SDK 로드 후 실행
      window.kakao.maps.load(() => {
        const container = document.getElementById("map");
        const options = {
          center: new window.kakao.maps.LatLng(37.5665, 126.9780), // 서울 시청 좌표
          level: 3,
        };

        new window.kakao.maps.Map(container, options);
      });
    };
  }, []);

  return (
    <div>
      <h1>카카오맵</h1>
      <div
        id="map"
        style={{ width: "500px", height: "400px", background: "#eee" }}
      ></div>
    </div>
  );
};

export default KakaoMap;
