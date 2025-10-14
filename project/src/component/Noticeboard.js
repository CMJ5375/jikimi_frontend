import React, { useState } from "react";


const CATEGORIES = ["전체", "인기글", "병원정보", "약국정보", "질문해요", "자유글"];

const MOCK = [
  { id: 1, cat: "인기글", title: "간경화 진단을 받았습니다..", date: "2025-09-22", hot: true },
  { id: 2, cat: "인기글", title: "좋은 이비인후과를 찾은 것 같습니다.", date: "2025-09-25", hot: true },
  { id: 3, cat: "질문해요", title: "혹시 성남에 괜찮은 어린이 병원 없을까요?  N", date: "2025-09-27" },
  { id: 4, cat: "질문해요", title: "혹시 성남에 괜찮은 어린이 병원 없을까요?", date: "2025-09-27" },
  { id: 5, cat: "질문해요", title: "혹시 성남에 괜찮은 어린이 병원 없을까요?", date: "2025-09-27" },
  { id: 6, cat: "질문해요", title: "혹시 성남에 괜찮은 어린이 병원 없을까요?", date: "2025-09-27" },
  { id: 7, cat: "질문해요", title: "혹시 성남에 괜찮은 어린이 병원 없을까요?", date: "2025-09-27" },
  { id: 8, cat: "질문해요", title: "혹시 성남에 괜찮은 어린이 병원 없을까요?", date: "2025-09-27" },
  { id: 9, cat: "질문해요", title: "혹시 성남에 괜찮은 어린이 병원 없을까요?", date: "2025-09-27" },
  { id: 10, cat: "질문해요", title: "혹시 성남에 괜찮은 어린이 병원 없을까요?", date: "2025-09-27" },
];

export default function Noticeboard() {
  const [active, setActive] = useState("전체");
  const [q, setQ] = useState("");

  const filtered =
    active === "전체" ? MOCK : active === "인기글" ? MOCK.filter(m => m.hot) : MOCK.filter(m => m.cat === active);

  return (
    <>
        {/* 상단 공지 영역 */}
        <div className="bg-primary text-white">
            <div className="py-2 text-center">
                공지사항 · 공지사항 입니다.
            </div>
        </div>
    
    <div className="container p-3">

        {/* 페이지 타이틀 + 우측 검색/글쓰기 */}
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
                <i className="bi bi-search position-absolute top-50 end-0 translate-middle-y me-3 text-secondary"></i>
                </div>
                <button className="btn btn-primary rounded-pill px-3">
                게시글 작성 <i className="bi bi-pencil ms-1"></i>
                </button>
            </div>
        </div>

        {/* 카테고리 탭 */}
        <ul className="nav nav-tabs board-tabs mb-3">
        {CATEGORIES.map((c) => (
            <li className="nav-item" key={c}>
            <button
                className={`nav-link ${active === c ? "active" : ""}`}
                onClick={() => setActive(c)}
            >
                {c}
            </button>
            </li>
        ))}
        </ul>

        {/* 리스트 영역 */}
        <div className="list-group board-list">
            {filtered
                .filter((m) => (q ? m.title.toLowerCase().includes(q.toLowerCase()) : true))
                .map((m) => (
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

            {/* 페이지네이션 */}
            <nav className="mt-4">
                <ul className="pagination justify-content-center">
                    <li className="page-item disabled"><span className="page-link">&laquo;</span></li>
                    <li className="page-item active"><span className="page-link">1</span></li>
                    <li className="page-item"><a className="page-link" href="#!">2</a></li>
                    <li className="page-item"><a className="page-link" href="#!">3</a></li>
                    <li className="page-item"><a className="page-link" href="#!">4</a></li>
                    <li className="page-item"><a className="page-link" href="#!">5</a></li>
                    <li className="page-item"><a className="page-link" href="#!">&raquo;</a></li>
                </ul>
            </nav>
        </div>
    </>
  );
}