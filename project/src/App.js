import './App.css'
import { Routes, Route} from 'react-router-dom'
import Main from './component/Main'
<<<<<<< HEAD
import LoginMain from './component/LoginMain'
import Layout from './component/Layout'
import MyPage from './component/MyPage'
=======
import Myfooter from './component/Myfooter'
import Navigation from './component/Navigation'
import LoginMain from './component/LoginMain'
import Register from './component/Register'

function Layout() {
  return (
    <>
      <Navigation />
      <Outlet /> 
      <Myfooter />
    </>
  )
}
>>>>>>> project/main

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Main />} />
<<<<<<< HEAD
        <Route path='login' element={<LoginMain />} />
        <Route path='mypage' element={<MyPage />} />
=======
        <Route path="login" element={<LoginMain />} />
        <Route path="register" element={<Register/>} />
>>>>>>> project/main
      </Route>
    </Routes>
  )
}
