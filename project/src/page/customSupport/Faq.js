import React, { useEffect, useMemo, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../css/Noticeboard.css";
import "../../css/Support.css";
import { Pencil, Search, Megaphone } from "react-bootstrap-icons";
import { useNavigate } from "react-router-dom";
import { Accordion } from "react-bootstrap";
import { listSupport, removeSupport } from "../../api/supportApi";
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
      return "faq";
  }
};

const ROTATE_MS = 3500;
const banners = [
  { kind: "notice", text: "지금 확인하세요! 새로운 공지사항이 등록되었습니다." },
  { kind: "ad", text: "광고 예시: 지역 병원 홍보 배너", brand: "Jikimi" },
  { kind: "notice", text: "사이트 점검 예정 안내 (11/10 02:00 ~ 04:00)" },
];

const Faq = () => {
  const navigate = useNavigate();
  const { loginState } = useCustomLogin();
  const user = loginState || {};
  const roles = user?.roleNames || user?.roles || [];
  const isAdmin = Array.isArray(roles) && roles.some((r) => r === "ROLE_ADMIN" || r === "ADMIN");

  const [active, setActive] = useState("faq");
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
      setItems(data?.content || []);
      setPageData(data || null);
    } catch (e) {
      console.error("FAQ 목록 조회 실패:", e);
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
        type: "faq",
        id,
        adminId: user.id,
        token: user.accessToken,
      });
      fetchList(pageData?.current || 1);
    } catch (e) {
      console.error("삭제 실패:", e);
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
      {/* ===== 배너 ===== */}
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
              <span className="notice-text">{banners[bannerIdx].text}</span>
            </div>

            <div className="notice-right">
              {banners[bannerIdx].kind === "ad" ? (
                <>
                  <span className="notice-brand me-1">{banners[bannerIdx].brand}</span>
                  <span className="notice-ad">광고</span>
                </>
              ) : (
                <span className="notice-badge">공지</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ===== PC / 태블릿 ===== */}
      <div className="container py-4 d-none d-md-block">
        {/* 헤더 */}
        <div className="d-flex align-items-center justify-content-between mb-4 gap-3">
          <h4 className="fw-bold mb-0">FAQ</h4>
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
                style={{ background: "transparent", border: "none" }}
              >
                <Search />
              </button>
            </form>

            {isAdmin && (
              <button
                className="btn btn-primary rounded-pill px-3"
                onClick={() => navigate("/supportCreate?type=faq")}
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

        {/* 아코디언 FAQ 목록 */}
        <Accordion alwaysOpen>
          {filtered.length > 0 ? (
            filtered.map((m, idx) => (
              <Accordion.Item eventKey={idx.toString()} key={m.supportId}>
                <Accordion.Header>{m.title}</Accordion.Header>
                <Accordion.Body>
                  <div
                    className="mb-2"
                    dangerouslySetInnerHTML={{ __html: m.content }}
                  />
                  {isAdmin && (
                    <div className="text-end mt-2">
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => onDelete(m.supportId)}
                      >
                        삭제
                      </button>
                    </div>
                  )}
                </Accordion.Body>
              </Accordion.Item>
            ))
          ) : (
            <div className="text-center text-secondary py-5">
              등록된 FAQ가 없습니다.
            </div>
          )}
        </Accordion>

        {/* 페이지네이션 */}
        {pageData && (
          <PageComponent pageData={pageData} onPageChange={(p) => fetchList(p + 1)} />
        )}
      </div>

      {/* ===== 모바일 ===== */}
      <div className="d-block d-md-none">
        <div className="mbp-wrap px-3 py-3">
          {/* 헤더 */}
          <div className="d-flex align-items-center justify-content-between mb-3">
            <div className="mbp-title">FAQ</div>
            {isAdmin && (
              <button
                className="btn btn-primary rounded-pill px-3"
                onClick={() => navigate("/supportCreate?type=faq")}
              >
                글작성 <Pencil className="ms-1" />
              </button>
            )}
          </div>

          {/* 검색 */}
          <form onSubmit={onSearch} className="position-relative mb-3">
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

          {/* 모바일 아코디언 */}
          <Accordion alwaysOpen>
            {filtered.length > 0 ? (
              filtered.map((m, idx) => (
                <Accordion.Item eventKey={idx.toString()} key={m.supportId}>
                  <Accordion.Header>{m.title}</Accordion.Header>
                  <Accordion.Body>
                    <div
                      className="mb-2"
                      dangerouslySetInnerHTML={{ __html: m.content }}
                    />
                    {isAdmin && (
                      <div className="text-end mt-2">
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => onDelete(m.supportId)}
                        >
                          삭제
                        </button>
                      </div>
                    )}
                  </Accordion.Body>
                </Accordion.Item>
              ))
            ) : (
              <div className="text-center text-secondary py-5">
                등록된 FAQ가 없습니다.
              </div>
            )}
          </Accordion>

          {/* 페이지네이션 */}
          {pageData && (
            <div className="pt-3">
              <PageComponent pageData={pageData} onPageChange={(p) => fetchList(p + 1)} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Faq;