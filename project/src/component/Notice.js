import React, { useState, useMemo } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./Noticeboard.css";
import { Eye, HandThumbsUp, Plus, Pencil, Search } from "react-bootstrap-icons";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from 'react-bootstrap';

const isAdmin = true; // 관리자 여부 (false로 바꾸면 버튼 숨김)

const CATEGORIES = [
  { name: "공지사항", path: "/notice" },
  { name: "FAQ", path: "/faq" },
  { name: "자료실", path: "/dataroom" },
];

const Notice = () => {
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
      : "공지사항";

  const [active, setActive] = useState(initialTab);
  const [q, setQ] = useState("");

  // 데모 데이터
  const POSTS = useMemo(
    () => [
      {
        id: 1,
        cat: "공지사항",
        hot: true,
        title: "대전 국가정보 자원관리원 화재 관련 안내",
        date: "2025-09-22",
        time: "5일 전",
        author: "관리자",
        region: "경기/성남시",
        excerpt:
          "대전 국가정보자원관리원 화재 영향으로 일부 서비스가 일시 중단되었습니다. 복구 및 대응 현황을 안내드립니다.",
        likes: 25,
        comments: 1105,
        isNew: true,
      },
      {
        id: 2,
        cat: "공지사항",
        hot: true,
        title: "2025/1분기 예방접종 안내",
        date: "2025-09-25",
        time: "3일 전",
        author: "관리자",
        region: "서울/송파",
        excerpt:
          "2025년 1분기 예방접종 일정과 대상, 유의사항을 안내드립니다.",
        likes: 18,
        comments: 555,
      },
      {
        id: 3,
        cat: "공지사항",
        title: "2024/4분기 예방접종 안내",
        date: "2025-09-27",
        time: "어제",
        author: "관리자",
        region: "경기/성남시",
        excerpt:
          "4분기 예방접종 세부 일정 및 준비사항을 확인해주세요.",
        likes: 7,
        comments: 98,
      },
    ],
    []
  );

  // 검색어 필터링 (제목, 내용 기준)
  const filtered = useMemo(() => {
    return POSTS.filter(
      (post) =>
        post.cat === active && // 현재 탭에 해당하는 글만
        (post.title.toLowerCase().includes(q.toLowerCase()) ||
          post.excerpt.toLowerCase().includes(q.toLowerCase()))
    );
  }, [POSTS, active, q]);

  // // 게시글 상세 이동 (예시용) *****
  // const goDetail = (post) => {
  //   navigate(`/notice/${post.id}`, { state: post });
  // };

  return (
    <div className="bg-white">
      {/* ===== PC / 태블릿 이상 ===== */}
      <div className="bg-primary text-white mb-4 px-3 py-2 text-center d-none d-md-block">
        <span className="me-2">공지사항 ·</span> 공지사항 입니다.
      </div>

      <div className="container py-4 d-none d-md-block">
        {/* 타이틀 & 검색/작성 */}
            <div className="d-flex align-items-center justify-content-between mb-3">
                <h4 className="fw-bold mb-0">공지사항</h4>
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

        {/* 탭 */}
        <div className="mbp-tabs border-bottom">
                {CATEGORIES.map((c) => (
                <button
                    key={c}
                    className={`mbp-tabbtn ${active === c.name ? "active" : ""}`}
                    onClick={() => {setActive(c.name); navigate(c.path);}}
                >
                    {c.name}
                </button>
                ))}
            </div>

        {/* 리스트: 공지사항만 표시 / FAQ·자료실은 안내문 */}
        {active === "공지사항" ? (
          <div className="list-group board-list mt-3">
            {filtered.map((m) => (
              <button
                type="button"
                key={m.id}
                className={`list-group-item list-group-item-action d-flex align-items-center justify-content-between ${
                  m.hot ? "board-item-hot" : ""
                }`}
                //onClick={() => goDetail(m)} ******
                onClick={()=> navigate(`/noticedetails`)}
              >
                <div className="d-flex align-items-center gap-3">
                  <span
                    className={`badge rounded-pill px-3 ${
                      m.hot
                        ? "bg-primary-soft text-primary"
                        : "bg-secondary-soft text-secondary"
                    }`}
                  >
                    공지사항
                  </span>
                  <span className="board-title">
                    {m.title}
                    {m.isNew && <span className="ms-2 text-primary fw-bold">N</span>}
                  </span>
                </div>
                <span className="text-secondary small">{m.date}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center text-secondary py-5 rounded-3 bg-light">
            {active} 페이지는 준비 중입니다.
          </div>
        )}

        {/* 페이지네이션 (모양만) */}
        <nav className="mt-4">
          <ul className="pagination justify-content-center">
            <li className="page-item disabled">
              <span className="page-link">&laquo;</span>
            </li>
            <li className="page-item active">
              <span className="page-link">1</span>
            </li>
            <li className="page-item">
              <a className="page-link" href="#!">
                2
              </a>
            </li>
            <li className="page-item">
              <a className="page-link" href="#!">
                3
              </a>
            </li>
            <li className="page-item">
              <a className="page-link" href="#!">
                &raquo;
              </a>
            </li>
          </ul>
        </nav>
      </div>

      {/* ===== 모바일 ===== */}
      <div className="d-block d-md-none">
        <div className="mbp-wrap">
          {/* 헤더 */}
          <div className="d-flex align-items-center justify-content-between px-3 pt-3 pb-2">
            <div className="mbp-title">공지사항</div>
            <div className="d-flex align-items-center gap-3">
                <Search />
                {isAdmin && (<Pencil />)}
            </div>
          </div>

          {/* 탭(가로 스크롤) */}
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
          {active === "공지사항" ? (
            filtered.map((p) => (
              <article
                className="mbp-card"
                key={p.id}
                //onClick={() => goDetail(p)} ****
                onClick={()=> navigate(`/noticedetails`)}
              >
                <div className="d-flex justify-content-between align-items-start">
                  <span className="mbp-badge">{p.hot ? "공지사항" : p.cat}</span>
                  <div className="mbp-ghostmark">
                    <Plus className="fs-5" />
                  </div>
                </div>

                <h6 className="mbp-title-line">
                  {p.title}
                  {p.isNew && <span className="ms-2 text-primary">N</span>}
                </h6>

                <div className="d-flex justify-content-between">
                  <div className="mbp-meta">{p.time}</div>
                  <div className="text-end">
                    <div className="fw-bold">{p.author}</div>
                    <span className="mbp-region">{p.region}</span>
                  </div>
                </div>

                <p className="mbp-excerpt">{p.excerpt}</p>

                <div className="mbp-divider"></div>

                <div className="d-flex align-items-center gap-4 text-secondary">
                  <span>
                    <HandThumbsUp className="me-1" />
                    {p.likes}
                  </span>
                  <span>
                    {/* <ChatDots className="me-1" /> */}
                    <Eye className="me-1"/>
                    {p.comments}
                  </span>
                </div>
              </article>
            ))
          ) : (
            <div className="text-center text-secondary py-5">
              {active} 페이지는 준비 중입니다.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Notice