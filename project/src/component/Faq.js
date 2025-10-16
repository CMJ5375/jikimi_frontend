import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./Noticeboard.css";
import { Pencil, Search } from "react-bootstrap-icons";
import { useLocation, useNavigate } from "react-router-dom";
import { Accordion, Button } from 'react-bootstrap';

const isAdmin = true; // 관리자 여부 (false로 바꾸면 버튼 숨김)

const CATEGORIES = [
  { name: "공지사항", path: "/notice" },
  { name: "FAQ", path: "/faq" },
  { name: "자료실", path: "/dataroom" },
];

const Faq = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // 현재 경로에 따라 초기 탭 자동 설정
  const initialTab =
    location.pathname.includes("notice")
      ? "공지사항"
      : location.pathname.includes("faq")
      ? "FAQ"
      : location.pathname.includes("dataroom")
      ? "자료실"
      : "FAQ";

  const [active, setActive] = useState(initialTab);
  const [q, setQ] = useState("");

  return (
    <div className="bg-white">
      {/* 상단 공지 바 */}
      <div className="bg-primary text-white mb-4 px-3 py-2 text-center d-none d-md-block">
        <span className="me-2">공지사항 ·</span> 공지사항 입니다.
      </div>
      
      {/* ========== PC / 태블릿 이상 ========== */}
      <div className="container py-4 d-none d-md-block">
        {/* 타이틀 & 검색/작성 */}
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h4 className="fw-bold mb-0">FAQ</h4>
          <div className="d-flex align-items-center gap-2">
            <div className="position-relative">
            <input
                type="text"
                className="form-control rounded-pill ps-4 pe-5 board-search"
                placeholder="검색어를 입력해주세요.."
                value={q}
                onChange={(e) => setQ(e.target.value)}
            />
            {/* <Search className="osition-absolute top-50 end-0 translate-middle-y me-3 text-secondary"/> */}
            </div>
            {isAdmin && (
              <Button variant="primary rounded-pill px-3">
                게시글 작성 <Pencil className="ms-1" />
              </Button>
            )}
          </div>
        </div>

          {/* 카테고리 탭 */}
          <div className="mbp-tabs border-bottom">
            {CATEGORIES.map((c) => (
                <div
                  key={c.name}
                  className={`mbp-tabbtn ${active === c.name ? "active" : ""}`}
                  onClick={() => {setActive(c.name); navigate(c.path);}}
                >
                  {c.name}
                </div>
            ))}
          </div>

          {/* 리스트 */}
          <div className="list-group board-list">
            <Accordion defaultActiveKey="0" className="mt-3">
              <Accordion.Item eventKey="0">
                <Accordion.Header>병원 상세 검색 질문에 대해..</Accordion.Header>
                <Accordion.Body>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
                  eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad
                  minim veniam, quis nostrud exercitation ullamco laboris nisi ut
                  aliquip ex ea commodo consequat. Duis aute irure dolor in
                  reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
                  pariatur. Excepteur sint occaecat cupidatat non proident, sunt in
                  culpa qui officia deserunt mollit anim id est laborum.
                </Accordion.Body>
              </Accordion.Item>
              <Accordion.Item eventKey="1">
                <Accordion.Header>회원정보 수정 방법</Accordion.Header>
                <Accordion.Body>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
                  eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad
                  minim veniam, quis nostrud exercitation ullamco laboris nisi ut
                  aliquip ex ea commodo consequat. Duis aute irure dolor in
                  reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
                  pariatur. Excepteur sint occaecat cupidatat non proident, sunt in
                  culpa qui officia deserunt mollit anim id est laborum.
                </Accordion.Body>
              </Accordion.Item>
              <Accordion.Item eventKey="2">
                <Accordion.Header>회원정보 수정 방법</Accordion.Header>
                <Accordion.Body>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
                  eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad
                  minim veniam, quis nostrud exercitation ullamco laboris nisi ut
                  aliquip ex ea commodo consequat. Duis aute irure dolor in
                  reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
                  pariatur. Excepteur sint occaecat cupidatat non proident, sunt in
                  culpa qui officia deserunt mollit anim id est laborum.
                </Accordion.Body>
              </Accordion.Item>
              <Accordion.Item eventKey="3">
                <Accordion.Header>회원정보 수정 방법</Accordion.Header>
                <Accordion.Body>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
                  eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad
                  minim veniam, quis nostrud exercitation ullamco laboris nisi ut
                  aliquip ex ea commodo consequat. Duis aute irure dolor in
                  reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
                  pariatur. Excepteur sint occaecat cupidatat non proident, sunt in
                  culpa qui officia deserunt mollit anim id est laborum.
                </Accordion.Body>
              </Accordion.Item>
              <Accordion.Item eventKey="4">
                <Accordion.Header>회원정보 수정 방법</Accordion.Header>
                <Accordion.Body>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
                  eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad
                  minim veniam, quis nostrud exercitation ullamco laboris nisi ut
                  aliquip ex ea commodo consequat. Duis aute irure dolor in
                  reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
                  pariatur. Excepteur sint occaecat cupidatat non proident, sunt in
                  culpa qui officia deserunt mollit anim id est laborum.
                </Accordion.Body>
              </Accordion.Item>
            </Accordion>
          </div>

          {/* 페이지네이션 (모양만) */}
          <nav className="mt-4">
              <ul className="pagination justify-content-center">
                  <li className="page-item disabled"><span className="page-link">&laquo;</span></li>
                  <li className="page-item active"><span className="page-link">1</span></li>
                  <li className="page-item"><a className="page-link" href="#!">2</a></li>
                  <li className="page-item"><a className="page-link" href="#!">3</a></li>
                  <li className="page-item"><a className="page-link" href="#!">&raquo;</a></li>
              </ul>
          </nav>
      </div>

      {/* ========== 모바일 ========== */}
      <div className="d-block d-md-none">
        <div className="mbp-wrap">
          {/* 헤더 */}
          <div className="d-flex align-items-center justify-content-between px-3 pt-3 pb-2">
              <div className="mbp-title">FAQ</div>
              <div className="d-flex align-items-center gap-3">
                  <Search />
                  {isAdmin && (<Pencil />)}
              </div>
          </div>

          {/* 카테고리 탭 */}
          <div className="mbp-tabs border-bottom">
            {CATEGORIES.map((c) => (
              <div
                key={c.name}
                className={`mbp-tabbtn px-3 ${active === c.name ? "active" : ""}`}
                onClick={() => {setActive(c.name); navigate(c.path);}}
              >
                {c.name}
              </div>
            ))}
          </div>

          {/* 카드 리스트 */}
            <Accordion defaultActiveKey="0" className="mt-3">
              <Accordion.Item eventKey="0">
                <Accordion.Header>병원 상세 검색 질문에 대해..</Accordion.Header>
                <Accordion.Body>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
                  eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad
                  minim veniam, quis nostrud exercitation ullamco laboris nisi ut
                  aliquip ex ea commodo consequat. Duis aute irure dolor in
                  reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
                  pariatur. Excepteur sint occaecat cupidatat non proident, sunt in
                  culpa qui officia deserunt mollit anim id est laborum.
                </Accordion.Body>
              </Accordion.Item>
              <Accordion.Item eventKey="1">
                <Accordion.Header>회원정보 수정 방법</Accordion.Header>
                <Accordion.Body>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
                  eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad
                  minim veniam, quis nostrud exercitation ullamco laboris nisi ut
                  aliquip ex ea commodo consequat. Duis aute irure dolor in
                  reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
                  pariatur. Excepteur sint occaecat cupidatat non proident, sunt in
                  culpa qui officia deserunt mollit anim id est laborum.
                </Accordion.Body>
              </Accordion.Item>
              <Accordion.Item eventKey="2">
                <Accordion.Header>회원정보 수정 방법</Accordion.Header>
                <Accordion.Body>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
                  eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad
                  minim veniam, quis nostrud exercitation ullamco laboris nisi ut
                  aliquip ex ea commodo consequat. Duis aute irure dolor in
                  reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
                  pariatur. Excepteur sint occaecat cupidatat non proident, sunt in
                  culpa qui officia deserunt mollit anim id est laborum.
                </Accordion.Body>
              </Accordion.Item>
              <Accordion.Item eventKey="3">
                <Accordion.Header>회원정보 수정 방법</Accordion.Header>
                <Accordion.Body>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
                  eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad
                  minim veniam, quis nostrud exercitation ullamco laboris nisi ut
                  aliquip ex ea commodo consequat. Duis aute irure dolor in
                  reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
                  pariatur. Excepteur sint occaecat cupidatat non proident, sunt in
                  culpa qui officia deserunt mollit anim id est laborum.
                </Accordion.Body>
              </Accordion.Item>
              <Accordion.Item eventKey="4">
                <Accordion.Header>회원정보 수정 방법</Accordion.Header>
                <Accordion.Body>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
                  eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad
                  minim veniam, quis nostrud exercitation ullamco laboris nisi ut
                  aliquip ex ea commodo consequat. Duis aute irure dolor in
                  reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
                  pariatur. Excepteur sint occaecat cupidatat non proident, sunt in
                  culpa qui officia deserunt mollit anim id est laborum.
                </Accordion.Body>
              </Accordion.Item>
            </Accordion>
          </div>
      </div>
    </div>
  );
}

export default Faq