import './App.css'
import { Routes, Route,Outlet} from 'react-router-dom'
import Main from './component/Main'
import MyPage from './component/MyPage'
import Myfooter from './component/Myfooter'
import Navigation from './component/Navigation'
import LoginMain from './component/LoginMain'
import Register from './component/Register'
import FindUser from './component/FindUser'
import HospitalDetail from './component/HospitalDetail'
import PharmacyDetail from './component/PharmacyDetail'
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
        <Route path='finduser' element={<FindUser/>}/>
        <Route path="hospitaldetail" element={<HospitalDetail />} />
        <Route path="pharmacydetail" element={<PharmacyDetail />} />
        <Route path='noticeboards' element={<Noticeboard/>}/>
      </Route>
    </Routes>
  )
}
