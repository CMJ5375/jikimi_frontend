// src/component/common/KakaoMapComponent.js
import { useEffect, useMemo } from "react";
import { loadKakaoMap, renderKakaoMap } from "../../api/kakaoMapApi"; // 파일명이 대소문자 구분되면 경로를 맞춰주세요.

/**
 * KakaoMapComponent
 * - 빈 locations일 때 (상세 페이지 등) 중심 좌표를 자동으로 1개 마커로 사용
 * - 즐겨찾기/페이지 전환 등 레이아웃 변화에 대비해 relayout 보강
 * - locations 변경 감지를 위해 좌표 시그니처(JSON) 의존
 */
const KakaoMapComponent = ({
  id = "map",
  lat,
  lng,
  name,
  height = 400,
  showCenterMarker = true,
  locations = [],
}) => {
  const vLat = Number(lat);
  const vLng = Number(lng);

  // 좌표 정규화 + 빈 배열이면 중심 좌표로 대체
  const normalizedLocations = useMemo(() => {
    const list = Array.isArray(locations) ? locations : [];
    const valid = list.filter(
      (p) => isFinite(Number(p?.latitude)) && isFinite(Number(p?.longitude))
    );

    if (valid.length > 0) {
      return valid.map((p) => ({
        name: p?.name ?? name ?? "시설 위치",
        latitude: Number(p.latitude),
        longitude: Number(p.longitude),
      }));
    }

    // fallback: 유효한 중심 좌표가 있으면 그것으로 1개 마커
    return isFinite(vLat) && isFinite(vLng)
      ? [{ name: name || "시설 위치", latitude: vLat, longitude: vLng }]
      : [];
  }, [locations, vLat, vLng, name]);

  // locations 변경을 안정적으로 감지하기 위한 시그니처
  const locSig = useMemo(
    () =>
      JSON.stringify(
        normalizedLocations.map((p) => [Number(p.latitude), Number(p.longitude)])
      ),
    [normalizedLocations]
  );

  useEffect(() => {
    let canceled = false;
    let ro; // ResizeObserver

    const init = async () => {
      if (!isFinite(vLat) || !isFinite(vLng)) {
        console.warn("[KakaoMapComponent] 유효하지 않은 좌표", { lat, lng });
        return;
      }

      try {
        await loadKakaoMap();
        if (canceled) return;

        const container = document.getElementById(id);
        if (!container) {
          console.error("[KakaoMapComponent] 컨테이너를 찾을 수 없음:", id);
          return;
        }

        // 기존 DOM 초기화 (중복 렌더 방지)
        container.innerHTML = "";

        console.debug("[KakaoMapComponent] render", {
          id,
          lat: vLat,
          lng: vLng,
          showCenterMarker,
          locations: normalizedLocations.length,
        });

        const map = await renderKakaoMap(
          id,
          { lat: vLat, lng: vLng },
          normalizedLocations,
          showCenterMarker
        );

        // 컨테이너 크기 변화에 따른 relayout 보강
        if (typeof ResizeObserver !== "undefined") {
          ro = new ResizeObserver(() => {
            try {
              (container._kakaoMapInstance || map)?.relayout();
            } catch {}
          });
          ro.observe(container);
        }

        // 첫 페인트 직후 한 번 더 보정
        requestAnimationFrame(() => {
          try {
            (container._kakaoMapInstance || map)?.relayout();
          } catch {}
        });
      } catch (e) {
        console.error("[KakaoMapComponent] 지도 로드/렌더 실패", e);
      }
    };

    init();

    return () => {
      canceled = true;
      if (ro) ro.disconnect();
    };
    // height가 변해도 컨테이너 높이가 바뀌므로 의존성에 포함
  }, [id, vLat, vLng, height, showCenterMarker, locSig]);

  return (
    <div
      id={id}
      style={{
        width: "100%",
        // number면 px로 적용됨. 문자열('300px')도 허용
        height,
      }}
    />
  );
};

export default KakaoMapComponent;
