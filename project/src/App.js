import './App.css'
import { Routes, Route,Outlet } from 'react-router-dom'
import Main from './component/Main'
import Myfooter from './component/Myfooter'
import Navigation from './component/Navigation'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Main />} />
      </Route>
    </Routes>
  )
}
