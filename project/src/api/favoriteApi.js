// favoriteApi.js
import jwtAxios from "../util/jwtUtil";

export const FAVORITE_KEYS = {
  HOSPITAL: "HOSPITAL",
  PHARMACY: "PHARMACY",
};

// 특정 타입(HOSPITAL, PHARMACY)의 즐겨찾기 목록 가져오기
export const getFavorites = async (type) => {
  try {
    const res = await jwtAxios.get(`/project/favorite/my`, {
      params: { type: String(type).toUpperCase() },
    });
    const data = res.data;
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.data)) return data.data;
    console.warn("getFavorites: 예상치 못한 응답 형태", data);
    return [];
  } catch (err) {
    console.error("getFavorites 실패:", err);
    return [];
  }
};

// 즐겨찾기 여부 확인
export const isFavorite = async (_type, facilityId) => {
  try {
    const res = await jwtAxios.get(`/project/favorite/check/${facilityId}`);
    return !!res.data;
  } catch (err) {
    console.error("isFavorite 실패:", err);
    return false;
  }
};

// 즐겨찾기 토글 (등록/삭제)
export const toggleFavorite = async (type, facilityId) => {
  try {
    const fav = await isFavorite(type, facilityId);
    if (fav) {
      await jwtAxios.delete(`/project/favorite/${facilityId}`);
      return false;
    } else {
      await jwtAxios.post(`/project/favorite/${facilityId}`);
      return true;
    }
  } catch (err) {
    console.error("toggleFavorite 실패:", err);
    return false;
  }
};

// 즐겨찾기 해제 전용
export const removeFavorite = async (_type, facilityId) => {
  try {
    await jwtAxios.delete(`/project/favorite/${facilityId}`);
  } catch (err) {
    console.error("removeFavorite 실패:", err);
  }
};
