import './App.css'
import { Routes, Route,Outlet} from 'react-router-dom'
import Main from './component/Main'
import MyPage from './component/MyPage'
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

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Main />} />
        <Route path='mypage' element={<MyPage />} />
        <Route path="login" element={<LoginMain />} />
        <Route path="register" element={<Register/>} />
      </Route>
    </Routes>
  )
}
