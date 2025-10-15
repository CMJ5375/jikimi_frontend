import './App.css';
import { Routes, Route ,Outlet } from 'react-router-dom';
import Main from './component/Main';
import HospitalDetail from './component/HospitalDetail';
import PharmacyDetail from './component/PharmacyDetail';
import MyPage from './component/MyPage'
import LoginMain from './component/LoginMain'
import Register from './component/Register'
import FindUser from './component/FindUser'
import Noticeboard from './component/Noticeboard'
import Navigation from './component/Navigation';
import Myfooter from './component/Myfooter';
import FindUserPW from './component/FindUserPW';
import { Container } from 'react-bootstrap';
function Layout() {
 
  return (
    <>
      <Navigation />
      <Container style={{ maxWidth: '1024px' }}>
        <Outlet />
      </Container>
      <Myfooter />
    </>
  )
}

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Main />} />
          <Route path='mypage' element={<MyPage />} />
          <Route path="login" element={<LoginMain />} />
          <Route path="register" element={<Register/>} />
          <Route path='finduser' element={<FindUser/>}/>
          <Route path="pharmacydetail" element={<PharmacyDetail />} />
          <Route path="hospitaldetail" element={<HospitalDetail />} />
          <Route path='noticeboard' element={<Noticeboard/>}/>
          <Route path="finduserpw" element={<FindUserPW/>}/>
        </Route>
      </Routes>
    </>
  )
}
