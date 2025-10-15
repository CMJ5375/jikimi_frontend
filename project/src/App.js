import './App.css';
import { Routes, Route} from 'react-router-dom';
import { Outlet } from 'react-router-dom';
import Main from './component/Main';
import Navigation from './component/Navigation'
import Myfooter from './component/Myfooter'
import HospitalDetail from './component/HospitalDetail';
import PharmacyDetail from './component/PharmacyDetail';
import MyPage from './component/MyPage'
import LoginMain from './component/LoginMain'
import Register from './component/Register'
import FindUser from './component/FindUser'
import Noticeboard from './component/Noticeboard'
import Navigation from './component/Navigation';
import Myfooter from './component/Myfooter';
import BoardDetail from './component/BoardDetail';
import BoardCreat from './component/BoardCreat';
import { Container } from 'react-bootstrap';
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
        <Route index element={<HospitalMain />} />
        <Route path="pharmacy" element={<PharmacyMain />} />
        <Route path="hospitaldetail" element={<HospitalDetail />} />
        <Route path="pharmacydetail" element={<PharmacyDetail />} />
        <Route path='mypage' element={<MyPage />} />
        <Route path="login" element={<LoginMain />} />
        <Route path="register" element={<Register/>} />
        <Route path='finduser' element={<FindUser/>}/>
        <Route path="pharmacydetail" element={<PharmacyDetail />} />
        <Route path="hospitaldetail" element={<HospitalDetail />} />
        <Route path='noticeboards' element={<Noticeboard/>}/>
        <Route path='boarddetails' element={<BoardDetail/>}/>
        <Route path='boardCreats' element={<BoardCreat/>}/>
      </Route>
    </Routes>
  )
}
