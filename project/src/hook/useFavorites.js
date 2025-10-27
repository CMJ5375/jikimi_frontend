// useFavorites.js
import { useEffect, useState } from "react"
import { getFavorites, toggleFavorite, isFavorite } from "../api/favoriteApi"
import useCustomLogin from "./useCustomLogin"

// 병원/약국 공통 즐겨찾기 로직을 커스텀 훅으로 관리
export default function useFavorites(type) {
  const [favorites, setFavorites] = useState([]);
  const { isLogin } = useCustomLogin()

  // 로그인 시 즐겨찾기 목록 불러오기
  useEffect(() => {
    const loadFavorites = async () => {
      if (!isLogin) {
        setFavorites([])
        return
      }
      try {
        const list = await getFavorites(type)
        setFavorites(list.map(String))
      } catch (err) {
        console.error("즐겨찾기 불러오기 실패:", err)
      }
    }
    loadFavorites()
  }, [type, isLogin])

  // 즐겨찾기 토글 (클릭 시)
  const toggle = async (id) => {
    if (!isLogin) return false
    try {
      const newState = await toggleFavorite(type, id)
      const updatedList = await getFavorites(type)
      setFavorites(updatedList.map(String))
      return newState
    } catch (err) {
      console.error("즐겨찾기 토글 실패:", err)
      return false
    }
  }

  // 특정 항목이 즐겨찾기인지 확인
  const check = async (id) => {
    if (!isLogin) return false
    try {
      return await isFavorite(type, id)
    } catch {
      return favorites.includes(String(id))
    }
  }

  return { favorites, toggle, check, isLogin }
}
