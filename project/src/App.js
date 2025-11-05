import './App.css';
import { Routes, Route, Outlet } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import Navigation from './layout/Navigation';
import Myfooter from './layout/Myfooter';
import HospitalMain from './page/facility/HospitalMain';
import PharmacyMain from './page/facility/PharmacyMain';
import HospitalDetail from './page/facility/HospitalDetail';
import PharmacyDetail from './page/facility/PharmacyDetail';
import MyPage from './page/mypage/MyPage';
import LoginMain from './page/JUser/LoginMain';
import Register from './page/JUser/Register';
import FindUser from './page/JUser/FindUser';
import FindUserPW from './page/JUser/FindUserPW';
import Noticeboard from './page/board/Noticeboard';
import BoardDetail from './page/board/BoardDetail';
import BoardCreat from './page/board/BoardCreat';
import Notice from './page/customSupport/Notice';
import NoticeDetail from './page/customSupport/NoticeDetail';
import Faq from './page/customSupport/Faq';
import DataRoom from './page/customSupport/DataRoom';
import DataRoomDetail from './page/customSupport/DataRoomDetail';
import KakaoLoginPage from './page/JUser/KakaoLoginPage';
import SupportCreate from './page/customSupport/SupportCreate';

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
        <Route path="hospitaldetail/:id" element={<HospitalDetail />} />
        <Route path="pharmacydetail/:id" element={<PharmacyDetail />} />

        {/* 유저/인증 */}
        <Route path="mypage" element={<MyPage />} />
        <Route path="login" element={<LoginMain />} />
        <Route path="register" element={<Register />} />
        <Route path="finduser" element={<FindUser />} />
        <Route path='finduserpw' element={<FindUserPW />} />

        {/* 게시판 */}
        <Route path="noticeboards" element={<Noticeboard />} />
        <Route path="boarddetails/:id" element={<BoardDetail />} />
        <Route path="boardCreats" element={<BoardCreat />} />

        {/* 고객지원 */}
        <Route path="notice" element={<Notice />} />
        <Route path="noticedetail/:id" element={<NoticeDetail />} />
        <Route path="faq" element={<Faq />} />
        <Route path="dataroom" element={<DataRoom />} />
        <Route path="dataroomdetail/:id" element={<DataRoomDetail />} />
        <Route path="supportCreate" element={<SupportCreate />} />

        {/*카카오 로그인 */}
        <Route path='user/'>
          <Route path="kakao" element={<KakaoLoginPage />} />
        </Route>
      </Route>
    </Routes>
  );
}