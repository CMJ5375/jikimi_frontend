import React, { useEffect, useMemo, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../css/Noticeboard.css";
import "../../css/Support.css";
import { Pencil, Search, Megaphone } from "react-bootstrap-icons";
import { useNavigate, useLocation } from "react-router-dom";
import { Accordion } from "react-bootstrap";
import { listSupport, removeSupport, updateSupport } from "../../api/supportApi";
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
  const location = useLocation();
  const { loginState } = useCustomLogin();
  const user = loginState || {};
  const roles = user?.roleNames || user?.roles || [];
  const isAdmin = Array.isArray(roles) && roles.some((r) => r === "ROLE_ADMIN" || r === "ADMIN");

  const [active, setActive] = useState("FAQ");
  const [q, setQ] = useState("");
  const [items, setItems] = useState([]);
  const [pageData, setPageData] = useState(null);
  const [bannerIdx, setBannerIdx] = useState(0);
  const [editId, setEditId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

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
      setPageData(data || null);
      setItems(data?.content || []);
    } catch (e) {
      console.error("FAQ 목록 조회 실패:", e);
    }
  };

  // URL 변경 시 다시 불러오기
  useEffect(() => {
    fetchList(1);
  }, [active, location.pathname]);

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
        adminId: user.userId,
        token: user.accessToken,
      });
      alert("삭제되었습니다.");
      fetchList(pageData?.number + 1 || 1);
    } catch (e) {
      console.error("삭제 실패:", e);
      alert("삭제 실패");
    }
  };

  // 수정모드
  const startEdit = (item) => {
    setEditId(item.supportId);
    setEditTitle(item.title);
    setEditContent(item.content);
  };

  // 수정
  const saveEdit = async (id) => {
    try {
      const dto = {
        title: editTitle.trim(),
        content: editContent.trim(),
      };
      if (!dto.title || !dto.content) {
        alert("제목과 내용을 입력하세요.");
        return;
      }
      await updateSupport({
        type: "faq",
        id,
        dto,
        adminId: user.userId,
        token: user.accessToken,
      });
      alert("수정되었습니다.");
      setEditId(null);
      fetchList(pageData?.number + 1 || 1);
    } catch (e) {
      console.error("수정 실패:", e);
      alert("수정 실패");
    }
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditTitle("");
    setEditContent("");
  };

  // 검색 필터
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
                  {editId === m.supportId ? (
                    <div>
                      <input
                        className="form-control mb-2"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        placeholder="제목을 입력하세요"
                      />
                      <textarea
                        className="form-control mb-2"
                        rows={5}
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        placeholder="내용을 입력하세요"
                      />
                      <div className="text-end">
                        <button
                          className="btn btn-sm btn-primary me-2"
                          onClick={() => saveEdit(m.supportId)}
                        >
                          저장
                        </button>
                        <button
                          className="btn btn-sm btn-outline-secondary"
                          onClick={cancelEdit}
                        >
                          취소
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div
                        className="mb-2"
                        dangerouslySetInnerHTML={{ __html: m.content }}
                      />
                      {isAdmin && (
                        <div className="post-actions text-end mt-2 d-flex justify-content-end gap-2">
                          <button
                            className="btn-ghost"
                            onClick={() => startEdit(m)}
                          >
                            수정
                          </button>
                          <button
                            className="btn-ghost btn-ghost-danger"
                            onClick={() => onDelete(m.supportId)}
                          >
                            삭제
                          </button>
                        </div>
                      )}
                    </>
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
  );
};

export default Faq;