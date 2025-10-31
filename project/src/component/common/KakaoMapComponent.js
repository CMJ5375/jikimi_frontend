// src/component/common/KakaoMapComponent.jsx
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";

function ensureKakaoReady() {
  return new Promise((resolve) => {
    const w = window;
    if (w.kakao && w.kakao.maps && typeof w.kakao.maps.Map === "function") {
      resolve();
      return;
    }
    // kakao sdk가 window.kakao.load 형태일 때 대비
    const tryLoad = () => {
      if (w.kakao && w.kakao.maps) {
        w.kakao.maps.load(() => resolve());
      } else {
        // 100ms 단위 폴링 (이미 스크립트가 index.html에 포함돼 있다고 가정)
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
  center,               // {lat, lng} 가능
  lat,
  lng,
  name = "",
  height = 300,
  showCenterMarker = true,
  locationsCount,       // 리스트/데이터 변경 트리거용(옵션)
}) {
  const cid = useMemo(() => containerId || id || `kmap-${Math.random().toString(36).slice(2)}`, [containerId, id]);
  const initialCenter = useMemo(() => {
    const c = center || { lat, lng };
    return { lat: Number(c?.lat) || 37.5665, lng: Number(c?.lng) || 126.9780 };
  }, [center, lat, lng]);

  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const containerRef = useRef(null);
  const resizeObsRef = useRef(null);

  // 최초 생성
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
      mapRef.current = map;

      // 최초 마커
      if (showCenterMarker) {
        const marker = new kakao.maps.Marker({ position: mapCenter });
        marker.setMap(map);
        markerRef.current = marker;
      }

      // 최초 레이아웃 보정 (숨김 → 표시 전환 등)
      setTimeout(() => {
        try {
          map.relayout();
          map.setCenter(mapCenter);
        } catch {}
      }, 0);

      // 컨테이너 사이즈 변화를 관찰해서 relayout
      if ("ResizeObserver" in window) {
        const ro = new ResizeObserver(() => {
          try {
            map.relayout();
            map.setCenter(new kakao.maps.LatLng(initialCenter.lat, initialCenter.lng));
          } catch {}
        });
        ro.observe(container);
        resizeObsRef.current = ro;
      }
    };

    init();
    return () => {
      cancelled = true;
      // 정리
      if (resizeObsRef.current && containerRef.current) {
        try { resizeObsRef.current.unobserve(containerRef.current); } catch {}
      }
      resizeObsRef.current = null;
      containerRef.current = null;

      if (markerRef.current) {
        try { markerRef.current.setMap(null); } catch {}
      }
      markerRef.current = null;
      mapRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cid]); // 컨테이너 id가 바뀔 때만 완전 재생성

  // 센터/마커 업데이트 (props 변경 시)
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

    // 마커 on/off
    if (showCenterMarker) {
      if (!markerRef.current) {
        const m = new kakao.maps.Marker({ position: pos });
        m.setMap(map);
        markerRef.current = m;
      } else {
        markerRef.current.setPosition(pos);
        markerRef.current.setMap(map);
      }
    } else if (markerRef.current) {
      try { markerRef.current.setMap(null); } catch {}
      markerRef.current = null;
    }
  }, [initialCenter, showCenterMarker]);

  // 리스트/데이터 수 변화(예: favorites 토글) → 레이아웃 재보정
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
      style={{ width: "100%", height: typeof height === "number" ? `${height}px` : height }}
      aria-label={name || "map"}
    />
  );
}
