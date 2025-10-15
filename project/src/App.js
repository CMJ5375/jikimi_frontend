import './App.css';
import { Routes, Route ,Outlet } from 'react-router-dom';
import Main from './component/Main';
import HospitalDetail from './component/HospitalDetail';
import PharmacyDetail from './component/PharmacyDetail';
import MyPage from './component/MyPage'
import LoginMain from './component/LoginMain'
import Register from './component/Register'
<<<<<<< HEAD
import FindUser from './component/FindUser'
import Noticeboard from './component/Noticeboard'
import Navigation from './component/Navigation';
import Myfooter from './component/Myfooter';
import BoardDetail from './component/BoardDetail';
import BoardCreat from './component/BoardCreat';
=======
import { Container } from 'react-bootstrap'


import FindUserPW from './component/FindUserPW';
>>>>>>> 73b30f7b046cff0260138375fdc2ea9ebf187ead
import { Container } from 'react-bootstrap';
function Layout() {
 
  return (
    <>
      <Navigation />
<<<<<<< HEAD
        <Container style={{ maxWidth: '1024px' }}> {/* 본문만 제한 */}
          <Outlet />
        </Container>
=======
      <Container style={{ maxWidth: '1024px' }}> {/* 본문만 제한 */}
        <Outlet />
      </Container> 
>>>>>>> 73b30f7b046cff0260138375fdc2ea9ebf187ead
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
        <Route path='finduser' element={<FindUser/>}/>
        <Route path="pharmacydetail" element={<PharmacyDetail />} />
        <Route path="hospitaldetail" element={<HospitalDetail />} />
<<<<<<< HEAD
        <Route path='noticeboards' element={<Noticeboard/>}/>
        <Route path='boarddetails' element={<BoardDetail/>}/>
        <Route path='boardCreats' element={<BoardCreat/>}/>
=======
        <Route path='noticeboard' element={<Noticeboard/>}/>
>>>>>>> 73b30f7b046cff0260138375fdc2ea9ebf187ead
      </Route>
    </Routes>
  )
}
