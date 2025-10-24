// favoriteApi.js

// 즐겨찾기 상태를 localStorage에 저장/불러오기 위한 유틸리티 모듈
export const FAVORITE_KEYS = {
  HOSPITAL: "favorite_hospital_",
  PHARMACY: "favorite_pharmacy_",
};

// 특정 타입(HOSPITAL, PHARMACY)의 즐겨찾기 목록 가져오기
export const getFavorites = (type) => {
  const prefix = FAVORITE_KEYS[type];
  return Object.keys(localStorage)
    .filter(k => k.startsWith(prefix) && localStorage.getItem(k) === "true")
    .map(k => k.replace(prefix, ""));
};

// 즐겨찾기 상태 토글
export const toggleFavorite = (type, id) => {
  const key = FAVORITE_KEYS[type] + id;
  const newState = localStorage.getItem(key) !== "true";
  localStorage.setItem(key, newState);
  return newState;
};

// 즐겨찾기 여부 확인
export const isFavorite = (type, id) => {
  return localStorage.getItem(FAVORITE_KEYS[type] + id) === "true";
};

// 즐겨찾기 해제 전용 함수
export const removeFavorite = (type, id) => {
  const key = FAVORITE_KEYS[type] + id;
  if (localStorage.getItem(key)) {
    localStorage.removeItem(key);
  }
};
