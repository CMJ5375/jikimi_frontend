import { API_SERVER_HOST } from "../config/api";

const kakao_js_key = process.env.REACT_APP_KAKAO_JS_KEY || "485d664e9dbeef94c4a676b73b34a111";
const TAG = "[kakaoMapApi]";
const okNum = (n) => typeof n === "number" && isFinite(n);

// 기본 위치
const DEFAULT_LOCATION = { lat: 37.432764, lng: 127.129637 };

// Kakao Map SDK 로드 (중복 방지)
export const loadKakaoMap = () =>
  new Promise((resolve) => {
    try {
      if (window.kakao && window.kakao.maps) {
        console.debug(`${TAG} SDK 이미 로드됨 → maps.load 호출`);
        window.kakao.maps.load(() => resolve(window.kakao.maps));
        return;
      }
      console.debug(`${TAG} SDK 스크립트 삽입`);
      const script = document.createElement("script");
      script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${kakao_js_key}&autoload=false`;
      script.async = true;
      script.onload = () => {
        console.debug(`${TAG} SDK onload → maps.load 호출`);
        window.kakao.maps.load(() => resolve(window.kakao.maps));
      };
      script.onerror = (e) => console.error(`${TAG} SDK 로드 실패`, e);
      document.head.appendChild(script);
    } catch (e) {
      console.error(`${TAG} loadKakaoMap 예외`, e);
    }
  });

// 지도 생성
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
    console.debug(`${TAG} createMap: 지도 생성`, { containerId, lat, lng, level });
    const map = new window.kakao.maps.Map(container, options);
    container._kakaoMapInstance = map;
    return map;
  } catch (e) {
    console.error(`${TAG} createMap 예외`, e);
    return null;
  }
};

// 마커 추가
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

// 상세페이지 렌더
export const renderKakaoMap = async (containerId, center, locations = [], showCenterMarker = true) => {
  console.group(`${TAG} renderKakaoMap`);
  console.log("입력값 →", { containerId, center, locationsCount: locations?.length, showCenterMarker });

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

    // 기존 마커 제거
    if (map._markers) map._markers.forEach((m) => m && m.setMap(null));
    map._markers = [];

    if (showCenterMarker) {
      const my = addMarker(map, { lat, lng }, "내 위치");
      if (my) map._markers.push(my);
    }

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
      const f = locations[0];
      map.setCenter(new kakao.LatLng(f.latitude, f.longitude));
      map.setLevel(3);
      console.debug(`${TAG} 단일 시설 중심 설정`);
    } else if (added > 0) {
      const bounds = new kakao.LatLngBounds();
      if (showCenterMarker) bounds.extend(new kakao.LatLng(lat, lng));
      locations.forEach((f) => {
        if (okNum(f?.latitude) && okNum(f?.longitude)) {
          bounds.extend(new kakao.LatLng(f.latitude, f.longitude));
        }
      });
      map.setBounds(bounds);
      console.debug(`${TAG} setBounds 적용`);
    }

    console.groupEnd();
    return map;
  } catch (e) {
    console.error(`${TAG} renderKakaoMap 예외`, e);
    console.groupEnd();
    return null;
  }
};

// 기본 좌표 반환
export function getDefaultPosition() {
  return Promise.resolve(DEFAULT_LOCATION);
}

// 백엔드에서 카카오 주소 받아오기
export async function getAddressFromBackend(lat, lon) {
  try {
    const response = await fetch(`${API_SERVER_HOST}/project/map/reverse?lat=${lat}&lon=${lon}`, {
      method: "GET",
    });
    if (!response.ok) throw new Error(`서버 응답 오류: ${response.status}`);

    const data = await response.json();

    if (data.documents && data.documents.length > 0) {
      const doc = data.documents[0];
      const road = doc.road_address;
      const addr = doc.address;

      if (road) {
        const fullRoad = `${road.region_1depth_name} ${road.region_2depth_name} ${road.region_3depth_name} ${road.road_name} ${road.main_building_no || ""}`.trim();
        return fullRoad;
      } else if (addr) {
        const fullAddr = `${addr.region_1depth_name} ${addr.region_2depth_name} ${addr.region_3depth_name} ${addr.main_address_no || ""}`.trim();
        return fullAddr;
      }
    }
    return "주소 정보를 가져올 수 없습니다.";
  } catch (err) {
    console.error("카카오 주소 백엔드 호출 중 오류:", err);
    return "주소 정보를 가져올 수 없습니다.";
  }
}
