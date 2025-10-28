// src/hook/useFacilitySearch.js
import { useState, useEffect } from "react";
import { addDistanceAndSort, getDefaultPosition } from "../api/geolocationApi";
import { openUtil } from "../util/openUtil";

export default function useFacilitySearch(type) {
  const [results, setResults] = useState([]);
  const [pageData, setPageData] = useState(null);
  const [currentPos, setCurrentPos] = useState({ lat: null, lng: null });
  const [page, setPage] = useState(0);

  const [filters, setFilters] = useState({
    keyword: "",
    org: "",
    dept: "",
    emergency: false,
    distance: "",
    onlyFavorites: false,
  });

  useEffect(() => {
    getDefaultPosition().then(setCurrentPos);
  }, []);

  const search = async (e, newPage = 0, newFilters) => {
    if (e) e.preventDefault();

    const f = { ...filters, ...(newFilters || {}) };
    setFilters(f);

    try {
      const params = new URLSearchParams();

      if (f.keyword) params.append("keyword", f.keyword);
      if (type === "hospital") {
        if (f.org) params.append("org", f.org);
        if (f.dept) params.append("dept", f.dept);
        if (typeof f.emergency === "boolean")
          params.append("emergency", String(f.emergency));
      } else if (type === "pharmacy") {
        if (f.distance) params.append("distance", f.distance);
      }

      // 즐겨찾기만 보기 플래그 항상 전달
      params.append("onlyFavorites", String(!!f.onlyFavorites));

      // 현재 위치 전달 (거리 계산용)
      if (currentPos.lat != null && currentPos.lng != null) {
        params.append("lat", currentPos.lat);
        params.append("lng", currentPos.lng);
      }

      params.append("page", newPage);
      params.append("size", 10);

      const base =
        type === "hospital"
          ? "http://localhost:8080/project/hospital/search"
          : "http://localhost:8080/project/pharmacy/search";

      const url = `${base}?${params.toString()}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error(`서버 오류: ${res.status}`);

      const pageJson = await res.json();
      const data = Array.isArray(pageJson.content) ? pageJson.content : [];

      const normalized = data.map((item) => {
        const fac = item.facility || {};

        // 거리 계산 (서버 값이 없으면 프론트에서 계산)
        const lat = fac.latitude ?? null;
        const lng = fac.longitude ?? null;

        let distanceValue = item.distance;
        if (distanceValue == null && currentPos.lat && currentPos.lng && lat && lng) {
          const R = 6371;
          const toRad = (deg) => (deg * Math.PI) / 180;
          const dLat = toRad(lat - currentPos.lat);
          const dLng = toRad(lng - currentPos.lng);
          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(currentPos.lat)) *
              Math.cos(toRad(lat)) *
              Math.sin(dLng / 2) *
              Math.sin(dLng / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          distanceValue = R * c;
        }

        let displayDistance = "";
        if (typeof distanceValue === "number" && isFinite(distanceValue)) {
          displayDistance =
            distanceValue < 1
              ? `${Math.round(distanceValue * 1000)}m`
              : `${distanceValue.toFixed(1)}km`;
        } else if (typeof distanceValue === "string") {
          displayDistance = distanceValue;
        }

        return {
          id: item[`${type}Id`],
          facilityId: fac.facilityId,
          name: item[`${type}Name`],
          address: fac.address || "",
          phone: fac.phone || "",
          latitude: fac.latitude,
          longitude: fac.longitude,
          orgType: item.orgType || "",
          hasEmergency: item.hasEmergency ?? false,
          open: openUtil(item.facilityBusinessHours || fac.businessHours || []),
          distance: displayDistance,
        };
      });

      // 프론트 거리 기준으로 정렬
      const sorted = addDistanceAndSort(normalized, currentPos);
      setResults(sorted);

      // 페이지네이션 매핑
      const totalPages = pageJson.totalPages ?? 0;
      const current = pageJson.number ?? 0;
      const pageNumList = Array.from({ length: totalPages }, (_, i) => i + 1);

      setPageData({
        current,
        totalPage: totalPages,
        pageNumList,
        prev: !pageJson.first,
        next: !pageJson.last,
        prevPage: newPage > 0 ? newPage - 1 : 0,
        nextPage: newPage < totalPages - 1 ? newPage + 1 : newPage,
      });

      setPage(newPage);
    } catch (error) {
      console.error("검색 실패:", error);
    }
  };

  return { results, pageData, currentPos, page, search, filters, setFilters };
}
