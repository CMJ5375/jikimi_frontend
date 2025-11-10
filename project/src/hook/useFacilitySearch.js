// src/hook/useFacilitySearch.js
import { useState, useEffect } from "react";
import { addDistanceAndSort, getDefaultPosition } from "../api/geolocationApi";
import { openUtil } from "../util/openUtil";
import publicAxios from "../util/publicAxios";         // ✅ 공통 Axios 인스턴스
import { apiUrl } from "../config/api";                // (필요시 절대 URL 생성용)

const isNil = (v) => v === null || v === undefined;

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
    getDefaultPosition().then((pos) => {
      setCurrentPos(pos || { lat: null, lng: null });
    });
  }, []);

  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    if (isNil(lat1) || isNil(lng1) || isNil(lat2) || isNil(lng2)) return "";
    const R = 6371;
    const toRad = (deg) => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const dist = R * c;
    return dist < 1 ? `${Math.round(dist * 1000)}m` : `${dist.toFixed(1)}km`;
  };

  const search = async (e, newPage = 0, newFilters) => {
    if (e) e.preventDefault();

    const f = { ...filters, ...(newFilters || {}) };
    setFilters(f);

    try {
      const params = {
        onlyFavorites: !!f.onlyFavorites,
        page: newPage,
        size: 10,
      };

      if (f.keyword) params.keyword = f.keyword;

      if (type === "hospital") {
        if (f.org) params.org = f.org;
        if (f.dept) params.dept = f.dept;
        if (f.emergency === true) params.emergency = true;
      } else if (type === "pharmacy") {
        if (f.distance) params.distance = f.distance;
      }

      if (!isNil(currentPos.lat) && !isNil(currentPos.lng)) {
        params.lat = currentPos.lat;
        params.lng = currentPos.lng;
      }

      const endpoint =
        type === "hospital"
          ? "/project/hospital/search"
          : "/project/pharmacy/search";

      // ✅ 1) baseURL 방식 (권장): 혼합콘텐츠 자동 방지
      const res = await publicAxios.get(endpoint, {
        params,
        withCredentials: !!f.onlyFavorites, // 즐겨찾기만 쿠키 필요한 경우 true
      });

      // ✅ 2) (대안) 절대 URL로 호출하고 싶다면:
      // const res = await publicAxios.get(apiUrl(endpoint), {
      //   params,
      //   withCredentials: !!f.onlyFavorites,
      // });

      const pageJson = res?.data ?? {};
      const data = Array.isArray(pageJson.content) ? pageJson.content : [];

      const normalized = data.map((item) => {
        const fac = item.facility || {};
        const lat = isNil(fac.latitude) ? null : fac.latitude;
        const lng = isNil(fac.longitude) ? null : fac.longitude;

        let distanceValue = item.distance;
        if (
          isNil(distanceValue) &&
          !isNil(currentPos.lat) &&
          !isNil(currentPos.lng) &&
          !isNil(lat) &&
          !isNil(lng)
        ) {
          distanceValue = calculateDistance(currentPos.lat, currentPos.lng, lat, lng);
        }

        let displayDistance = "";
        if (typeof distanceValue === "string") {
          displayDistance = distanceValue;
        } else if (typeof distanceValue === "number" && isFinite(distanceValue)) {
          displayDistance =
            distanceValue < 1
              ? `${Math.round(distanceValue * 1000)}m`
              : `${distanceValue.toFixed(1)}km`;
        }

        return {
          id: item[`${type}Id`] ?? item.id ?? fac.facilityId,
          facilityId: fac.facilityId,
          name: item[`${type}Name`] ?? item.name ?? fac.name ?? "",
          address: fac.address || "",
          phone: fac.phone || "",
          latitude: lat,
          longitude: lng,
          orgType: item.orgType || "",
          hasEmergency: item.hasEmergency ?? false,
          open: openUtil(item.facilityBusinessHours || fac.businessHours || []),
          distance: displayDistance,
        };
      });

      const sorted = addDistanceAndSort(normalized, currentPos);
      setResults(sorted);

      const totalPages = pageJson.totalPages ?? 0;
      const current = pageJson.number ?? newPage;
      const pageNumList = Array.from({ length: totalPages }, (_, i) => i + 1);

      setPageData({
        current,
        totalPage: totalPages,
        pageNumList,
        prev: !pageJson.first && totalPages > 0,
        next: !pageJson.last && totalPages > 0,
        prevPage: newPage > 0 ? newPage - 1 : 0,
        nextPage: newPage < totalPages - 1 ? newPage + 1 : newPage,
      });

      setPage(newPage);
    } catch (error) {
      console.error("검색 실패:", error);
    }
  };

  return {
    results,
    pageData,
    currentPos,
    page,
    search,
    filters,
    setFilters,
    calculateDistance,
  };
}
