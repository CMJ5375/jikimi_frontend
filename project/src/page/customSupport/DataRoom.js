import React, { useEffect, useMemo, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../css/Noticeboard.css";
import "../../css/Support.css";
import { Eye, Pencil, PinFill, Pin, Search, Megaphone, Paperclip } from "react-bootstrap-icons";
import { useNavigate } from "react-router-dom";
import { listSupport, removeSupport, pinSupport, unpinSupport } from "../../api/supportApi";
import useCustomLogin from "../../hook/useCustomLogin";
import PageComponent from "../../component/common/PageComponent";

const CATEGORIES = [
  { name: "공지사항", path: "/notice" },
  { name: "FAQ", path: "/faq" },
  { name: "자료실", path: "/dataroom" },
];

const mapCategoryToType = (cat) => {
  switch (cat) {
    case "공지사항":
      return "notice";
    case "FAQ":
      return "faq";
    case "자료실":
      return "dataroom";
    default:
      return "dataroom";
  }
};

const ROTATE_MS = 3500;
const banners = [
  { kind: "notice", text: "지금 확인하세요! 새로운 공지사항이 등록되었습니다." },
  { kind: "ad", text: "광고 예시: 지역 병원 홍보 배너", brand: "Jikimi" },
  { kind: "notice", text: "사이트 점검 예정 안내 (11/10 02:00 ~ 04:00)" },
];

const DataRoom = () => {
  const navigate = useNavigate();
  const { loginState } = useCustomLogin();
  const user = loginState || {};
  const roles = user?.roleNames || user?.roles || [];
  const isAdmin = Array.isArray(roles) && roles.some((r) => r === "ADMIN" || r === "ROLE_ADMIN");

  const [active, setActive] = useState("자료실");
  const [q, setQ] = useState("");
  const [pageData, setPageData] = useState(null);;
  const [bannerIdx, setBannerIdx] = useState(0);

  // 광고 자동 전환
  useEffect(() => {
    const timer = setInterval(() => {
      setBannerIdx((i) => (i + 1) % banners.length);
    }, ROTATE_MS);
    return () => clearInterval(timer);
  }, []);

  // 목록 조회
  const fetchList = async (page = 1) => {
    try {
      const t = mapCategoryToType(active);
      const data = await listSupport({
        type: t,
        page: page,
        size: 10,
        q,
      });
      setPageData(data);
    } catch (e) {
      console.error("자료실 목록 조회 실패:", e);
    }
  };

  useEffect(() => {
    fetchList(1);
  }, [active]);

  // 검색
  const onSearch = (e) => {
    e?.preventDefault?.();
    fetchList(1);
  };

  // 삭제(관리자 전용)
  const onDelete = async (id) => {
    if (!isAdmin) return;
    if (!window.confirm("정말 삭제하시겠습니까?")) return;
    try {
      await removeSupport({
        type: "dataroom",
        id,
        adminId: user.userId,
        token: user.accessToken,
      });
      fetchList((pageData?.number ?? 0) + 1);
    } catch (e) {
      console.error("삭제 실패:", e);
    }
  };

  // 상단 고정/해제(관리자 전용)
  const onTogglePin = async (id, pinned) => {
    if (!isAdmin) return;
    try {
      if (pinned) {
        await unpinSupport({
          type: "dataroom",
          id,
          adminId: user.userId,
          token: user.accessToken,
        });
      } else {
        await pinSupport({
          type: "dataroom",
          id,
          adminId: user.userId,
          token: user.accessToken,
        });
      }
      fetchList((pageData?.current ?? 0) + 1);
    } catch (e) {
      console.error("상단 고정/해제 실패:", e);
    }
  };

  // 날짜, 최신글
  const items = useMemo(() => {
    if (!pageData?.content) return [];
    return pageData.content.map((m) => {
      const created = m.createdAt ? new Date(m.createdAt) : null;
      const isNew =
        created ? Date.now() - created.getTime() <= 24 * 60 * 60 * 1000 : false;
      const excerpt = (() => {
        const c = m.content || "";
        return c.length > 70 ? c.slice(0, 70) + "..." : c;
      })();

      return {
        id: m.supportId,
        title: m.title ?? "",
        author: m.name || "관리자",
        view: m.viewCount ?? 0,
        created,
        fileName: m.fileName || "",
        fileUrl: m.fileUrl || "",
        pinned: !! m.pinned,
        excerpt,
        isNew,
      };
    });
  }, [pageData]);

  // 검색 필터 적용
  const filtered = useMemo(() => {
    const ql = q.toLowerCase();
    return (items || []).filter((m) => (m.title || "").toLowerCase().includes(ql));
  }, [items, q]);

  return (
    <div className="bg-white">
      {/* 상단 공지/광고 배너 */}
      <div className="container d-none d-md-block">
        <div className="notice-banner my-3">
          <div
            key={bannerIdx}
            className="notice-anim d-flex w-100 align-items-center justify-content-between"
          >
            <div className="notice-left d-flex align-items-center gap-2">
              <span
                className={`notice-icon ${
                  banners[bannerIdx].kind === "ad" ? "is-ad" : "is-notice"
                }`}
              >
                <Megaphone size={16} />
              </span>
              <span className="notice-text">
                {banners[bannerIdx].text}
              </span>
            </div>

            <div className="notice-right">
              {banners[bannerIdx].kind === "ad" ? (
                <>
                  <span className="notice-brand me-1">
                    {banners[bannerIdx].brand}
                  </span>
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
          <h4 className="fw-bold mb-0">자료실</h4>
          <div className="d-flex align-items-center gap-2 position-relative">
            <form onSubmit={onSearch} className="position-relative">
              <input
                type="text"
                className="form-control rounded-pill ps-4 pe-5 board-search"
                placeholder="검색어를 입력해주세요.."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              <button
                type="submit"
                className="btn position-absolute top-0 end-0 h-100 me-1 px-3"
                style={{
                  background: "transparent",
                  border: "none",
                }}
              >
                <Search />
              </button>
            </form>

            {isAdmin && (
              <button
                className="btn btn-primary rounded-pill px-3"
                onClick={() => navigate("/supportCreate?type=dataroom")}
              >
                글작성 <Pencil className="ms-1" />
              </button>
            )}
          </div>
        </div>

        {/* 탭 */}
        <div className="mbp-tabs border-bottom mb-3">
          {CATEGORIES.map((t) => (
            <button
              key={t.name}
              className={`mbp-tabbtn ${active === t.name ? "active" : ""}`}
              onClick={() => {
                setActive(t.name);
                navigate(t.path);
              }}
            >
              {t.name}
            </button>
          ))}
        </div>

        {/* 리스트 (PC) */}
        <div className="list-group board-list">
          {filtered.length > 0 ? (
            filtered.map((m) => (
              <button
                key={m.id}
                type="button"
                className="list-group-item list-group-item-action d-flex align-items-center justify-content-between"
                onClick={() => navigate(`/dataroomdetail/${m.id}`)}
              >
                <div className="d-flex align-items-center gap-3">
                  <span>
                    {isAdmin && (
                      <Pin
                        className={`${
                          m.pinned ? "text-danger" : "text-muted"
                        }`}
                        role="button"
                        title={m.pinned ? "상단 고정 해제" : "상단 고정"}
                        onClick={(e) => { e.stopPropagation(); onTogglePin(m.id, m.pinned); }}
                      />
                    )}
                  </span>
                  <span
                    className={`badge rounded-pill px-3 board-badge ${
                      m.pinned ? "popular" : "normal"
                    }`}
                  >
                    {m.pinned ? "상단공지" : "자료실"}
                  </span>
                  <span className="board-title d-flex align-items-center">
                    {m.title}
                    {m.isNew && <span className="ms-2 text-primary fw-bold">N</span>}
                    {(m.fileName || m.fileUrl) && <Paperclip size={16} className="ms-2 text-secondary" />}
                  </span>
                </div>

                <div className="text-secondary small d-flex justify-content-end align-items-center">
                  <div className="d-flex align-items-center me-2" style={{ minWidth: "50px" }}>
                    <Eye size={16} className="me-1" /> {m.view}
                  </div>
                  <div>{m.created ? m.created.toISOString().slice(0, 10) : "-"}</div>
                  {isAdmin && (
                    <button
                      className="btn-ghost btn-ghost-danger ms-3"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(m.id);
                      }}
                    >
                      삭제
                    </button>
                  )}
                </div>
              </button>
            ))
          ) : (
            <div className="text-center text-secondary py-5">
              등록된 자료가 없습니다.
            </div>
          )}
        </div>

        {/* 페이지네이션 */}
        {pageData && (
          <PageComponent
            pageData={{
              current: pageData.number + 1,
              pageNumList: Array.from({ length: pageData.totalPages }, (_, i) => i + 1),
            }}
            onPageChange={(p) => fetchList(p + 1)}
          />
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
              <div className="mbp-title">자료실</div>
              {isAdmin && (
                <button
                  className="btn btn-primary rounded-pill px-3"
                  onClick={() => navigate("/supportCreate?type=dataroom")}
                  type="button"
                >
                  글작성 <Pencil className="ms-1" />
                </button>
              )}
            </div>

            {/* 검색 */}
            <div className="d-flex align-items-center gap-2">
              <form onSubmit={onSearch} className="position-relative flex-grow-1">
                <input
                  type="text"
                  className="form-control rounded-pill ps-4 pe-5 board-search"
                  placeholder="검색어를 입력해주세요.."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
                <button
                  type="submit"
                  className="btn position-absolute top-0 end-0 h-100 me-1 px-3"
                  style={{ background: "transparent", border: "none" }}
                >
                  <Search />
                </button>
              </form>
            </div>
          </div>

          {/* 탭 */}
          <div className="mbp-tabs border-bottom">
            {CATEGORIES.map((t) => (
              <button
                key={t.name}
                className={`mbp-tabbtn ${active === t.name ? "active" : ""}`}
                onClick={() => {
                  setActive(t.name);
                  navigate(t.path);
                }}
              >
                {t.name}
              </button>
            ))}
          </div>

          {/* 카드 리스트 (모바일) */}
          {filtered.length > 0 ? (
            filtered.map((p) => (
              <article
                className="mbp-card"
                key={p.id}
                onClick={() =>
                  navigate(`/dataroomdetail/${p.id}`)
                }
                role="button"
              >
                <div className="d-flex justify-content-between align-items-start">
                  <div className="d-flex align-items-center gap-2">
                    <Pin
                      className={`fs-5 ${p.pinned ? "text-danger" : "text-muted"}`}
                    />
                    <span className={`mbp-badge ${p.pinned ? "popular" : ""}`}>
                      {p.pinned ? "상단공지" : "자료실"}
                    </span>
                  </div>
                </div>

                <h6 className="mbp-title-line mt-4">
                  {p.title}
                  {p.isNew && <span className="ms-2 text-primary fw-bold">N</span>}
                  {(p.fileName || p.fileUrl) && (
                    <Paperclip size={16} className="ms-2 text-secondary" />
                  )}
                </h6>

                <div className="d-flex justify-content-between text-secondary small">
                  <div className="mbp-meta">
                    {p.created
                      ? `${p.created.toISOString().slice(0, 10)} ${p.created
                          .toTimeString()
                          .slice(0, 5)}`
                      : "-"}
                  </div>
                  <div className="fw-bold text-end text-dark">{p.author}</div>
                </div>
                <p className="mbp-excerpt pt-1">{p.excerpt}</p>

                <div className="mbp-divider"></div>

                <div className="d-flex justify-content-between align-items-center text-secondary">
                  <span className="d-flex align-items-center ms-1">
                    <Eye size={16} className="me-1" />
                    {p.view}
                  </span>
                  {isAdmin && (
                    <div className="d-flex justify-content-end me-1">
                      <button
                        className="btn-ghost btn-ghost-danger"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(p.id);
                        }}
                      >
                        삭제
                      </button>
                    </div>
                  )}
                </div>
              </article>
            ))
          ) : (
            <div className="text-center text-secondary py-5">
              등록된 자료가 없습니다.
            </div>
          )}

          {/* 모바일 페이지네이션 */}
          {pageData && (
          <PageComponent
            pageData={{
              current: pageData.number + 1,
              pageNumList: Array.from({ length: pageData.totalPages }, (_, i) => i + 1),
            }}
            onPageChange={(p) => fetchList(p + 1)}
          />
        )}
        </div>
      </div>
    </div>
  );
};

export default DataRoom;