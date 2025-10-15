import './App.css'
import { Routes, Route,Outlet} from 'react-router-dom'
import Main from './component/Main'
import MyPage from './component/MyPage'
import Myfooter from './component/Myfooter'
import Navigation from './component/Navigation'
import LoginMain from './component/LoginMain'
import Register from './component/Register'
import { Container } from 'react-bootstrap'

function Layout() {
  return (
    <>
      <Navigation />
      <Container style={{ maxWidth: '1024px' }}> {/* 본문만 제한 */}
        <Outlet />
      </Container> 
      <Myfooter />
    </>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Main />} />
        <Route path='login' element={<LoginMain />} />
        <Route path='mypage' element={<MyPage />} />
        <Route path='mypage' element={<MyPage />} />
        <Route path="login" element={<LoginMain />} />
        <Route path="register" element={<Register/>} />
      </Route>
    </Routes>
  )
}
