// src/hook/useFacilitySearch.js
import { useState, useEffect } from "react";
import { addDistanceAndSort, getDefaultPosition } from "../api/geolocationApi";
import { openUtil } from "../util/openUtil";

/**
 * 병원/약국 공용 검색 Hook
 * - HospitalMain / PharmacyMain 모두 사용 가능
 *
 * @param {string} type "hospital" | "pharmacy"
 * @returns {object} { results, pageData, currentPos, page, search }
 */
export default function useFacilitySearch(type) {
  const [results, setResults] = useState([]);
  const [pageData, setPageData] = useState(null);
  const [currentPos, setCurrentPos] = useState({ lat: null, lng: null });
  const [page, setPage] = useState(0);

  // 기본 위치 가져오기
  useEffect(() => {
    getDefaultPosition().then(setCurrentPos);
  }, []);

  // 검색 로직
  const search = async (e, newPage = 0) => {
    if (e) e.preventDefault();
    try {
      const url = `http://localhost:8080/project/${type}/list?page=${newPage}&size=10`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`서버 오류: ${res.status}`);
      const pageJson = await res.json();

      const data = Array.isArray(pageJson.content) ? pageJson.content : [];

      // 병원/약국 공통 포맷 변환
      const normalized = data.map((item) => ({
        id: item[`${type}Id`],
        name: item[`${type}Name`],
        address: item.facility?.address || "",
        phone: item.facility?.phone || "",
        latitude: item.facility?.latitude,
        longitude: item.facility?.longitude,
        orgType: item.orgType || "",
        hasEmergency: item.hasEmergency ?? false,
        open: openUtil(item.facilityBusinessHours || item.facility?.businessHours || []),
        distance: item.distance
          ? item.distance < 1
            ? `${Math.round(item.distance * 1000)}m`
            : `${item.distance.toFixed(1)}km`
          : "",
      }));

      // 거리 계산 및 정렬
      const withDistance = addDistanceAndSort(normalized, currentPos);

      // 페이지네이션 데이터 구성
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

  return { results, pageData, currentPos, page, search };
}
