//성남 모란 두드림IT학원 기준
const DEFAULT_LOCATION = {
  lat: 37.432764,
  lng: 127.129637,
};

//기본 위치
export function getDefaultPosition() {
  return Promise.resolve(DEFAULT_LOCATION);
}

//실제 사용자 위치 가져오기
export function getCurrentPosition() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.warn("이 브라우저는 위치 정보를 지원하지 않습니다. 기본 위치로 설정합니다.");
      return resolve(DEFAULT_LOCATION);
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const latitude = pos.coords.latitude;
        const longitude = pos.coords.longitude;
        resolve({ lat: latitude, lng: longitude });
      },
      (err) => {
        console.warn(`위치 정보를 가져오지 못했습니다 (${err.message}). 기본 위치로 대체합니다.`);
        resolve(DEFAULT_LOCATION);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
}

//거리 계산 (Haversine formula, m 단위)
export function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // meters
  const toRad = (deg) => (deg * Math.PI) / 180;
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lon2 - lon1);

  const a =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // meters
}

//시설 리스트에 거리 추가 및 거리순 정렬
export function addDistanceAndSort(list, currentPos) {
  if (!currentPos?.lat || !currentPos?.lng) {
    console.warn("현재 위치 정보가 없어 거리 계산을 생략합니다.");
    return list;
  }

  return list
    .map((item) => {
      if (item.latitude && item.longitude) {
        const distM = getDistance(
          currentPos.lat,
          currentPos.lng,
          parseFloat(item.latitude),
          parseFloat(item.longitude)
        );
        return {
          ...item,
          distanceValue: distM / 1000, // km
          distance: distM > 1000 ? `${(distM / 1000).toFixed(1)}km` : `${Math.round(distM)}m`,
        };
      }
      return { ...item, distance: "-", distanceValue: Infinity };
    })
    .sort((a, b) => a.distanceValue - b.distanceValue);
}
