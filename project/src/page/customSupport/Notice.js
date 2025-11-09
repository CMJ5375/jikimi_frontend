// src/page/support/Notice.jsx
import React, { useEffect, useMemo, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../css/Noticeboard.css";
import "../../css/Support.css";
import {
  Eye,
  Pencil,
  PinFill,
  Pin,
  Search,
  Megaphone,
  HandThumbsUp,
} from "react-bootstrap-icons";
import { useNavigate } from "react-router-dom";
import {
  listSupport,
  removeSupport,
  pinSupport,
  unpinSupport,
  listPinnedSupport,
} from "../../api/supportApi";
import useCustomLogin from "../../hook/useCustomLogin";
import PageComponent from "../../component/common/PageComponent";
import Avatar from "../board/Avatar";

/* ===== 권한 유틸 ===== */
function decodeJwtRaw(token) {
  try {
    const b = token.split(".")[1];
    const json = atob(b.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json);
  } catch {
    return null;
  }
}
function normalizeToList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === "string")
    return value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  return [];
}
function pickRolesFromAny(userLike) {
  const bag = [];
  if (!userLike) return [];
  bag.push(...normalizeToList(userLike.roleNames));
  bag.push(...normalizeToList(userLike.roles));
  bag.push(...normalizeToList(userLike.authorities));
  const token = userLike.accessToken || userLike.token;
  if (token) {
    const p = decodeJwtRaw(token);
    if (p) {
      bag.push(...normalizeToList(p.roleNames));
      bag.push(...normalizeToList(p.roles));
      bag.push(...normalizeToList(p.authorities));
    }
  }
  return Array.from(
    new Set(
      bag
        .flatMap((v) =>
          typeof v === "string"
            ? v.split(",").map((s) => s.trim())
            : v
        )
        .filter(Boolean)
    )
  );
}
function hasAdminRole(list) {
  return list.some((r) => r === "ADMIN" || r === "ROLE_ADMIN");
}
function extractUserId(userLike) {
  const token = userLike?.accessToken || userLike?.token;
  const p = token ? decodeJwtRaw(token) : null;
  return (
    p?.userId ??
    p?.id ??
    userLike?.userId ??
    userLike?.id ??
    0
  );
}

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
      return "notice";
  }
};

const ROTATE_MS = 3500;
const banners = [
  { kind: "notice", text: "지금 확인하세요! 새로운 공지사항이 등록되었습니다." },
  { kind: "ad", text: "광고 예시: 지역 병원 홍보 배너", brand: "Jikimi" },
  { kind: "notice", text: "사이트 점검 예정 안내 (11/10 02:00 ~ 04:00)" },
];

const Notice = () => {
  const navigate = useNavigate();
  const { loginState } = useCustomLogin();
  const user = loginState || {};
  const rolesAll = useMemo(() => pickRolesFromAny(user), [user]);
  const isAdmin = useMemo(() => hasAdminRole(rolesAll), [rolesAll]);
  const adminId = useMemo(() => extractUserId(user), [user]);
  const token = user?.accessToken || user?.token || null;

  const [pinnedItems, setPinnedItems] = useState([]);
  const [active, setActive] = useState("공지사항");
  const [q, setQ] = useState("");
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
      const pinnedData = await listPinnedSupport({ type: t });
      setPinnedItems(Array.isArray(pinnedData) ? pinnedData : []);
      const data = await listSupport({
        type: t,
        page,
        size: 10,
        q,
      });
      setPageData(data || null);
    } catch (e) {
      console.error("공지사항 목록 조회 실패:", e);
    }
  };

  useEffect(() => {
    fetchList(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        type: "notice",
        id,
        adminId,
        token,
      });
      alert("삭제되었습니다.");
      fetchList((pageData?.number ?? 0) + 1 || 1);
    } catch (e) {
      console.error("삭제 실패:", e);
      alert("삭제 실패");
    }
  };

  // 상단 핀 토글(관리자 전용)
  const onTogglePin = async (id, isPinnedCopy, originalId = null) => {
    if (!isAdmin) return;
    try {
      if (isPinnedCopy && originalId !== null) {
        await unpinSupport({
          type: "notice",
          id,
          adminId,
          token,
        });
      } else if (!isPinnedCopy && originalId === null) {
        await pinSupport({
          type: "notice",
          id,
          adminId,
          token,
        });
      }
      fetchList((pageData?.number ?? 0) + 1 || 1);
    } catch (e) {
      console.error("상단 고정/해제 실패:", e);
    }
  };

  // 일반 목록 데이터 정제
  const items = useMemo(() => {
    const list = pageData?.content || [];
    return list.map((m) => {
      const created = m.createdAt ? new Date(m.createdAt) : null;
      const isNew =
        created ? Date.now() - created.getTime() <= 24 * 60 * 60 * 1000 : false;
      const contentStr = m.content || "";
      const excerpt =
        contentStr.length > 70 ? contentStr.slice(0, 70) + "..." : contentStr;
      return {
        id: m.supportId,
        title: m.title ?? "",
        author: m.name || "관리자",
        view: m.viewCount ?? 0,
        like: m.likeCount ?? 0,
        created,
        pinnedCopy: m.pinnedCopy ?? false,
        originalId: m.originalId ?? null,
        content: contentStr,
        excerpt,
        isNew,
        authorProfileImage: m.authorProfileImage ?? null,
      };
    });
  }, [pageData]);

  const filtered = useMemo(() => {
    const ql = q.toLowerCase();
    return items.filter((m) => (m.title || "").toLowerCase().includes(ql));
  }, [items, q]);

  // 핀 목록 N표시
  const pinnedItemsWithNew = useMemo(
    () =>
      (pinnedItems || []).map((p) => ({
        ...p,
        isNew: p.createdAt
          ? Date.now() - new Date(p.createdAt).getTime() <= 24 * 60 * 60 * 1000
          : false,
      })),
    [pinnedItems]
  );

  // 탭 클릭 이동
  const handleTabClick = (t) => {
    setActive(t.name);
    navigate(t.path.toLowerCase());
  };

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
              <span className="notice-text">{banners[bannerIdx].text}</span>
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
        <div className="d-flex align-items-center justify-content-between mb-4 gap-3">
          <h4 className="fw-bold mb-0">공지사항</h4>
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
                onClick={() => navigate("/supportCreate?type=notice")}
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
              onClick={() => handleTabClick(t)}
            >
              {t.name}
            </button>
          ))}
        </div>

        {/* PC 상단 고정 리스트 */}
        {pinnedItemsWithNew.length > 0 && (
          <div className="list-group board-list">
            {pinnedItemsWithNew.slice(0, 5).map((p) => (
              <button
                key={`pin-${p.supportId}`}
                type="button"
                className="list-group-item list-group-item-action d-flex align-items-center justify-content-between board-item-hot"
                onClick={() =>
                  navigate(`/noticedetail/${p.originalId || p.supportId}`)
                }
              >
                <div className="d-flex align-items-center gap-3">
                  {isAdmin && (
                    <button
                      className="pin-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onTogglePin(p.supportId, true, p.originalId);
                      }}
                      title="상단 고정 해제"
                    >
                      <PinFill className="fs-5" />
                    </button>
                  )}
                  <span className="badge rounded-pill px-3 board-badge popular">
                    중요공지
                  </span>
                  <span className="board-title d-flex align-items-center">
                    {p.title}
                    {p.isNew && (
                      <span
                        className="ms-2 fw-bold"
                        style={{ fontSize: "0.9rem", color: "#3341F3" }}
                      >
                        N
                      </span>
                    )}
                  </span>
                </div>
                <div className="text-secondary small d-flex justify-content-end align-items-center">
                  <div
                    className="d-flex align-items-center me-2"
                    style={{ minWidth: "50px" }}
                  >
                    <Eye size={16} className="me-1" /> {p.viewCount ?? 0}
                  </div>
                  <div>
                    {p.createdAt ? String(p.createdAt).slice(0, 10) : "-"}
                  </div>
                  {isAdmin && (
                    <button
                      className="btn-ghost btn-ghost-danger ms-3"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(p.supportId);
                      }}
                    >
                      삭제
                    </button>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* PC 리스트 */}
        <div className="list-group board-list">
          {filtered.length > 0 ? (
            filtered
              .filter((p) => !p.originalId)
              .map((p) => {
                const hasPinnedCopy = pinnedItems.some(
                  (c) => c.originalId === p.id
                );
                return (
                  <button
                    key={p.id}
                    type="button"
                    className="list-group-item list-group-item-action d-flex align-items-center justify-content-between"
                    onClick={() => navigate(`/noticedetail/${p.id}`)}
                  >
                    <div className="d-flex align-items-center gap-3">
                      {isAdmin &&
                        (hasPinnedCopy ? (
                          <button
                            className="pin-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              const copy = pinnedItems.find(
                                (c) => c.originalId === p.id
                              );
                              if (copy) onTogglePin(copy.supportId, true, p.id);
                            }}
                            title="상단 고정 해제"
                          >
                            <PinFill className="fs-5" />
                          </button>
                        ) : (
                          <button
                            className="pin-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              onTogglePin(p.id, false, null);
                            }}
                            title="상단 고정"
                          >
                            <Pin className="fs-5" />
                          </button>
                        ))}
                      <span className="badge rounded-pill px-3 board-badge normal">
                        공지사항
                      </span>
                      <span className="board-title d-flex align-items-center">
                        {p.title}
                        {p.isNew && (
                          <span
                            className="ms-2 fw-bold"
                            style={{ fontSize: "0.9rem", color: "#3341F3" }}
                          >
                            N
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="text-secondary small d-flex justify-content-end align-items-center">
                      <div
                        className="d-flex align-items-center me-2"
                        style={{ minWidth: "50px" }}
                      >
                        <Eye size={16} className="me-1" /> {p.view}
                      </div>
                      <div>
                        {p.created
                          ? p.created.toISOString().slice(0, 10)
                          : "-"}
                      </div>
                      {isAdmin && (
                        <button
                          className="btn-ghost btn-ghost-danger ms-3"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(p.id);
                          }}
                        >
                          삭제
                        </button>
                      )}
                    </div>
                  </button>
                );
              })
          ) : (
            <div className="text-center text-secondary py-5">
              등록된 공지사항이 없습니다.
            </div>
          )}
        </div>

        {/* 페이지네이션 */}
        {pageData && (
          <PageComponent
            pageData={{
              current: (pageData.number ?? 0) + 1,
              pageNumList: Array.from(
                { length: pageData.totalPages ?? 0 },
                (_, i) => i + 1
              ),
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
              <div
                key={bannerIdx}
                className="notice-anim d-flex w-100 align-items-center justify-content-between"
              >
                <div className="notice-left">
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
                      <span className="notice-brand">
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

          {/* 헤더 */}
          <div className="px-3 pt-3 pb-2">
            <div className="d-flex align-items-center justify-content-between mb-4 gap-3">
              <div className="mbp-title">공지사항</div>
              {isAdmin && (
                <button
                  className="btn btn-primary rounded-pill px-3"
                  onClick={() => navigate("/supportCreate?type=notice")}
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

          {/* 모바일 상단 고정 카드 */}
          {pinnedItemsWithNew.length > 0 && (
            <div>
              {pinnedItemsWithNew.slice(0, 5).map((m) => (
                <article
                  className="mbp-card"
                  key={`pin-${m.supportId}`}
                  onClick={() =>
                    navigate(`/noticedetail/${m.originalId || m.supportId}`)
                  }
                  role="button"
                >
                  <div className="d-flex justify-content-between align-items-start">
                    <div className="d-flex align-items-center gap-2">
                      {isAdmin && (
                        <button
                          className="pin-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            onTogglePin(m.supportId, true, m.originalId);
                          }}
                          title="상단 고정 해제"
                        >
                          <PinFill className="fs-4" />
                        </button>
                      )}
                      <span className="mbp-badge popular">중요공지</span>
                    </div>
                    {isAdmin && (
                      <button
                        className="btn-ghost btn-ghost-danger"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(m.supportId);
                        }}
                      >
                        삭제
                      </button>
                    )}
                  </div>

                  <div className="d-flex justify-content-between align-items-stretch mt-2">
                    <div className="flex-grow-1">
                      <div className="d-flex justify-content-between align-items-center">
                        <h6 className="mbp-title-line fw-semibold text-truncate mb-1">
                          {m.title}
                          {m.isNew && (
                            <span
                              className="ms-2 fw-bold"
                              style={{ fontSize: "1rem", color: "#3341F3" }}
                            >
                              N
                            </span>
                          )}
                        </h6>
                        <span className="fw-semibold text-dark small">
                          {m.author || "관리자"}
                        </span>
                      </div>

                      <div className="d-flex justify-content-between text-secondary small mt-1">
                        <span>
                          {m.createdAt
                            ? `${new Date(m.createdAt)
                                .toISOString()
                                .slice(0, 10)} ${new Date(m.createdAt)
                                .toTimeString()
                                .slice(0, 5)}`
                            : "-"}
                        </span>
                        <span className="fw-semibold" style={{ color: "#3341F3" }}>
                          {m.authorAddress || "성남"}
                        </span>
                      </div>
                    </div>

                    <div className="d-flex align-items-center ms-2">
                      <Avatar
                        src={m.authorProfileImage}
                        size={56}
                        className="border border-light shadow-sm"
                      />
                    </div>
                  </div>

                  <p className="mbp-excerpt pt-1">
                    {m.content && m.content.length > 0
                      ? m.content.slice(0, 70) + (m.content.length > 70 ? "..." : "")
                      : "내용이 없습니다."}
                  </p>
                  <div className="mbp-divider"></div>
                  <div className="d-flex justify-content-end align-items-center text-secondary me-1">
                    <span className="d-flex align-items-center me-3">
                      <Eye size={16} className="me-1" />
                      {m.viewCount ?? 0}
                    </span>
                    <span className="d-flex align-items-center me-1">
                      <HandThumbsUp size={16} className="me-1" />
                      {m.likeCount ?? 0}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}

          {/* 모바일 카드 리스트 */}
          {filtered.filter((m) => !m.pinnedCopy).length > 0 ? (
            filtered
              .filter((m) => !m.pinnedCopy)
              .map((m) => {
                const hasPinnedCopy = pinnedItems.some(
                  (c) => c.originalId === m.id
                );
                return (
                  <article
                    className="mbp-card"
                    key={m.id}
                    onClick={() => navigate(`/noticedetail/${m.id}`)}
                    role="button"
                  >
                    <div className="d-flex justify-content-between align-items-start">
                      <div className="d-flex align-items-center gap-2">
                        {isAdmin &&
                          (hasPinnedCopy ? (
                            <button
                              className="pin-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                const copy = pinnedItems.find(
                                  (c) => c.originalId === m.id
                                );
                                if (copy) onTogglePin(copy.supportId, true, m.id);
                              }}
                              title="상단 고정 해제"
                            >
                              <PinFill className="fs-4" />
                            </button>
                          ) : (
                            <button
                              className="pin-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                onTogglePin(m.id, false, null);
                              }}
                              title="상단 고정"
                            >
                              <Pin className="fs-4" />
                            </button>
                          ))}
                        <span className="mbp-badge">공지사항</span>
                      </div>
                      {isAdmin && (
                        <button
                          className="btn-ghost btn-ghost-danger"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(m.id);
                          }}
                        >
                          삭제
                        </button>
                      )}
                    </div>

                    <div className="d-flex justify-content-between align-items-stretch mt-2">
                      <div className="flex-grow-1">
                        <div className="d-flex justify-content-between align-items-center">
                          <h6 className="mbp-title-line fw-semibold text-truncate mb-1">
                            {m.title}
                            {m.isNew && (
                              <span
                                className="ms-2 fw-bold"
                                style={{ fontSize: "1rem", color: "#3341F3" }}
                              >
                                N
                              </span>
                            )}
                          </h6>
                          <span className="fw-semibold text-dark small">
                            {m.author}
                          </span>
                        </div>

                        <div className="d-flex justify-content-between text-secondary small mt-1">
                          <span>
                            {m.created
                              ? `${m.created
                                  .toISOString()
                                  .slice(0, 10)} ${m.created
                                  .toTimeString()
                                  .slice(0, 5)}`
                              : "-"}
                          </span>
                          <span className="fw-semibold" style={{ color: "#3341F3" }}>
                            성남
                          </span>
                        </div>
                      </div>

                      <div className="d-flex align-items-center ms-2">
                        <Avatar
                          src={m.authorProfileImage}
                          size={56}
                          className="border border-light shadow-sm"
                        />
                      </div>
                    </div>

                    <p className="mbp-excerpt pt-1">
                      {m.excerpt && m.excerpt.length > 0 ? m.excerpt : "내용이 없습니다."}
                    </p>
                    <div className="mbp-divider"></div>
                    <div className="d-flex justify-content-end align-items-center text-secondary me-1">
                      <span className="d-flex align-items-center me-3">
                        <Eye size={16} className="me-1" />
                        {m.view}
                      </span>
                      <span className="d-flex align-items-center me-1">
                        <HandThumbsUp size={16} className="me-1" />
                        {m.like}
                      </span>
                    </div>
                  </article>
                );
              })
          ) : (
            <div className="text-center text-secondary py-5">
              등록된 공지사항이 없습니다.
            </div>
          )}

          {/* 모바일 페이지네이션 */}
          {pageData && (
            <PageComponent
              pageData={{
                current: (pageData.number ?? 0) + 1,
                pageNumList: Array.from(
                  { length: pageData.totalPages ?? 0 },
                  (_, i) => i + 1
                ),
              }}
              onPageChange={(p) => fetchList(p + 1)}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Notice;
