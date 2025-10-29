// useFavorites.js
import { useEffect, useState } from "react";
import { getFavorites, toggleFavorite } from "../api/favoriteApi";
import useCustomLogin from "./useCustomLogin";

// user_favorite 테이블 구조에 맞게 병원/약국 ID 분리 반영
const useFavorites = (type) => {
  const [favorites, setFavorites] = useState([]);
  const { isLogin } = useCustomLogin();

  // 즐겨찾기 불러오기
  useEffect(() => {
    const fetchFavorites = async () => {
      if (!isLogin) return;
      try {
        const list = await getFavorites(type);
        setFavorites(list.map(String));
      } catch (err) {
        console.error(`${type} 즐겨찾기 불러오기 실패:`, err);
      }
    };
    fetchFavorites();
  }, [isLogin, type]);

  // 즐겨찾기 토글
  const toggle = async (id) => {
    if (!isLogin) return alert("로그인이 필요합니다.");
    try {
      const added = await toggleFavorite(type, id);
      if (added) {
        setFavorites((prev) =>
          prev.includes(String(id)) ? prev : [...prev, String(id)]
        );
      } else {
        setFavorites((prev) => prev.filter((fid) => fid !== String(id)));
      }
    } catch (err) {
      console.error("즐겨찾기 토글 실패:", err);
    }
  };

  return { favorites, toggle, isLogin };
};

export default useFavorites;

