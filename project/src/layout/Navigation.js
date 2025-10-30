import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "../css/layout.css";
import { GeoAltFill, Person, List } from "react-bootstrap-icons";
import { Nav } from "react-bootstrap";
import { useLocation, Link } from "react-router-dom";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import NavDropdown from "react-bootstrap/NavDropdown";
import { useSelector } from "react-redux";
import useCustomLogin from "../hook/useCustomLogin";
import { getDefaultPosition, getAddressFromBackend } from "../api/kakaoMapApi";
import { getCurrentPosition } from "../api/geolocationApi";

const Navigation = () => {
  const loginState = useSelector(state => state.loginSlice)
  const {doLogout, moveToPath} = useCustomLogin()
  const [currentAddress, setCurrentAddress] = useState("현재 위치 확인 중...")
  const location = useLocation()

  const handleClickLogout = () => {
    doLogout()
    alert("로그아웃 되었습니다.")
    moveToPath("/")
  }

  // 현재 위치 불러오기
  // 만약 기본 위치 불러오고 싶으면 위 import한 getCurrentPosition 삭제 그리고 이 아래에 문구 삽입
  // const pos = await getDefaultPosition();
  useEffect(() => {
    const fetchAddress = async () => {
      try {
        const pos = await getCurrentPosition();
        const address = await getAddressFromBackend(pos.lat, pos.lng);
        setCurrentAddress(address);
      } catch (e) {
        console.error("주소 불러오기 실패:", e);
        setCurrentAddress("(기본)경기도 성남시 중원구 광명로 4");
      }
    };
    fetchAddress();
  }, []);
  
  // 안내바를 숨기고 싶은 경로들
  const hideBannerPaths = [""]; //경로 넣기
  const shouldShowBanner = !hideBannerPaths.includes(location.pathname);

  return (
    <>
    <header className="border-bottom">
      <div>
        {/* ================= PC / 태블릿 이상 ================= */}
        <div className="d-none d-md-block">
          {/* 상단 정보바 */}
          <div className="container-fluid"  style={{background:"#e9ecef"}}>
            <div className="d-flex justify-content-between align-items-center py-2 container" >
              <div className="d-flex align-items-center gap-2 text-secondary " >
                <GeoAltFill size={18} />
                <span>{currentAddress}</span>
              </div>
              {!loginState.username ? 
                <div className="d-flex align-items-center gap-3">
                  <a href="register" className="link-secondary text-decoration-none">회원가입</a>
                  <a href="login"  className="link-secondary text-decoration-none">로그인</a>
                </div>
                :
                  <a href="/" className="link-secondary text-decoration-none" onClick={handleClickLogout}>
                    로그아웃
                  </a>
              }
            </div>
          </div>

          {/* 메인 네비게이션 */}
          <nav className="navbar navbar-expand-md bg-white py-3 container" >
            {/* 로고 */}
            <a className="navbar-brand d-flex align-items-center ms-2" href="/">
              <img src="/image/logo.png" alt="로고" width={150} />
            </a>

            {/* 세로 구분선 */}
            <div className="border-start mx-3" style={{height: 28}} />

            {/* 메뉴 */}
            <Nav className="me-auto">
              <Nav.Link href="/noticeboards">게시판</Nav.Link>
              <Nav.Link href="/mypage">마이페이지</Nav.Link>
              <NavDropdown title={<span>고객지원</span>} id="basic-nav-dropdown">
                <NavDropdown.Item href="/notice">공지사항</NavDropdown.Item>
                <NavDropdown.Item href="/faq">FAQ</NavDropdown.Item>
                <NavDropdown.Item href="/dataroom">자료실</NavDropdown.Item>
              </NavDropdown>
            </Nav>
          </nav>
        </div>

        {/* ================= 모바일 ================= */}
        <div className="d-md-none">
          {/* 상단: 로고 / 로그인 / 전체메뉴 */}
          <div className="py-2 d-flex align-items-center justify-content-between bg-light">
            <a href="/" className="d-inline-flex align-items-center text-decoration-none ms-3">
              <img src='/image/logo.png' alt='로고' width={150}></img>
            </a>

            <div className="nav-mobile-group">
              {!loginState.username ? (
                <a href="login" className="nav-mobile-icon me-3">
                  <Person />
                  <small>로그인</small>
                </a>
              ) : (
                <a
                  href="/"
                  className="nav-mobile-icon me-3"
                  onClick={handleClickLogout}
                >
                  <Person />
                  <small>로그아웃</small>
                </a>
              )}

              <button
                className="btn btn-link nav-mobile-icon p-0"
                type="button"
                data-bs-toggle="offcanvas"
                data-bs-target="#mobileOffcanvas"
              >
                <List />
                <small>전체메뉴</small>
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
            <span>{currentAddress}</span>
          </div>

          {/* 메뉴 리스트 */}
          <div className="list-group list-group-flush">
            {/* 게시판 */}
            <div className="mt-2 mb-2">
              <Link
                to="/noticeboards"
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
                        <a href="/notice" className="text-secondary text-decoration-none">
                          공지사항
                        </a>
                      </li>
                      <li className="py-1">
                        <a href="/faq" className="text-secondary text-decoration-none">
                          FAQ
                        </a>
                      </li>
                      <li className="py-1">
                        <a href="/dataroom" className="text-secondary text-decoration-none">
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
    </>
  );
}

export default Navigation