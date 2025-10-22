import React, { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getAccessToken, getUserWithAccessToken } from '../../api/kakaoApi'
import { useDispatch } from 'react-redux'
import { login } from '../../slices/loginSlice'
import useCustomLogin from '../../hook/useCustomLogin'

const KakaoLoginPage = () => {
  const [searchParams] = useSearchParams()
  const authCode = searchParams.get("code")
  const dispatch = useDispatch()
  const {moveToPath} = useCustomLogin()
  useEffect(() => {
      getAccessToken(authCode).then(accessToken => {
        console.log(accessToken)

        getUserWithAccessToken(accessToken).then(userInfo => {
          console.log("userInfo : {}", userInfo)
          dispatch(login(userInfo))
          moveToPath('/')
        })
      })
  }, [authCode])
  return (
    <>
      <div>KakaoLoginPage</div>
      <div>{authCode}</div>
    </>
  )
}

export default KakaoLoginPage