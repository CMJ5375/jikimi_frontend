// useFavorites.js
import { useEffect, useState } from "react";
import { getFavorites, toggleFavorite, isFavorite } from "../api/favoriteApi";

// 병원/약국 공통 즐겨찾기 로직을 커스텀 훅으로 관리
export default function useFavorites(type) {
  const [favorites, setFavorites] = useState([]);

  // 초기 로딩 시 즐겨찾기 목록 불러오기
  useEffect(() => {
    setFavorites(getFavorites(type));
  }, [type]);

  // 즐겨찾기 토글 (클릭 시)
  const toggle = (id) => {
    const newState = toggleFavorite(type, id);
    // 상태 즉시 갱신
    setFavorites(getFavorites(type));
    return newState;
  };

  // 특정 항목이 즐겨찾기인지 확인
  const check = (id) => isFavorite(type, id);

  return { favorites, toggle, check };
}
