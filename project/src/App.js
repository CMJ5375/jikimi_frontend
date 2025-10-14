import './App.css';
import { Routes, Route, Outlet } from 'react-router-dom';
import Main from './component/Main';
import HospitalDetail from './component/HospitalDetail';
import PharmacyDetail from './component/PharmacyDetail';
import Layout from './component/Layout';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Main />} />
        <Route path="/hospitaldetails" element={<HospitalDetail />} />
        <Route path="/pharmacydetails" element={<PharmacyDetail />} />
      </Route>
    </Routes>
  )
}
