<<<<<<< HEAD
import './App.css';
import Main from './component/Main'
import Detail from './component/Detail';
import Myfooter from './component/Myfooter';
import Navigation from './component/Navigation';
=======
import './App.css'
import { Routes, Route,Outlet } from 'react-router-dom'
import Main from './component/Main'
import Myfooter from './component/Myfooter'
import Navigation from './component/Navigation'
>>>>>>> 140e36d4758e7a2ab1ce03faa6bc1825d2665e31

function Layout() {
  return (
    <>
<<<<<<< HEAD
    <Navigation/>
    {/* <Main /> */}
    <Detail />
    <Myfooter />
=======
      <Navigation />
      <Outlet /> 
      <Myfooter />
>>>>>>> 140e36d4758e7a2ab1ce03faa6bc1825d2665e31
    </>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Main />} />
      </Route>
    </Routes>
  )
}
