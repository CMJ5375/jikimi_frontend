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
      if (f.org) params.append("org", f.org);
      if (f.dept) params.append("dept", f.dept);
      if (f.emergency) params.append("emergency", f.emergency);
      if (f.distance && String(f.distance).trim() !== "") {
        params.append("distance", f.distance);
      }
      if (currentPos.lat && currentPos.lng) {
        params.append("lat", currentPos.lat);
        params.append("lng", currentPos.lng);
      }
      params.append("page", newPage);
      params.append("size", 10);

      // 약국 검색 URL 수정
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
          facilityId: item.facility?.facilityId,
          name: item[`${type}Name`],
          address: item.facility?.address || "",
          phone: item.facility?.phone || "",
          latitude: item.facility?.latitude,
          longitude: item.facility?.longitude,
          orgType: item.orgType || "",
          hasEmergency: item.hasEmergency ?? false,
          open: openUtil(item.facilityBusinessHours || item.facility?.businessHours || []),
          distance: displayDistance,
        };
      });

      const withDistance = addDistanceAndSort(normalized, currentPos);

      const totalPages = pageJson.totalPages;
      const current = pageJson.number + 1;
      const pageNumList = Array.from({ length: totalPages }, (_, i) => i + 1);

      setResults(withDistance);
      setPageData({
        ...pageJson,
        content: withDistance,
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