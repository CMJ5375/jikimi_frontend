import { useEffect, useMemo, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../css/Noticeboard.css";
import { ChatDots, HandThumbsUp, Pencil, Plus, Search, Megaphone } from "react-bootstrap-icons";
import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getList } from "../../api/postApi";
import useCustomLogin from "../../hook/useCustomLogin";
import PageComponent from "../../component/common/PageComponent";

// 탭 라벨
const CATEGORIES = ["전체", "인기글", "병원정보", "약국정보", "질문해요", "자유글"];

// 한글 → ENUM (서버 파라미터)
const KOR_TO_ENUM = {
  병원정보: "HOSPITAL_INFO",
  약국정보: "PHARMACY_INFO",
  질문해요: "QUESTION",
  자유글: "FREE",
};

// ENUM → 한글 (표시용)
const ENUM_TO_KOR = {
  HOSPITAL_INFO: "병원정보",
  PHARMACY_INFO: "약국정보",
  QUESTION: "질문해요",
  FREE: "자유글",
};

const Noticeboard = () => {
  const navigate = useNavigate();
  const { isLogin, moveToLoginReturn } = useCustomLogin();

  //상단광고
  const ROTATE_MS = 5000; // 전환 주기
  const banners = useRef([
    {
      kind: "notice",
      text: "이용자들의 불쾌감을 주는 게시글은 동의없이 삭제 조치하겠습니다.",
      brand: "관리자",
      },
      {
      kind: "ad",
      text: "건강하고 아름다운 나를 위한 선택, 삼성서울병원이 함께 합니다.",
      brand: "삼성서울병원",
      },
  ]).current;
  
  //상단광고2
  const [bannerIdx, setBannerIdx] = useState(0);

  // 서버 페이징 상태
  const [pageData, setPageData] = useState(null); // PageResponseDTO
  const [page, setPage] = useState(1);            // 1-based
  const size = 10;

  // UI 상태
  const [active, setActive] = useState("전체");
  const [q, setQ] = useState("");

  // 검색 실행 (모바일 버튼/엔터 공통)
  const handleSearch = () => {
    // 입력값(q)은 onChange로 이미 반영되므로, 1페이지로 돌려서 useEffect 재호출
    setPage(1);
  };

  // 모바일 인풋에서 엔터로 검색
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
  };

  // 상단 광고
  useEffect(() => {
      const t = setInterval(() => {
        setBannerIdx((i) => (i + 1) % banners.length);
      }, ROTATE_MS);
      return () => clearInterval(t);
      }, [banners]);

  // 목록 로드 (항상 서버 페이징; 인기글도 서버는 기본 목록만 받아오고, 프론트에서만 필터/슬라이스)
  useEffect(() => {
    if (!isLogin) return;

    const fetch = async () => {
      try {
        const boardCategory =
          active !== "전체" && active !== "인기글" ? KOR_TO_ENUM[active] : undefined;

        const sort = active === "인기글" ? "POPULAR" : "DEFAULT";
        const days = sort === "POPULAR" ? 7 : undefined;  

        const data = await getList({
          page,
          size,
          q: q || undefined,
          boardCategory,
          sort,
          days,
        });

        setPageData(data);
      } catch (e) {
        console.error("게시판 목록 로드 실패:", e);
      }
    };

    fetch();
  }, [isLogin, page, size, q, active]);

  // 서버 데이터 → 화면 표시용 변환
  const items = useMemo(() => {
    if (!pageData?.dtoList) return [];
    return pageData.dtoList.map((p) => ({
      id: p.postId,
      cat: ENUM_TO_KOR[p.boardCategory] ?? "자유글",
      hot: (p.likeCount ?? 0) >= 3,
      title: p.title ?? "",
      date: p.createdAt ? p.createdAt.slice(0, 10) : "",
      time: p.createdAt ? p.createdAt.slice(11, 16) : "",
      author: p.authorName ?? (p.userId ? `user#${p.userId}` : "익명"),
      region: "",
      excerpt: (() => {
        const c = p.content || "";
        return c.length > 70 ? c.slice(0, 70) + "..." : c;
      })(),
      likes: p.likeCount ?? 0,
      view: p.viewCount ?? 0,
      comments: 0,
    }));
  }, [pageData]);

  // 탭/검색 변경 시 1페이지로
  const handleChangeTab = (category) => {
    setActive(category);
    setPage(1);
  };
  const handleChangeQuery = (e) => {
    setQ(e.target.value);
    setPage(1);
  };

  // 페이지네이션 (인기글은 프론트 슬라이스, 나머지는 서버 응답 사용)
  const paginationData = useMemo(() => {
  if (!pageData) return null;

  const current1 = pageData.current ?? pageData.page ?? page; // 서버 1-based 가정
  const pageNumList = pageData.pageNumList?.length
    ? pageData.pageNumList
    : Array.from(
        { length: Math.max(1, Math.ceil((pageData.totalCount ?? 0) / size)) },
        (_, i) => i + 1
      );

  return {
    current: current1,
    pageNumList,
    prev: !!pageData.prev,
    next: !!pageData.next,
  };
}, [page, pageData, size]);

  // PageComponent 콜백(0-based index)
  const handlePageChange = (zeroBased) => {
    setPage(zeroBased + 1);
  };

  // 비로그인 차단
  if (!isLogin) return moveToLoginReturn();

  // 로딩(인기글이 아닐 때만)
  if (!pageData && active !== "인기글") {
    return (
      <div className="container py-4">
        <div className="text-center text-secondary">로딩중…</div>
      </div>
    );
  }

  // 화면에 표시할 리스트
  const visibleItems = items;

  return (
    <div className="bg-white">
      {/* 공지/광고 배너 (PC) */}
      <div className="container d-none d-md-block">
        <div className="notice-banner my-3">
          {/* key 로 페이드 애니메이션 트리거 */}
          <div key={bannerIdx} className="notice-anim d-flex w-100 align-items-center justify-content-between">
            <div className="notice-left">
              <span className={`notice-icon ${banners[bannerIdx].kind === "ad" ? "is-ad" : "is-notice"}`}>
                <Megaphone size={16} />
              </span>
              <span className="notice-text">{banners[bannerIdx].text}</span>
            </div>

            <div className="notice-right">
              {banners[bannerIdx].kind === "ad" ? (
                <>
                  <span className="notice-brand">{banners[bannerIdx].brand}</span>
                  <span className="notice-ad">광고</span>
                </>
              ) : (
                <span className="notice-badge">공지</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ====== PC / 태블릿 ====== */}
      <div className="container py-4 d-none d-md-block">
        {/* 타이틀 & 검색/작성 */}
        <div className="d-flex align-items-center justify-content-between mb-4 gap-3">
          <h4 className="fw-bold mb-0">게시판</h4>
          <div className="d-flex align-items-center gap-2">
            <div className="position-relative">
              <input
                type="text"
                className="form-control rounded-pill ps-4 pe-5 board-search"
                placeholder="검색어를 입력해주세요.."
                value={q}
                onChange={handleChangeQuery}
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
              onClick={() => handleChangeTab(c)}
              role="button"
            >
              {c}
            </div>
          ))}
        </div>

        {/* 리스트 (PC) */}
        <div className="list-group board-list">
          {visibleItems.map((m) => (
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
              <div className="text-end text-secondary small d-flex flex-column align-items-end">
                <span>{m.view} &nbsp; {m.date}</span>
              </div>
            </button>
          ))}
        </div>

        {/* 페이지네이션 */}
        {paginationData && (
          <PageComponent pageData={paginationData} onPageChange={handlePageChange} />
        )}
      </div>

      {/* ====== 모바일 ====== */}
      <div className="d-block d-md-none">
        <div className="mbp-wrap">

          {/* 공지/광고 배너 (모바일) */}
          <div className="px-3 pt-2 d-block d-md-none">
            <div className="notice-banner">
              <div key={bannerIdx} className="notice-anim d-flex w-100 align-items-center justify-content-between">
                <div className="notice-left">
                  <span className={`notice-icon ${banners[bannerIdx].kind === "ad" ? "is-ad" : "is-notice"}`}>
                    <Megaphone size={16} />
                  </span>
                  <span className="notice-text">{banners[bannerIdx].text}</span>
                </div>
                <div className="notice-right">
                  {banners[bannerIdx].kind === "ad" ? (
                    <>
                      <span className="notice-brand">{banners[bannerIdx].brand}</span>
                      <span className="notice-ad">광고</span>
                    </>
                  ) : (
                    <span className="notice-badge">공지</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 헤더 */}
          <div className="px-3 pt-3 pb-2">
            <div className="d-flex align-items-center justify-content-between mb-4 gap-3">
              <div className="mbp-title">게시판</div>
              <button
                className="btn btn-primary btn rounded-pill px-3"
                onClick={() => navigate("/boardCreats")}
                type="button"
              >
                글작성 <Pencil className="ms-1" />
              </button>
            </div>

            {/* PC와 동일 동작: onChange로 q 업데이트 → useEffect 트리거 */}
            <div className="d-flex align-items-center gap-2">
              <div className="position-relative flex-grow-1">
                <input
                  type="text"
                  className="form-control rounded-pill ps-4 pe-5 board-search"
                  placeholder="검색어를 입력해주세요.."
                  value={q}
                  onChange={handleChangeQuery}
                  onKeyDown={handleKeyDown}   // ← 엔터로 검색
                />
                <button
                  type="button"
                  className="btn position-absolute top-0 end-0 h-100 me-1 px-3"
                  onClick={handleSearch}      // ← 돋보기 버튼으로 검색
                  aria-label="검색"
                  style={{ background: "transparent", border: "none" }}
                >
                  <Search />
                </button>
              </div>
            </div>
          </div>

          {/* 탭(가로 스크롤) */}
          <div className="mbp-tabs border-bottom">
            {CATEGORIES.map((t) => (
              <button
                key={t}
                className={`mbp-tabbtn ${active === t ? "active" : ""}`}
                onClick={() => handleChangeTab(t)}
              >
                {t}
              </button>
            ))}
          </div>

          {/* 카드 리스트 (모바일) */}
          {visibleItems.map((p) => (
            <article
              className="mbp-card"
              key={p.id}
              onClick={() => navigate(`/boarddetails/${p.id}`)}
              role="button"
            >
              <div className="d-flex justify-content-between align-items-start">
                <span className={`mbp-badge ${ p.hot ? "bg-primary-soft text-primary" : "bg-secondary-soft text-secondary"}`}>
                {p.hot ? "인기글" : p.cat}
                </span>
                <div className="mbp-ghostmark">
                  <Plus className="fs-5" />
                </div>
              </div>

              <h6 className="mbp-title-line">{p.title}</h6>

              <div className="d-flex justify-content-between">
                <div className="mbp-meta">{p.date} {p.time}</div>
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

          {/* 모바일 페이지네이션(간단) */}
          {paginationData && (
            <div className="px-3 py-3">
              <PageComponent pageData={paginationData} onPageChange={handlePageChange} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Noticeboard;