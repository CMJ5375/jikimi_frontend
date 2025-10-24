// src/component/common/KakaoMapComponent.js
import { useEffect } from "react";
import { renderKakaoMap } from "../../api/kakaoMapApi";

/**
 * ✅ KakaoMapComponent
 * 공통 지도 렌더링 컴포넌트
 *
 * @param {string} id  - 지도 div의 id (기본값: "map")
 * @param {number} lat - 위도
 * @param {number} lng - 경도
 * @param {string} name - 마커 이름
 */
const KakaoMapComponent = ({ id = "map", lat, lng, name, height = 400 }) => {
  useEffect(() => {
    if (!lat || !lng) return;
    renderKakaoMap(id, { lat, lng }, [
      { name, latitude: lat, longitude: lng },
    ]);
  }, [lat, lng, name]);

  return (
    <div
      id={id}
      className="kakao-map"
      style={{ width: "100%", height: `${height}px` }}
    ></div>
  );
};

export default KakaoMapComponent;
