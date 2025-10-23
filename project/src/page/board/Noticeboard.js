// src/component/Noticeboard.js
import React, { useEffect, useMemo, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import '../../css/Noticeboard.css';
import { ChatDots, HandThumbsUp, Pencil, Plus, Search } from "react-bootstrap-icons";
import { useNavigate } from "react-router-dom";
import { getList } from '../../api/postApi'; // GET /api/posts/list
import useCustomLogin from "../../hook/useCustomLogin";

const CATEGORIES = ["전체", "인기글", "병원정보", "약국정보", "질문해요", "자유글"];

const Noticeboard = () => {
  const navigate = useNavigate();

  // 훅은 최상단에서 항상 같은 순서로 호출
  const { isLogin, moveToLoginReturn } = useCustomLogin();

  // 서버 페이징 데이터
  const [pageData, setPageData] = useState(null);
  const [page, setPage] = useState(1);
  const size = 10;

  // UI 상태
  const [active, setActive] = useState("전체");
  const [q, setQ] = useState("");

  // 목록 로드
  useEffect(() => {
    if (!isLogin) return; // 비로그인 시 API 호출 방지
    let ignore = false;
    (async () => {
      try {
        const data = await getList({ page, size });
        if (!ignore) setPageData(data);
        console.log("호출");
      } catch (e) {
        console.error(e);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [page, size, isLogin]);

  // 서버 데이터 → 화면용 변환 (카테고리는 임시, 인기글 규칙: likeCount ≥ 10)
  const items = useMemo(() => {
    if (!pageData?.dtoList) return [];
    return pageData.dtoList.map((p) => ({
      id: p.postId,
      cat: "자유글",
      hot: (p.likeCount ?? 0) >= 10,
      title: p.title ?? "",
      date: p.createdAt ? p.createdAt.slice(0, 10) : "",
      time: p.createdAt ? p.createdAt.slice(11, 16) : "",
      author: p.userName ?? (p.userId ? `user#${p.userId}` : "익명"),
      region: "",
      excerpt: (() => {
        const c = p.content || "";
        return c.length > 70 ? c.slice(0, 70) + "..." : c;
      })(),
      likes: p.likeCount ?? 0,
      comments: 0, // 추후 API 붙이면 교체
    }));
  }, [pageData]);

  // 필터링
  const filteredBase =
    active === "전체"
      ? items
      : active === "인기글"
      ? items.filter((p) => p.hot)
      : items.filter((p) => p.cat === active);

  const filtered = filteredBase.filter((p) =>
    q ? p.title.toLowerCase().includes(q.toLowerCase()) : true
  );

  if (!isLogin) {
    return moveToLoginReturn();
  }

  if (!pageData) {
    return (
      <div className="container py-4">
        <div className="text-center text-secondary">로딩중…</div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white">
        {/* 상단 공지 바 (PC) */}
        <div className="bg-primary text-white mb-4 px-3 py-2 text-center d-none d-md-block">
          <span className="me-2">게시판 ·</span> 자유롭게 의견을 남겨주세요.
        </div>

        {/* ====== PC / 태블릿 ====== */}
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
              </div>
              <button
                className="btn btn-primary rounded-pill px-3"
                onClick={() => navigate("/boardCreats")}
              >
                게시글 작성 <Pencil className="ms-1" />
              </button>
            </div>
          </div>

          {/* 탭 */}
          <div className="mbp-tabs border-bottom mb-3">
            {CATEGORIES.map((c) => (
              <div
                key={c}
                className={`mbp-tabbtn ${active === c ? "active" : ""}`}
                onClick={() => setActive(c)}
                role="button"
              >
                {c}
              </div>
            ))}
          </div>

          {/* 리스트 (PC) — 상세 이동 경로: /boarddetails/:id */}
          <div className="list-group board-list">
            {filtered.map((m) => (
              <button
                key={m.id}
                type="button"
                className={`list-group-item list-group-item-action d-flex align-items-center justify-content-between ${
                  m.hot ? "board-item-hot" : ""
                }`}
                onClick={() => navigate(`/boarddetails/${m.id}`)}
              >
                <div className="d-flex align-items-center gap-3">
                  <span
                    className={`badge rounded-pill px-3 ${
                      m.hot ? "bg-primary-soft text-primary" : "bg-secondary-soft text-secondary"
                    }`}
                  >
                    {m.hot ? "인기글" : m.cat}
                  </span>
                  <span className="board-title">{m.title}</span>
                </div>
                <span className="text-secondary small">{m.date}</span>
              </button>
            ))}
          </div>

          {/* 페이지네이션 */}
          <nav className="mt-4">
            <ul className="pagination justify-content-center">
              <li className={`page-item ${!pageData.prev ? "disabled" : ""}`}>
                <button className="page-link" onClick={() => setPage(pageData.prevPage)}>
                  &laquo;
                </button>
              </li>

              {pageData.pageNumList?.map((n) => (
                <li key={n} className={`page-item ${n === pageData.current ? "active" : ""}`}>
                  <button className="page-link" onClick={() => setPage(n)}>
                    {n}
                  </button>
                </li>
              ))}

              <li className={`page-item ${!pageData.next ? "disabled" : ""}`}>
                <button className="page-link" onClick={() => setPage(pageData.nextPage)}>
                  &raquo;
                </button>
              </li>
            </ul>
          </nav>
        </div>

        {/* ====== 모바일 ====== */}
        <div className="d-block d-md-none">
          <div className="mbp-wrap">
            {/* 헤더 */}
            <div className="d-flex align-items-center justify-content-between px-3 pt-3 pb-2">
              <div className="mbp-title">게시판</div>
              <div className="d-flex align-items-center gap-3">
                <Search />
                <Pencil onClick={() => navigate("/boardCreats")} role="button" />
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

            {/* 카드 리스트 (모바일) */}
            {filtered.map((p) => (
              <article
                className="mbp-card"
                key={p.id}
                onClick={() => navigate(`/boarddetails/${p.id}`)}
                role="button"
              >
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
                    <ChatDots className="me-1" />
                    0
                  </span>
                </div>
              </article>
            ))}

            {/* 모바일 페이지네이션 (간단형) */}
            <div className="d-flex justify-content-center gap-2 my-3">
              <button
                className="btn btn-outline-secondary btn-sm"
                disabled={!pageData.prev}
                onClick={() => setPage(pageData.prevPage)}
              >
                이전
              </button>
              <span className="small align-self-center">
                {pageData.current} / {pageData.totalPage}
              </span>
              <button
                className="btn btn-outline-secondary btn-sm"
                disabled={!pageData.next}
                onClick={() => setPage(pageData.nextPage)}
              >
                다음
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Noticeboard;
