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

    // 병합 후 즉시 적용
    const f = { ...filters, ...(newFilters || {}) };
    setFilters(f);

   try {
      const params = new URLSearchParams();
      if (f.keyword) params.append("keyword", f.keyword);
      if (f.org && type === "hospital") params.append("org", f.org);
      if (f.dept && type === "hospital") params.append("dept", f.dept);
      if (typeof f.emergency === "boolean" && type === "hospital") {
        params.append("emergency", String(f.emergency));
      }
      if (f.distance && type === "pharmacy") params.append("distance", f.distance);

      // 즐겨찾기만 보기 서버 연동
      if (f.onlyFavorites) params.append("onlyFavorites", "true");

      // 위치가 있으면 전달 (거리 계산/정렬용)
      if (currentPos.lat != null && currentPos.lng != null) {
        params.append("lat", currentPos.lat);
        params.append("lng", currentPos.lng);
      }
      params.append("page", newPage);
      params.append("size", 10);

      const url =
        type === "hospital"
          ? `http://localhost:8080/project/hospital/search?${params.toString()}`
          : `http://localhost:8080/project/pharmacy/search?${params.toString()}`;

      console.log(`[useFacilitySearch] 요청 URL: ${url}`);

      const res = await fetch(url);
      if (!res.ok) throw new Error(`서버 오류: ${res.status}`);
      const pageJson = await res.json();

      const data = Array.isArray(pageJson.content) ? pageJson.content : [];

      const normalized = data.map((item) => {
        let displayDistance = "";
        const d = item.distance;
        if (typeof d === "number" && isFinite(d)) {
          displayDistance = d < 1 ? `${Math.round(d * 1000)}m` : `${d.toFixed(1)}km`;
        } else if (typeof d === "string") {
          displayDistance = d;
        }

        return {
          id: item[`${type}Id`],
          [`${type}Id`]: item[`${type}Id`],
          name: item.name || item.hospitalName || item.pharmacyName,
          address: item.address || item.roadAddress || item.addr,
          phone: item.phone || item.tel,
          open: item.open,
          distance: displayDistance,
          lat: item.lat ?? item.latitude,
          lng: item.lng ?? item.longitude,
          raw: item,
        };
      });

      setResults(normalized);

      // 페이지네이션 정보 매핑 (서버 응답 기반)
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