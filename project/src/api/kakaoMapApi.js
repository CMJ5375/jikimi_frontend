// src/api/KakaoMapApi.js
import { apiUrl } from "../config/api";

const TAG = "[kakaoMapApi]";
const SDK_ID = "kakao-maps-sdk";

// .env 우선, 없으면 하드코드 키 사용
const KAKAO_JS_KEY =
  process.env.REACT_APP_KAKAO_JS_KEY || "833b650fdaeb02dc3ecc3abe1b82cdd7";

const okNum = (n) => typeof n === "number" && isFinite(n);

// 기본 위치 - 성남 모란 두드림 IT학원
const DEFAULT_LOCATION = { lat: 37.432764, lng: 127.129637 };

/**
 * Kakao Map SDK 로드 (중복 방지 + https 강제 + 키 변경시 스크립트 교체)
 */
export const loadKakaoMap = () =>
  new Promise((resolve, reject) => {
    try {
      // 이미 로드된 경우
      if (window.kakao?.maps) {
        window.kakao.maps.load(() => resolve(window.kakao.maps));
        return;
      }

      const desiredSrc = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(
        KAKAO_JS_KEY
      )}&autoload=false`;

      // 기존 스크립트 존재 여부 확인
      const exist = document.getElementById(SDK_ID);
      if (exist) {
        // 키가 바뀌어 src가 다르면 교체
        if (!exist.src || !exist.src.startsWith(desiredSrc)) {
          try {
            exist.remove();
            console.warn(`${TAG} 기존 SDK 태그 제거 후 재삽입 (키/URL 변경)`);
          } catch {}
        } else {
          // 같은 스크립트면 load/error 이벤트만 걸어둠
          exist.addEventListener("load", () => {
            if (window.kakao?.maps) {
              window.kakao.maps.load(() => resolve(window.kakao.maps));
            } else {
              reject(new Error("Kakao SDK loaded but kakao.maps missing"));
            }
          });
          exist.addEventListener("error", (e) => {
            console.error(`${TAG} SDK 로드 실패(중복)`, e);
            reject(new Error("Kakao SDK load failed"));
          });
          return;
        }
      }

      // 신규 삽입
      const script = document.createElement("script");
      script.id = SDK_ID;
      // https 강제 + 키/URL 로그
      script.src = desiredSrc;
      console.log(`${TAG} will load:`, script.src);

      script.async = true;
      script.defer = true;

      script.onload = () => {
<<<<<<< HEAD
        try {
          window.kakao.maps.load(() => resolve(window.kakao.maps));
        } catch (err) {
          reject(err);
        }
=======
        window.kakao.maps.load(() => resolve(window.kakao.maps));
>>>>>>> 65cf3917b0e9f8f83d4563eb2cc8f53d382f81a6
      };
      script.onerror = (e) => {
        console.error(`${TAG} SDK 로드 실패`, e);
        reject(new Error("Kakao SDK load failed"));
      };

      document.head.appendChild(script);
    } catch (e) {
      console.error(`${TAG} loadKakaoMap 예외`, e);
      reject(e);
    }
  });

/** 지도 생성 */
export const createMap = (containerId, center, level = 4) => {
  try {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`${TAG} createMap: 컨테이너 없음`, containerId);
      return null;
    }

    const lat = Number(center?.lat);
    const lng = Number(center?.lng);
    if (!okNum(lat) || !okNum(lng)) {
      console.error(`${TAG} createMap: 잘못된 중심 좌표`, { center, lat, lng });
      return null;
    }

    const options = { center: new window.kakao.maps.LatLng(lat, lng), level };
    const map = new window.kakao.maps.Map(container, options);
    container._kakaoMapInstance = map;
    return map;
  } catch (e) {
    console.error(`${TAG} createMap 예외`, e);
    return null;
  }
};

/** 마커 추가 */
export const addMarker = (map, position, title = "") => {
  try {
    const lat = Number(position?.lat);
    const lng = Number(position?.lng);
    if (!okNum(lat) || !okNum(lng)) {
      console.warn(`${TAG} addMarker: 잘못된 좌표`, position);
      return null;
    }

    const marker = new window.kakao.maps.Marker({
      position: new window.kakao.maps.LatLng(lat, lng),
      map,
      title,
    });

    if (title) {
      const infowindow = new window.kakao.maps.InfoWindow({
        content: `<div style="padding:5px;font-size:12px">${title}</div>`,
      });
      window.kakao.maps.event.addListener(marker, "click", () => {
        infowindow.open(map, marker);
      });
    }
    return marker;
  } catch (e) {
    console.error(`${TAG} addMarker 예외`, e);
    return null;
  }
};

/** 상세/목록 공용 렌더 */
export const renderKakaoMap = async (
  containerId,
  center,
  locations = [],
  showCenterMarker = true
) => {
  console.group(`${TAG} renderKakaoMap`);
  console.log("입력값 →", {
    containerId,
    center,
    locationsCount: locations?.length,
    showCenterMarker,
  });

  try {
    const kakao = await loadKakaoMap();
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`${TAG} render: 컨테이너 없음`, containerId);
      console.groupEnd();
      return;
    }

    const lat = Number(center?.lat);
    const lng = Number(center?.lng);
    if (!okNum(lat) || !okNum(lng)) {
      console.error(`${TAG} render: 잘못된 중심 좌표`, center);
      console.groupEnd();
      return;
    }

    let map = container._kakaoMapInstance;
    if (map) {
      map.setCenter(new kakao.LatLng(lat, lng));
      map.relayout();
    } else {
      map = createMap(containerId, { lat, lng }, 4);
      if (!map) return;
    }

    // 이전 마커 제거
    if (map._markers) map._markers.forEach((m) => m && m.setMap(null));
    map._markers = [];

    // 내 위치 마커
    if (showCenterMarker) {
      const my = addMarker(map, { lat, lng }, "내 위치");
      if (my) map._markers.push(my);
    }

    // 시설 마커
    let added = 0;
    locations?.forEach((f) => {
      const flat = Number(f?.latitude);
      const flng = Number(f?.longitude);
      if (okNum(flat) && okNum(flng)) {
        const mk = addMarker(map, { lat: flat, lng: flng }, f?.name || "");
        if (mk) map._markers.push(mk);
        added++;
      }
    });

    if (!showCenterMarker && added === 1) {
      // 상세: 시설 1개
      const f = locations[0];
      map.setCenter(new kakao.LatLng(f.latitude, f.longitude));
      map.setLevel(3);
      console.debug(`${TAG} 단일 시설 중심 설정`);
    } else if (added > 0) {
      // 목록: 범위 맞춤
      const bounds = new kakao.LatLngBounds();
      if (showCenterMarker) bounds.extend(new kakao.LatLng(lat, lng));
      locations.forEach((f) => {
        if (okNum(f?.latitude) && okNum(f?.longitude)) {
          bounds.extend(new kakao.LatLng(f.latitude, f.longitude));
        }
      });
      map.setBounds(bounds);
    }

    console.groupEnd();
    return map;
  } catch (e) {
    console.error(`${TAG} renderKakaoMap 예외`, e);
    console.groupEnd();
    return null;
  }
};

/** 기본 좌표 반환 */
export function getDefaultPosition() {
  return Promise.resolve(DEFAULT_LOCATION);
}

/** 백엔드 역지오코딩 (혼합콘텐츠 방지: apiUrl 사용) */
export async function getAddressFromBackend(lat, lon) {
  try {
    const url = apiUrl(`/project/map/reverse?lat=${lat}&lon=${lon}`);
    const response = await fetch(url, { method: "GET" });
    if (!response.ok) throw new Error(`서버 응답 오류: ${response.status}`);

    const data = await response.json();
    const doc = data?.documents?.[0];
    const road = doc?.road_address;
    const addr = doc?.address;

    if (road) {
      return `${road.region_1depth_name} ${road.region_2depth_name} ${road.region_3depth_name} ${road.road_name} ${
        road.main_building_no || ""
      }`.trim();
    }
    if (addr) {
      return `${addr.region_1depth_name} ${addr.region_2depth_name} ${addr.region_3depth_name} ${
        addr.main_address_no || ""
      }`.trim();
    }
    return "주소 정보를 가져올 수 없습니다.";
  } catch (err) {
    console.error("카카오 주소 백엔드 호출 중 오류:", err);
    return "주소 정보를 가져올 수 없습니다.";
  }
}
