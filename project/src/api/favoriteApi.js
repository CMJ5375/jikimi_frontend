// src/api/favoriteApi.js
import jwtAxios from "../util/jwtUtil";

export const FAVORITE_KEYS = {
  HOSPITAL: "HOSPITAL",
  PHARMACY: "PHARMACY",
};

// 내 즐겨찾기 ID 목록 (병원은 hospitalId, 약국은 pharmacyId 반환)
export const getFavorites = async (type) => {
  try {
    const t = String(type).toUpperCase();
    const res = await jwtAxios.get(`/project/favorite/my`, {
      params: { type: t },
    });
    return Array.isArray(res.data) ? res.data.map(String) : [];
  } catch (err) {
    console.error("getFavorites 실패:", err);
    return [];
  }
};

// 즐겨찾기 여부 확인 (type + targetId)
export const isFavorite = async (type, targetId) => {
  try {
    const t = String(type).toUpperCase();
    const res = await jwtAxios.get(`/project/favorite/check/${targetId}`, {
      params: { type: t },
    });
    return !!res.data;
  } catch (err) {
    console.error("isFavorite 실패:", err);
    return false;
  }
};

// 즐겨찾기 추가 (type + targetId)
export const addFavorite = async (type, targetId) => {
  try {
    const t = String(type).toUpperCase();
    await jwtAxios.post(`/project/favorite/add/${targetId}`, null, {
      params: { type: t },
    });
  } catch (err) {
    console.error("addFavorite 실패:", err);
    throw err;
  }
};

// 즐겨찾기 삭제 (type + targetId)
export const removeFavorite = async (type, targetId) => {
  try {
    const t = String(type).toUpperCase();
    await jwtAxios.delete(`/project/favorite/remove/${targetId}`, {
      params: { type: t },
    });
  } catch (err) {
    console.error("removeFavorite 실패:", err);
  }
};

// 즐겨찾기 토글 (프론트에서 즉시 별 아이콘만 변경 — DB 반영 후 상태는 새로고침 시 반영)
// MyPage에서는 즉시 삭제되지 않고, 새로고침이나 페이지 이동 시 반영됨
export const toggleFavorite = async (type, targetId) => {
  try {
    const t = String(type).toUpperCase();
    const fav = await isFavorite(t, targetId);

    if (fav) {
      // 이미 즐겨찾기면 삭제
      await jwtAxios.delete(`/project/favorite/remove/${targetId}`, {
        params: { type: t },
      });
      return false;
    } else {
      // 즐겨찾기 등록
      await jwtAxios.post(`/project/favorite/add/${targetId}`, null, {
        params: { type: t },
      });
      return true;
    }
  } catch (err) {
    console.error("toggleFavorite 실패:", err);
    return false;
  }
};
