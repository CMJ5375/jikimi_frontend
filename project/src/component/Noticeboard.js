import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./Noticeboard.css";
import { ChatDots, HandThumbsUp, Pencil, Plus, Search } from "react-bootstrap-icons";
import { useNavigate } from "react-router-dom";

export default function BoardPageResponsive() {
  const EDONG = useNavigate();
  const CATEGORIES = ["전체", "인기글", "병원정보", "약국정보", "질문해요", "자유글"];
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
                <h4 className="fw-bold mb-0">게시판</h4>
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
                    <a href="/boardCreats" className="btn btn-primary rounded-pill px-3">
                        게시글 작성 <Pencil className="ms-1"/>
                    </a>
                </div>
            </div>

            {/* 탭 */}
            <div className="mbp-tabs border-bottom mb-3">
                {CATEGORIES.map((c) => (
                    <div key={c} className={`mbp-tabbtn ${active === c ? "active" : ""}`} onClick={() => setActive(c)}>
                        {c}
                    </div>
                ))}
            </div>

            {/* 리스트 */}
            <div className="list-group board-list" onClick={()=> EDONG(`/boarddetails`)}>
                {filtered.map((m) => (
                    <div
                    key={m.id}
                    className={`list-group-item list-group-item-action d-flex align-items-center justify-content-between ${
                        m.hot ? "board-item-hot" : ""
                    }`}
                    >
                    <div className="d-flex align-items-center gap-3">
                        <span className={`badge rounded-pill px-3 ${m.hot ? "bg-primary-soft text-primary" : "bg-secondary-soft text-secondary"}`}>
                        {m.hot ? "인기글" : m.cat}
                        </span>
                        <span className="board-title">{m.title}</span>
                    </div>
                    <span className="text-secondary small">{m.date}</span>
                    </div>
                ))}
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

            {/* 탭(가로 스크롤) */}
            <div className="mbp-tabs border-bottom">
                {CATEGORIES.map((t) => (
                <button
                    key={t}
                    className={`mbp-tabbtn ${active === t ? "active" : ""}`}
                    onClick={() => setActive(t)}
                >
                    {t}
                </button>
                ))}
            </div>

            {/* 카드 리스트 */}
            {filtered.map((p) => (
                <article className="mbp-card" key={p.id}>
                <div className="d-flex justify-content-between align-items-start">
                    <span className="mbp-badge">{p.hot ? "인기글" : p.cat}</span>
                    <div className="mbp-ghostmark">
                    <Plus className="fs-5" />
                    </div>
                </div>

                <h6 className="mbp-title-line">{p.title}</h6>

                <div className="d-flex justify-content-between">
                    <div className="mbp-meta">{p.time}</div>
                    <div className="text-end">
                    <div className="fw-bold">{p.author}</div>
                    <a href="#!" className="mbp-region">{p.region}</a>
                    </div>
                </div>

                <p className="mbp-excerpt">{p.excerpt}</p>

                <div className="mbp-divider"></div>

                <div className="d-flex align-items-center gap-4 text-secondary">
                    <span><HandThumbsUp className="me-1"/>{p.likes}</span>
                    <span><ChatDots className="me-1"/>{p.comments}</span>
                </div>
                </article>
            ))}
            </div>
        </div>
    </div>
  );
}