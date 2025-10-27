// src/component/common/KakaoMapComponent.js
import { useEffect } from "react";
import { loadKakaoMap, renderKakaoMap } from "../../api/kakaoMapApi";

const KakaoMapComponent = ({
  id = "map",
  lat,
  lng,
  name,
  height = 400,
  showCenterMarker = true,
  locations = [],
}) => {
  useEffect(() => {
    const vLat = Number(lat);
    const vLng = Number(lng);
    if (!isFinite(vLat) || !isFinite(vLng)) {
      console.warn("[KakaoMapComponent] 유효하지 않은 좌표", { lat, lng });
      return;
    }

    // 상세페이지에서 locations가 비어 있다면 해당 시설을 자동으로 추가
    const mapLocations =
      Array.isArray(locations) && locations.length > 0
        ? locations
        : [
            {
              latitude: vLat,
              longitude: vLng,
              name: name || "시설 위치",
            },
          ];

    loadKakaoMap().then(() => {
      const container = document.getElementById(id);
      if (!container) {
        console.error("[KakaoMapComponent] 컨테이너를 찾을 수 없음:", id);
        return;
      }

      // 기존 지도 초기화
      container.innerHTML = "";

      console.log("[KakaoMapComponent] render 호출", {
        id,
        lat: vLat,
        lng: vLng,
        showCenterMarker,
        locations: mapLocations.length,
      });

      // 지도 렌더링
      renderKakaoMap(id, { lat: vLat, lng: vLng }, mapLocations, showCenterMarker);
    });
  }, [id, lat, lng, name, height, showCenterMarker, locations]);

  return <div id={id} style={{ width: "100%", height: `${height}px` }} />;
};

export default KakaoMapComponent;