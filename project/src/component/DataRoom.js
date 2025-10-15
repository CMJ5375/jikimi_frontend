import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { ChatDots, HandThumbsUp, Pencil, Plus, Search } from "react-bootstrap-icons";
import { useNavigate } from "react-router-dom";
import "./DataRoom.css";

export default function DataRoom() {
  const navigate = useNavigate();
  const isAdmin = true; // 관리자 여부 (false로 바꾸면 버튼 숨김)

  const CATEGORIES = [
    { name: "공지사항", path: "/notice" },
    { name: "FAQ", path: "/faq" },
    { name: "자료실", path: "/dataroom" },
  ];

  const POSTS = [
    { id: 1, cat: "자료실", hot: true, title: "병원 및 약국 찾기 서비스 사용 방법 N", date: "2025-09-28", time: "1일 전", author: "관리자", excerpt: "각각의 응급센터 위치 및 병원 찾기 이용을...", likes: 13, comments: 578 },
    { id: 2, cat: "자료실", hot: true, title: "일반 및 소셜 회원가입 이용 안내", date: "2025-09-25", time: "3일 전", author: "관리자", excerpt: "우측 상단의 회원가입 버튼을 눌러...", likes: 25, comments: 1949 },
    { id: 3, cat: "자료실", hot: false, title: "2025/1분기 예방접종 안내", date: "2025-09-27", time: "2일 전", author: "관리자", excerpt: "예방접종 일정은 지역에 따라...", likes: 13, comments: 578 },
  ];

  const [active, setActive] = useState("자료실");
  const [q, setQ] = useState("");

  const filtered = POSTS.filter((p) =>
    q ? p.title.toLowerCase().includes(q.toLowerCase()) : true
  );

  return (
    <div className="bg-white">

      {/* ===== 상단 공지바 ===== */}
      <div className="bg-primary text-white mb-4 px-3 py-2 text-center d-none d-md-block">
        <span className="me-2">공지사항 ·</span> 공지사항 입니다.
      </div>

      {/* ===== PC / 태블릿 ===== */}
      <div className="container py-4 d-none d-md-block">

        {/* 상단 타이틀 & 검색 & 작성버튼 */}
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h4 className="fw-bold mb-0">자료실</h4>
          <div className="d-flex align-items-center gap-2">
            <div className="position-relative">
              <input
                type="text"
                className="form-control rounded-pill ps-4 pe-5"
                placeholder="검색어를 입력해주세요..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              <Search className="position-absolute top-50 end-0 translate-middle-y me-3 text-secondary" />
            </div>
            {isAdmin && (
              <button className="btn btn-primary rounded-pill px-3">
                게시글 작성 <Pencil className="ms-1" />
              </button>
            )}
          </div>
        </div>

        {/* 카테고리 탭 */}
        <ul className="nav nav-tabs mb-3">
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

        {/* 게시글 리스트 */}
        <div className="list-group">
          {filtered.map((m) => (
            <div
              key={m.id}
              className={`list-group-item list-group-item-action d-flex align-items-center justify-content-between ${
                m.hot ? "bg-light" : ""
              } board-item-hover`}
              onClick={() => navigate("/boarddetails")}
            >
              <div className="d-flex align-items-center gap-3">
                <span className={`badge rounded-pill px-3 ${m.hot ? "bg-primary text-white" : "bg-secondary text-white"}`}>
                  {m.cat}
                </span>
                <span className="fw-semibold">{m.title}</span>
              </div>
              <span className="text-secondary small">{m.date}</span>
            </div>
          ))}
        </div>

        {/* 페이지네이션 */}
        <nav className="mt-4">
          <ul className="pagination justify-content-center">
            <li className="page-item disabled"><span className="page-link">&laquo;</span></li>
            <li className="page-item active"><span className="page-link">1</span></li>
            <li className="page-item"><a className="page-link" href="#!">2</a></li>
            <li className="page-item"><a className="page-link" href="#!">&raquo;</a></li>
          </ul>
        </nav>
      </div>

      {/* ===== 모바일 ===== */}
      <div className="d-block d-md-none px-3">
        <div className="d-flex align-items-center justify-content-between pt-3 pb-2">
          <h5 className="fw-bold mb-0">자료실</h5>
          <div className="d-flex align-items-center gap-3">
            <Search />
            {isAdmin && <Pencil />}
          </div>
        </div>

        {/* 탭 */}
        <div className="d-flex overflow-auto border-bottom mb-3">
          {CATEGORIES.map((c) => (
            <button
              key={c.name}
              className={`btn btn-sm border-0 bg-transparent px-3 ${
                active === c.name ? "text-primary border-bottom border-primary" : "text-secondary"
              }`}
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
        {filtered.map((p) => (
          <article className="mb-3 p-3 rounded-3 shadow-sm border" key={p.id} onClick={() => navigate("/boarddetails")}>
            <div className="d-flex justify-content-between align-items-start">
              <span className="badge bg-primary text-white">{p.cat}</span>
              <Plus className="text-primary" />
            </div>
            <h6 className="mt-2 fw-semibold">{p.title}</h6>
            <div className="d-flex justify-content-between small text-muted">
              <div>{p.time}</div>
              <div>{p.author}</div>
            </div>
            <p className="text-secondary small mt-2 mb-1">{p.excerpt}</p>
            <div className="d-flex align-items-center gap-3 text-muted small">
              <span><HandThumbsUp className="me-1" />{p.likes}</span>
              <span><ChatDots className="me-1" />{p.comments}</span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
