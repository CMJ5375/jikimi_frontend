import './App.css';
import { Routes, Route} from 'react-router-dom';
import Main from './component/Main';
import HospitalDetail from './component/HospitalDetail';
import PharmacyDetail from './component/PharmacyDetail';
import './App.css'
import MyPage from './component/MyPage'
import LoginMain from './component/LoginMain'
import Register from './component/Register'
import Navigation from './component/Navigation'
import { Outlet } from 'react-router-dom';
import Myfooter from './component/Myfooter'

function Layout() {
  //깃 연동을 위한 임시 주석
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
        <Route path="hospitaldetails" element={<HospitalDetail />} />
        <Route path="pharmacydetails" element={<PharmacyDetail />} />
        <Route path='mypage' element={<MyPage />} />
        <Route path="login" element={<LoginMain />} />
        <Route path="register" element={<Register/>} />
        <Route path="hospitaldetails" element={<HospitalDetail />} />
        <Route path="pharmacydetails" element={<PharmacyDetail />} />
      </Route>
    </Routes>
  )
}
