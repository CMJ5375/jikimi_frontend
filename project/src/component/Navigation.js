import React from 'react'
import { GeoAltFill } from "react-bootstrap-icons";
import { Nav,Navbar } from 'react-bootstrap'
const Navigation = () => {
  return (
    <>
    <Navbar bg="#F3F3F3" expand="lg" className="px-3" style={{ fontSize: "20px" }}>
      <Navbar.Brand href="#" className="d-flex align-items-center gap-1">
        <GeoAltFill color="#000" size={18} /> 
        경기도 성남시 중원구 성남대로2
      </Navbar.Brand>

      <Nav className="ms-auto d-flex align-items-center gap-3">
        <Nav.Link href="#">회원가입</Nav.Link>
        <Nav.Link href="#">로그인</Nav.Link>
      </Nav>
    </Navbar>
    </>
  )
}

export default Navigation