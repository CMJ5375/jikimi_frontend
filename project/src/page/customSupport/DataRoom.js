import React, { useEffect, useMemo, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../css/Noticeboard.css";
import "../../css/Support.css";
import { Eye, Pencil, PinAngleFill, Search, Megaphone, Paperclip } from "react-bootstrap-icons";
import { useNavigate } from "react-router-dom";
import { Button } from "react-bootstrap";
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
      return "NOTICE";
    case "FAQ":
      return "FAQ";
    case "자료실":
      return "DATAROOM";
    default:
      return "DATAROOM";
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
  const isAdmin = Array.isArray(roles) && roles.some(r =>
    r === "ROLE_ADMIN" || r === "ADMIN"
  );

  const [active, setActive] = useState("자료실");
  const [q, setQ] = useState("");
  const [items, setItems] = useState([]);
  const [pageData, setPageData] = useState(null);
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
        page,
        size: 10,
        q,
      });
      setItems(data?.dtoList || []);
      setPageData(data || null);
    } catch (e) {
      console.error("자료 목록 조회 실패:", e);
      setItems([]);
      setPageData(null);
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
        type: "DATAROOM",
        id,
        adminId: user.id,
        token: user.accessToken,
      });
      fetchList(pageData?.current || 1);
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
          type: "DATAROOM",
          id,
          adminId: user.id,
          token: user.accessToken,
        });
      } else {
        await pinSupport({
          type: "DATAROOM",
          id,
          adminId: user.id,
          token: user.accessToken,
        });
      }
      fetchList(pageData?.current || 1);
    } catch (e) {
      console.error("상단 고정/해제 실패:", e);
    }
  };

  const filtered = useMemo(() => {
    const ql = q.toLowerCase();
    return (items || []).filter(
      (m) =>
        (m?.title || "").toLowerCase().includes(ql) ||
        (m?.content || "").toLowerCase().includes(ql)
    );
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
                onClick={() => navigate("/supportCreate?type=DATAROOM")}
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
                key={m.supportId}
                type="button"
                className={`list-group-item list-group-item-action d-flex align-items-center justify-content-between ${
                  m.pinned ? "board-item-hot" : ""
                }`}
                onClick={() =>
                  navigate(`/support/dataroom/detail/${m.supportId}`)
                }
              >
                <div className="d-flex align-items-center gap-3">
                  <span
                    className={`badge rounded-pill px-3 board-badge ${
                      m.pinned ? "popular" : "normal"
                    }`}
                  >
                    {m.pinned ? "상단공지" : "자료실"}
                  </span>
                  <span className="board-title d-flex align-items-center">
                    {m.title}
                    {m?.fileUrl && (
                      <Paperclip size={16} className="ms-2 text-secondary" />
                    )}
                    {isAdmin && (
                      <PinAngleFill
                        className={`ms-2 ${
                          m.pinned ? "text-danger" : "text-muted"
                        }`}
                        role="button"
                        title={m.pinned ? "상단 고정 해제" : "상단 고정"}
                        onClick={(e) => {
                          e.stopPropagation();
                          onTogglePin(m.supportId, m.pinned);
                        }}
                      />
                    )}
                  </span>
                </div>

                <div className="text-secondary small d-flex justify-content-end align-items-center">
                  <div className="d-flex align-items-center me-2" style={{ minWidth: "50px" }}>
                    <Eye size={16} className="me-1" /> {m.viewCount || 0}
                  </div>
                  <div>{String(m.regDate || "").split("T")[0] || "-"}</div>

                  {isAdmin && (
                    <button
                      className="btn btn-sm btn-outline-danger ms-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(m.supportId);
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
          <PageComponent pageData={pageData} onPageChange={(p) => fetchList(p + 1)} />
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
                  onClick={() => navigate("/supportCreate?type=DATAROOM")}
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
                key={p.supportId}
                onClick={() =>
                  navigate(`/support/dataroom/detail/${p.supportId}`)
                }
                role="button"
              >
                <div className="d-flex justify-content-between align-items-start">
                  <span
                    className={`mbp-badge ${p.pinned ? "popular" : ""}`}
                  >
                    {p.pinned ? "상단공지" : "자료실"}
                  </span>
                  {isAdmin && (
                    <PinAngleFill
                      className={`fs-5 ${p.pinned ? "text-danger" : "text-muted"}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onTogglePin(p.supportId, p.pinned);
                      }}
                    />
                  )}
                </div>

                <h6 className="mbp-title-line d-flex align-items-center">
                  {p.title}
                  {p?.fileUrl && (
                    <Paperclip size={16} className="ms-2 text-secondary" />
                  )}
                </h6>

                <div className="d-flex justify-content-between">
                  <div className="mbp-meta">
                    {String(p.regDate || "").split("T")[0] || "-"}
                  </div>
                  <div className="text-end">
                    <div className="fw-bold">{p.writerName || "관리자"}</div>
                  </div>
                </div>

                <div className="d-flex justify-content-between align-items-center text-secondary mt-2">
                  <span className="d-flex align-items-center ms-1">
                    <Eye size={16} className="me-1" />
                    {p.viewCount || 0}
                  </span>

                  {isAdmin && (
                    <button
                      className="btn btn-sm btn-outline-danger ms-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(p.supportId);
                      }}
                    >
                      삭제
                    </button>
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
            <div className="px-3 py-3">
              <PageComponent
                pageData={pageData}
                onPageChange={(p) => fetchList(p + 1)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DataRoom;