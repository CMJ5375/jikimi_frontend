import './App.css';
import { Routes, Route} from 'react-router-dom';
import Main from './component/Main';
import HospitalDetail from './component/HospitalDetail';
import PharmacyDetail from './component/PharmacyDetail';
import MyPage from './component/MyPage'
import LoginMain from './component/LoginMain'
import Register from './component/Register'
import FindUser from './component/FindUser'
import Noticeboard from './component/Noticeboard'
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
<<<<<<< HEAD
        <Route path="hospitaldetails" element={<HospitalDetail />} />
        <Route path="pharmacydetails" element={<PharmacyDetail />} />
        <Route path='noticeboards' element={<Noticeboard/>}/>
        <Route path='hospitalDetails' element={<HospitalDetail/>}/>
=======
        <Route path='finduser' element={<FindUser/>}/>
        <Route path="pharmacydetail" element={<PharmacyDetail />} />
        <Route path="hospitaldetail" element={<HospitalDetail />} />
        <Route path='noticeboards' element={<Noticeboard/>}/>
>>>>>>> eede293674d3ab37b6484ad53894b998d1454def
      </Route>
    </Routes>
  )
}
