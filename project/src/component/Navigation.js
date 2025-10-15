import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { GeoAltFill } from "react-bootstrap-icons";
import { Nav } from 'react-bootstrap'
import { useLocation,Link } from "react-router-dom";
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import NavDropdown from 'react-bootstrap/NavDropdown';


export default function HeaderResponsive() {
  const location = useLocation();

  // 안내바를 숨기고 싶은 경로들
  const hideBannerPaths = [""]; //경로 넣기

  const shouldShowBanner = !hideBannerPaths.includes(location.pathname);
  return (
    <header className="border-bottom">
      <div>
        {/* ================= PC / 태블릿 이상 ================= */}
        <div className="d-none d-md-block">
          {/* 상단 정보바 */}
          <div className="container-fluid"  style={{background:"#e9ecef"}}>
            <div className="d-flex justify-content-between align-items-center py-2 container" >
              <div className="d-flex align-items-center gap-2 text-secondary " >
                <GeoAltFill size={18} />
                <span>경기도 성남시 중원구 성남동</span>
              </div>
              <div className="d-flex align-items-center gap-3">
                <a href="register" className="link-secondary text-decoration-none">회원가입</a>
                <a href="login"  className="link-secondary text-decoration-none">로그인</a>
              </div>
            </div>
          </div>

          {/* 메인 네비게이션 */}
          <nav className="navbar navbar-expand-md bg-white py-3 container" >
            {/* 로고 */}
            <a className="navbar-brand d-flex align-items-center" href="/">
              <img src='/image/logo.png' alt='로고' width={140}></img>
            </a>

            {/* 세로 구분선 */}
            <div className="border-start mx-3" style={{height: 28}} />

            {/* 메뉴 */}
            <Nav className="me-auto">
<<<<<<< HEAD
              <Nav.Link href="/noticeboards">게시판</Nav.Link>
=======
              <Nav.Link href="/noticeboard">게시판</Nav.Link>
>>>>>>> 73b30f7b046cff0260138375fdc2ea9ebf187ead
              <Nav.Link href="/mypage">마이페이지</Nav.Link>
               
              <NavDropdown title="고객지원" id="basic-nav-dropdown">
                <NavDropdown.Item href="/">FAQ</NavDropdown.Item>
                <NavDropdown.Item href="/">공지사항</NavDropdown.Item>
                <NavDropdown.Item href="/">자료실</NavDropdown.Item>
              </NavDropdown>
            </Nav>
          </nav>
        </div>

        {/* ================= 모바일 ================= */}
        <div className="d-md-none">
          {/* 상단: 로고 / 로그인 / 전체메뉴 */}
          <div className="py-2 d-flex align-items-center justify-content-between bg-light">
            <a href="/" className="d-inline-flex align-items-center text-decoration-none">
              <img src='/image/logo.png' alt='로고' width={140}></img>
            </a>

            <div className="d-flex align-items-start">
              <a href="login" className="text-dark text-decoration-none d-flex flex-column align-items-center me-4">
                <i className="bi bi-person fs-1"></i>
                <small className="mt-1">로그인</small>
              </a>

              <button
                className="btn btn-link text-dark text-decoration-none d-flex flex-column align-items-center p-0"
                type="button"
                data-bs-toggle="offcanvas"
                data-bs-target="#mobileOffcanvas"
              >
                <i className="bi bi-list fs-1"></i>
                <small className="mt-1">전체메뉴</small>
              </button>
            </div>
          </div>

          {/* 파란 안내바 */}
          {shouldShowBanner && (
            <div className="bg-primary text-white">
              <div className="py-2 text-center">
                주말 공휴일에도 걱정없이, 지금 열려있는 병원/약국 안내
              </div>
            </div>
          )}
        </div>

      </div>

      {/* ========= 오프캔버스 전체메뉴 ========= */}
      <div
        className="offcanvas offcanvas-end"
        tabIndex="-1"
        id="mobileOffcanvas"
        aria-labelledby="mobileOffcanvasLabel"
      >
        {/* 헤더 */}
        <div className="offcanvas-header border-bottom">
          <h5 className="offcanvas-title fw-bold" id="mobileOffcanvasLabel">
            전체메뉴
          </h5>
          <button
            type="button"
            className="btn-close"
            data-bs-dismiss="offcanvas"
            aria-label="Close"
          ></button>
        </div>

        {/* 바디 */}
        <div className="offcanvas-body">
          {/* 위치정보 */}
          <div className="d-flex align-items-center gap-2 text-secondary mb-3">
            <GeoAltFill size={18} />
            <span>경기도 성남시 중원구 성남동</span>
          </div>

          {/* 메뉴 리스트 */}
          <div className="list-group list-group-flush">

            {/* 게시판 */}
            <div className="mt-2 mb-2">
              <Link
                to="/noticeboard"
                className="fw-semibold text-dark text-decoration-none d-block px-0"
              >
               게시판
              </Link>
            </div>

            {/* 마이페이지 */}
            <div className="mt-2 mb-2">
              <Link
                to="/mypage"
                className="fw-semibold text-dark text-decoration-none d-block px-0"
              >
                마이페이지
              </Link>
            </div>


            {/* 고객지원 (아코디언) */}
            <div className="accordion mb-2" id="accordionSupport">
              <div className="accordion-item border-0">
                <h2 className="accordion-header">
                  <button
                    className="accordion-button collapsed fw-semibold px-0 bg-transparent shadow-none"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#collapseSupport"
                    aria-expanded="false"
                    aria-controls="collapseSupport"
                  >
                    고객지원
                  </button>
                </h2>
                <div
                  id="collapseSupport"
                  className="accordion-collapse collapse"
                  data-bs-parent="#accordionSupport"
                >
                  <div className="accordion-body py-2 ps-3">
                    <ul className="list-unstyled mb-0">
                      <li className="py-1">
                        <a href="#faq" className="text-secondary text-decoration-none">
                          FAQ
                        </a>
                      </li>
                      <li className="py-1">
                        <a href="#notice" className="text-secondary text-decoration-none">
                          공지사항
                        </a>
                      </li>
                      <li className="py-1">
                        <a href="#data" className="text-secondary text-decoration-none">
                          자료실
                        </a>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}