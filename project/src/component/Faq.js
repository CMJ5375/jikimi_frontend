import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./Noticeboard.css";
import { ChatDots, HandThumbsUp, Pencil, Plus, Search } from "react-bootstrap-icons";
import { useNavigate } from "react-router-dom";
import { Accordion } from 'react-bootstrap';

export default function Faq() {
  const navigate = useNavigate();
  const isAdmin = true; // 관리자 여부 (false로 바꾸면 버튼 숨김)

  const CATEGORIES = [
    { name: "공지사항", path: "/notice" },
    { name: "FAQ", path: "/faq" },
    { name: "자료실", path: "/dataroom" },
  ];

  const POSTS = [
    { id: 1, cat: "인기글", hot: true,  title: "간경화 진단을 받았습니다..", date: "2025-09-22", time: "5일 전", author:"영업부장", region:"경기/성남시", excerpt:"최근 회식이 잦긴 했는데 이렇게 갑자기 간경화 진단을 받을 줄은 몰랐습니다. 영업직에 종사한지 10년이 넘었는데 어떻게 해야 좋을지 모...", likes:25, comments:11 },
    { id: 2, cat: "인기글", hot: true,  title: "좋은 이비인후과를 찾은 것 같습니다.", date: "2025-09-25", time: "3일 전", author:"홍길동", region:"서울/송파", excerpt:"목이 너무 아파서 병원을 찾다가 만족스러운 곳을 발견했어요.", likes:18, comments:5 },
    { id: 3, cat: "질문해요", title: "혹시 성남에 괜찮은 어린이 병원 없을까요?  N", date: "2025-09-27", time: "어제", author:"마케터", region:"경기/성남시", excerpt:"아이 감기가 오래가네요. 소아과 추천 부탁드립니다.", likes:7, comments:9 },
  ];

  const [active, setActive] = useState("전체");
  const [q, setQ] = useState("");

  const filteredBase =
    active === "전체"
      ? POSTS
      : active === "인기글"
      ? POSTS.filter((p) => p.hot)
      : POSTS.filter((p) => p.cat === active);

  const filtered = filteredBase.filter((p) =>
    q ? p.title.toLowerCase().includes(q.toLowerCase()) : true
  );

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
                      <button className="btn btn-primary rounded-pill px-3">
                        게시글 작성 <Pencil className="ms-1" />
                      </button>
                    )}
                </div>
            </div>

            {/* 카테고리 탭 */}
            <ul className="nav nav-tabs board-tabs mb-3">
              {CATEGORIES.map((c) => (
                <li className="nav-item" key={c.name}>
                  <button
                    className={`nav-link ${active === c.name ? "active" : ""}`}
                    onClick={() => {
                      setActive(c.name);
                      navigate(c.path);
                    }}
                  >
                    {c.name}
                  </button>
                </li>
              ))}
            </ul>

            {/* 리스트 */}
            <div className="list-group board-list">
                <Accordion defaultActiveKey="0">
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
                <div className="mbp-title">게시판</div>
                <div className="d-flex align-items-center gap-3">
                    <Search />
                    <Pencil />
                </div>
            </div>

            {/* 카테고리 탭 */}
            <div className="mbp-tabs border-bottom">
              {CATEGORIES.map((c) => (
                <button
                  key={c.name}
                  className={`mbp-tabbtn px-3 ${
                    active === c.name ? "active" : ""}`}
                  onClick={() => {
                    setActive(c.name);
                    navigate(c.path);
                  }}
                >
                  {c.name}
                </button>
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