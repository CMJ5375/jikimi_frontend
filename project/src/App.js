import './App.css';
import { Routes, Route, Outlet } from 'react-router-dom';
import { Container } from 'react-bootstrap';

import Navigation from './component/Navigation';
import Myfooter from './component/Myfooter';

import Main from './component/Main';
import HospitalMain from './component/HospitalMain';   
import PharmacyMain from './component/PharmacyMain';   

import HospitalDetail from './component/HospitalDetail';
import PharmacyDetail from './component/PharmacyDetail';
import MyPage from './component/MyPage';
import LoginMain from './component/LoginMain';
import Register from './component/Register';
import FindUser from './component/FindUser';
import Noticeboard from './component/Noticeboard';
import BoardDetail from './component/BoardDetail';
import BoardCreat from './component/BoardCreat';       

function Layout() {
  return (
    <>
      <Navigation />
      <Container style={{ maxWidth: '1024px' }}>
        <Outlet />
      </Container>
      <Myfooter />
    </>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        {/* 메인 */}
        <Route index element={<HospitalMain />} />
        <Route path="pharmacy" element={<PharmacyMain />} />

        {/* 디테일 */}
        <Route path="hospitaldetail" element={<HospitalDetail />} />
        <Route path="pharmacydetail" element={<PharmacyDetail />} />

        {/* 유저/인증 */}
        <Route path="mypage" element={<MyPage />} />
        <Route path="login" element={<LoginMain />} />
        <Route path="register" element={<Register />} />
        <Route path="finduser" element={<FindUser />} />

        {/* 게시판 */}
        <Route path="noticeboards" element={<Noticeboard />} />
        <Route path="boarddetails" element={<BoardDetail />} />
        <Route path="boardCreats" element={<BoardCreat />} />
      </Route>
    </Routes>
  );
}
