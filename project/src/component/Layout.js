import React from 'react'
import Navigation from './Navigation'
import Myfooter from './Myfooter'
import { Outlet } from 'react-router-dom'

const Layout = () => {
  return (
    <>
        <Navigation />
        <Outlet />
        <Myfooter />
    </>
  )
}

export default Layout