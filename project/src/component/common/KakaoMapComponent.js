// src/component/common/KakaoMapComponent.jsx
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";

function ensureKakaoReady() {
  return new Promise((resolve) => {
    const w = window;
    if (w.kakao && w.kakao.maps && typeof w.kakao.maps.Map === "function") {
      resolve();
      return;
    }
    const tryLoad = () => {
      if (w.kakao && w.kakao.maps) {
        w.kakao.maps.load(() => resolve());
      } else {
        const t = setInterval(() => {
          if (w.kakao && w.kakao.maps) {
            clearInterval(t);
            w.kakao.maps.load(() => resolve());
          }
        }, 100);
      }
    };
    tryLoad();
  });
}

export default function KakaoMapComponent({
  id,
  containerId,
  center,
  lat,
  lng,
  name = "",
  height = 300,
  showCenterMarker = true, // 내 위치 마커
  locations = [],          // 여러 시설 마커
  locationsCount,          // 리스트 변경 감지용
}) {
  const cid = useMemo(
    () => containerId || id || `kmap-${Math.random().toString(36).slice(2)}`,
    [containerId, id]
  );
  const initialCenter = useMemo(() => {
    const c = center || { lat, lng };
    return { lat: Number(c?.lat) || 37.5665, lng: Number(c?.lng) || 126.9780 };
  }, [center, lat, lng]);

  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const containerRef = useRef(null);
  const resizeObsRef = useRef(null);
  const markerListRef = useRef([]);

  // 최초 지도 생성
  useLayoutEffect(() => {
    let cancelled = false;
    const init = async () => {
      await ensureKakaoReady();
      if (cancelled) return;

      const container = document.getElementById(cid);
      if (!container) return;
      containerRef.current = container;

      const { kakao } = window;
      const mapCenter = new kakao.maps.LatLng(initialCenter.lat, initialCenter.lng);
      const map = new kakao.maps.Map(container, {
        center: mapCenter,
        level: 4,
      });

      // 줌 컨트롤 버튼 표시
      const zoomControl = new kakao.maps.ZoomControl();
      map.addControl(zoomControl, kakao.maps.ControlPosition.RIGHT);

      mapRef.current = map;

      // 내 위치 마커
      if (showCenterMarker) {
        const imageSrc = "/image/my-location-marker.png";
        const imageSize = new kakao.maps.Size(28, 40);
        const imageOption = { offset: new kakao.maps.Point(14, 40) };
        const markerImage = new kakao.maps.MarkerImage(imageSrc, imageSize, imageOption);

        const marker = new kakao.maps.Marker({
          position: mapCenter,
          image: markerImage,
          zIndex: 9999, // 항상 제일 위
        });

        marker.setMap(map);
        markerRef.current = marker;

        const infoWindow = new kakao.maps.InfoWindow({
          content: `<div style="padding:5px 10px;font-size:13px;">내 위치</div>`,
        });

        // 자동 표시 + 클릭 시 토글
        infoWindow.open(map, marker);
        let isOpen = true;
        kakao.maps.event.addListener(marker, "click", () => {
          if (isOpen) {
            infoWindow.close();
          } else {
            infoWindow.open(map, marker);
          }
          isOpen = !isOpen;
        });
      }

      // 초기 레이아웃 보정
      setTimeout(() => {
        try {
          map.relayout();
          map.setCenter(mapCenter);
        } catch {}
      }, 0);

      // 리사이즈 감지
      if ("ResizeObserver" in window) {
        const ro = new ResizeObserver(() => {
          try {
            map.relayout();
            map.setCenter(mapCenter);
          } catch {}
        });
        ro.observe(container);
        resizeObsRef.current = ro;
      }
    };

    init();
    return () => {
      cancelled = true;
      if (resizeObsRef.current && containerRef.current) {
        try {
          resizeObsRef.current.unobserve(containerRef.current);
        } catch {}
      }
      resizeObsRef.current = null;
      containerRef.current = null;

      if (markerRef.current) {
        try {
          markerRef.current.setMap(null);
        } catch {}
      }
      markerRef.current = null;

      markerListRef.current.forEach((m) => m.setMap(null));
      markerListRef.current = [];

      mapRef.current = null;
    };
  }, [cid]);

  // 센터 업데이트
  useEffect(() => {
    const { kakao } = window;
    if (!mapRef.current || !kakao) return;
    const map = mapRef.current;
    const pos = new kakao.maps.LatLng(initialCenter.lat, initialCenter.lng);

    try {
      map.setCenter(pos);
      setTimeout(() => {
        map.relayout();
        map.setCenter(pos);
      }, 0);
    } catch {}
  }, [initialCenter]);

  // 시설 마커 + 자동 줌 조정 + 클릭 토글
  useEffect(() => {
    const { kakao } = window;
    const map = mapRef.current;
    if (!map || !kakao) return;

    markerListRef.current.forEach((m) => m.setMap(null));
    markerListRef.current = [];

    // 여러 시설이 있는 경우
    if (Array.isArray(locations) && locations.length > 0 && lat && lng) {
      const myPos = new kakao.maps.LatLng(lat, lng);
      map.setCenter(myPos);

      let maxDistance = 0;
      locations.forEach((loc) => {
        if (!loc.latitude || !loc.longitude) return;
        const position = new kakao.maps.LatLng(loc.latitude, loc.longitude);
        const marker = new kakao.maps.Marker({ position, map });
        markerListRef.current.push(marker);

        // 거리 계산
        const line = new kakao.maps.Polyline({ path: [myPos, position] });
        const distance = line.getLength();
        if (distance > maxDistance) maxDistance = distance;

        // 인포윈도우 토글
        const iw = new kakao.maps.InfoWindow({
          content: `<div style="padding:5px 10px;font-size:13px;">${loc.name}</div>`,
        });
        let open = false;
        kakao.maps.event.addListener(marker, "click", () => {
          if (open) iw.close();
          else iw.open(map, marker);
          open = !open;
        });
      });

      // 자동 줌 설정
      let level;
      if (maxDistance < 300) level = 4;
      else if (maxDistance < 700) level = 5;
      else if (maxDistance < 1500) level = 6;
      else if (maxDistance < 3000) level = 7;
      else if (maxDistance < 5000) level = 8;
      else level = 9;

      map.setLevel(level);
    }

    // 단일 시설(상세페이지)
    else if (lat && lng) {
      const pos = new kakao.maps.LatLng(lat, lng);
      const marker = new kakao.maps.Marker({ position: pos, map });
      markerListRef.current.push(marker);

      if (name) {
        const iw = new kakao.maps.InfoWindow({
          content: `<div style="padding:5px 10px;font-size:13px;">${name}</div>`,
        });
        let open = false;
        kakao.maps.event.addListener(marker, "click", () => {
          if (open) iw.close();
          else iw.open(map, marker);
          open = !open;
        });
      }

      map.setCenter(pos);
      map.setLevel(4);
    }
  }, [locations, lat, lng, name]);

  // 레이아웃 재보정
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    const { kakao } = window;
    try {
      map.relayout();
      map.setCenter(new kakao.maps.LatLng(initialCenter.lat, initialCenter.lng));
    } catch {}
  }, [locationsCount, initialCenter]);

  return (
    <div
      id={cid}
      style={{
        width: "100%",
        height: typeof height === "number" ? `${height}px` : height,
      }}
      aria-label={name || "map"}
    />
  );
}