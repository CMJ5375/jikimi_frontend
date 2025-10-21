//src/api/kakaoMapApi.js

//kakao 키 값
const kakao_app_key = `485d664e9dbeef94c4a676b73b34a111`

//Kakao Map SDK 로드 (중복 방지)
export const loadKakaoMap = () =>
  new Promise((resolve) => {
    if (window.kakao && window.kakao.maps) {
      window.kakao.maps.load(() => resolve(window.kakao.maps));
      return;
    }

    const script = document.createElement("script");
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${kakao_app_key}&autoload=false`;
    script.async = true;
    script.onload = () => {
      window.kakao.maps.load(() => resolve(window.kakao.maps));
    };
    document.head.appendChild(script);
  });

//지도 생성
export const createMap = (containerId, center, level = 5) => {
  const container = document.getElementById(containerId);
  if (!container) {
    console.warn(`map container '${containerId}'를 찾을 수 없습니다.`);
    return null;
  }

  const options = {
    center: new window.kakao.maps.LatLng(center.lat, center.lng),
    level,
  };

  return new window.kakao.maps.Map(container, options);
};

//마커 추가
export const addMarker = (map, position, title = "") => {
  const marker = new window.kakao.maps.Marker({
    position: new window.kakao.maps.LatLng(position.lat, position.lng),
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
};

//지도에 현재 위치 및 시설 마커 렌더링
export const renderKakaoMap = async (containerId, center, locations = []) => {
  const kakao = await loadKakaoMap();
  const map = createMap(containerId, center, 4);

  if (!map) return;

  //내 위치 마커
  addMarker(map, center, "내 위치");

  //시설 마커
  locations.forEach((f) => {
    if (f.latitude && f.longitude) {
      addMarker(map, { lat: f.latitude, lng: f.longitude }, f.name);
    }
  });

  //지도 범위 자동 맞춤
  if (locations.length > 0) {
    const bounds = new kakao.LatLngBounds();
    bounds.extend(new kakao.LatLng(center.lat, center.lng));
    locations.forEach((f) => {
      if (f.latitude && f.longitude) {
        bounds.extend(new kakao.LatLng(f.latitude, f.longitude));
      }
    });
    map.setBounds(bounds);
  }

  return map;
};
