// src/page/support/DataRoomDetail.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../css/BoardDetail.css";
import {
  getSupport,
  removeSupport,
  updateSupport,
  toggleSupportLike,
  getSupportLikeStatus,
} from "../../api/supportApi";
import useCustomLogin from "../../hook/useCustomLogin";
import { API_SERVER_HOST } from "../../config/api";
import Avatar from "../board/Avatar";
import { Eye, HandThumbsUp, Share, Folder, List } from "react-bootstrap-icons";

// 절대 URL 보정
function toAbs(u) {
  if (!u) return "";
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  return `${API_SERVER_HOST}${u}`;
}
function getFileNameFromUrl(u) {
  if (!u) return "";
  try {
    const url = new URL(u, "https://placeholder");
    const pathname = url.pathname || "";
    const name = pathname.split("/").filter(Boolean).pop() || "";
    return decodeURIComponent(name);
  } catch {
    const parts = String(u).split("/").filter(Boolean);
    return decodeURIComponent(parts.pop() || "");
  }
}
// 역할 정규화
function normalizeRoles(input) {
  const out = [];
  const push = (r) => {
    if (!r) return;
    let s = String(r).toUpperCase().trim();
    if (s.startsWith("ROLE_")) s = s.slice(5);
    out.push(s);
  };
  if (!input) return out;
  if (Array.isArray(input)) {
    for (const item of input) {
      if (typeof item === "string") push(item);
      else if (item && typeof item === "object") {
        push(item.roleName || item.name || item.authority || item.value);
      }
    }
  } else if (typeof input === "string") {
    input.split(",").forEach((s) => push(s));
  } else if (typeof input === "object") {
    const maybe = input.roleNames || input.roles || input.JMemberRoleList || input.authorities || [];
    return normalizeRoles(maybe);
  }
  return out;
}

const DataRoomDetail = () => {
  const { id: idParam } = useParams();
  const navigate = useNavigate();
  const id = Number(idParam || 0);
  const type = "dataroom";

  // ✅ 인증 정보는 목록과 동일하게 훅에서
  const { loginState } = useCustomLogin();
  const user = loginState || {};
  const userId = user?.userId ?? user?.id ?? null;
  const accessToken = user?.accessToken || user?.token || null;
  const roles = useMemo(() => normalizeRoles(user?.roles ?? user?.roleNames ?? user?.JMemberRoleList ?? []), [user]);
  const isAdmin = roles.includes("ADMIN");

  // 글 상태
  const [post, setPost] = useState({
    title: "",
    content: "",
    likeCount: 0,
    viewCount: 0,
    createdAt: null,
    name: "",
    fileName: "",
    fileUrl: "",
    authorProfileImage: null,
  });
  const [attachments, setAttachments] = useState([]);
  const [showAttachPopup, setShowAttachPopup] = useState(false);

  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  const pageUrl = typeof window !== "undefined" ? window.location.href : "";
  const shareTitle = post.title || "자료실";

  const formatted = useMemo(() => {
    if (!post.createdAt) return { date: "", time: "" };
    const d = new Date(post.createdAt);
    return {
      date: d.toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" }),
      time: d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false }),
    };
  }, [post.createdAt]);

  // 로드
  useEffect(() => {
    let ignore = false;
    (async () => {
      setLoading(true);
      try {
        const data = await getSupport({ type, id, increaseView: true });
        if (ignore) return;

        setPost({
          title: data.title ?? "",
          content: data.content ?? "",
          likeCount: data.likeCount ?? 0,
          viewCount: data.viewCount ?? 0,
          createdAt: data.createdAt ?? null,
          name: data.name ?? "관리자",
          fileName: data.fileName ?? "",
          fileUrl: data.fileUrl ?? "",
          authorProfileImage: data.authorProfileImage ?? null,
        });

        if (data.fileName) {
          const url = `${API_SERVER_HOST}/uploads/support/${encodeURIComponent(data.fileName)}`;
          setAttachments([{ url, fileName: data.fileName }]);
        } else if (data.fileUrl) {
          const abs = toAbs(data.fileUrl);
          setAttachments([{ url: abs, fileName: getFileNameFromUrl(abs) }]);
        } else {
          setAttachments([]);
        }

        setEditTitle(data.title ?? "");
        setEditContent(data.content ?? "");
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => { ignore = true; };
  }, [id]);

  // 좋아요 상태
  useEffect(() => {
    (async () => {
      if (!userId || !accessToken) {
        setLiked(false);
        return;
      }
      try {
        const status = await getSupportLikeStatus({ type, id, userId, token: accessToken });
        setLiked(status?.liked ?? false);
      } catch {
        setLiked(false);
      }
    })();
  }, [id, userId, accessToken]);

  const handleLike = async () => {
    if (!userId || !accessToken) {
      alert("로그인이 필요합니다.");
      return;
    }
    try {
      const res = await toggleSupportLike({ type, id, userId, token: accessToken });
      setLiked(!!res?.liked);
      setPost((prev) => ({ ...prev, likeCount: res?.likeCount ?? prev.likeCount }));
    } catch (e) {
      console.error("[DataRoomDetail] 좋아요 실패:", e);
      alert("좋아요 처리 중 오류가 발생했습니다.");
    }
  };

  const handleEditStart = () => {
    setEditTitle(post.title);
    setEditContent(post.content);
    setEditMode(true);
  };
  const handleEditCancel = () => {
    setEditMode(false);
    setEditTitle(post.title);
    setEditContent(post.content);
  };
  const handleEditSave = async () => {
    if (!isAdmin) {
      alert("관리자만 수정할 수 있습니다.");
      return;
    }
    const dto = {
      title: (editTitle || "").trim(),
      content: (editContent || "").trim(),
      fileName: post.fileName,
      fileUrl: post.fileUrl,
    };
    if (!dto.title) {
      alert("제목을 입력하세요.");
      return;
    }
    try {
      await updateSupport({ type, id, dto, adminId: userId, token: accessToken });
      alert("수정되었습니다.");
      setPost((p) => ({ ...p, ...dto }));
      setEditMode(false);
    } catch (e) {
      console.error("[DataRoomDetail] 수정 실패:", e);
      alert("수정 실패");
    }
  };
  const handleDelete = async () => {
    if (!isAdmin) return;
    if (!window.confirm("정말 삭제하시겠습니까?")) return;
    try {
      await removeSupport({ type, id, adminId: userId, token: accessToken });
      alert("삭제되었습니다.");
      navigate("/dataroom");
    } catch (e) {
      console.error("[DataRoomDetail] 삭제 실패:", e);
      alert("삭제 실패");
    }
  };

  const openShare = useCallback(async () => {
    if (navigator.share) {
      try { await navigator.share({ title: shareTitle, text: shareTitle, url: pageUrl }); return; } catch {}
    }
    try { await navigator.clipboard.writeText(pageUrl); alert("링크가 복사되었습니다."); }
    catch { alert("복사 실패"); }
  }, [pageUrl, shareTitle]);

  if (loading) {
    return <div className="container post-detail py-5 text-center text-muted">불러오는 중…</div>;
  }

  return (
    <div className="container post-detail position-relative">
      {/* 제목 + 수정/삭제 */}
      <div className="d-flex justify-content-between align-items-start mb-3">
        {!editMode ? (
          <h3 className="fw-bold post-title">{post.title}</h3>
        ) : (
          <input
            className="form-control form-control-lg fw-bold"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            placeholder="제목을 입력하세요"
          />
        )}

        {!editMode && isAdmin && (
          <div className="post-actions d-flex">
            <button className="btn-ghost" onClick={handleEditStart}>수정</button>
            <button className="btn-ghost btn-ghost-danger" onClick={handleDelete}>삭제</button>
          </div>
        )}
      </div>

      {/* 메타 */}
      <div className="d-flex justify-content-between align-items-center post-meta mb-3">
        <div className="d-flex align-items-center">
          <Avatar src={post.authorProfileImage} size={40} className="me-2 border border-light shadow-sm" />
          <span className="fw-semibold text-dark me-2">{post.name || "관리자"}</span>
          <span>{formatted.date} {formatted.time}</span>
        </div>
        <div><Eye /> {post.viewCount ?? 0}</div>
      </div>

      <hr />

      {/* 첨부 */}
      {attachments.length > 0 && (
        <div className="text-end position-relative mb-3">
          <div
            className="d-inline-flex align-items-center gap-1 text-muted small popup-trigger"
            onClick={() => setShowAttachPopup(!showAttachPopup)}
            style={{ cursor: "pointer" }}
          >
            <Folder size={16} />
            첨부파일 <span className="text-primary fw-semibold">{attachments.length}</span>
          </div>

          {showAttachPopup && (
            <div className="attachment-popup shadow-sm border rounded bg-white p-3 mt-2">
              {attachments.map((f, i) => (
                <div key={i} className="d-flex justify-content-between align-items-center" style={{ minWidth: "220px" }}>
                  <a
                    href={f.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-truncate small fw-semibold text-dark text-decoration-none"
                    style={{ maxWidth: "140px" }}
                    title={f.fileName}
                    download
                  >
                    {f.fileName || "첨부파일"}
                  </a>
                  <span className="text-muted mx-2">|</span>
                  <button className="btn btn-link btn-sm p-0 text-decoration-none text-secondary" onClick={() => window.open(f.url, "_blank")}>
                    내PC 저장
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 본문 */}
      <div className="post-body">
        {!editMode ? (
          <p className="post-content" style={{ whiteSpace: "pre-line" }}>{post.content}</p>
        ) : (
          <textarea className="form-control" rows={10} value={editContent} onChange={(e) => setEditContent(e.target.value)} placeholder="내용을 입력하세요" />
        )}
      </div>

      {/* 수정모드 */}
      {editMode && (
        <div className="d-flex justify-content-end gap-3 mt-3 post-actions">
          <button className="btn-ghost" onClick={handleEditSave}>저장</button>
          <button className="btn-ghost btn-ghost-danger" onClick={handleEditCancel}>취소</button>
        </div>
      )}

      {/* 좋아요 & 공유 */}
      {!editMode && (
        <div className="d-flex gap-3 mb-5">
          <button
            className={"btn flex-fill py-2 " + (liked ? "btn-primary text-white" : "btn-outline-primary")}
            onClick={handleLike}
          >
            <HandThumbsUp /> 좋아요 {post.likeCount}
          </button>

          <button className="btn btn-outline-secondary flex-fill py-2" onClick={openShare}>
            <Share /> 공유
          </button>
        </div>
      )}

      {/* 목록으로 */}
      {!editMode && (
        <div className="post-nav mt-4 text-end">
          <div className="list-wrap">
            <button type="button" className="btn btn-outline-secondary btn-list px-4" onClick={() => navigate("/dataroom")}>
              <List className="me-1" /> 목록으로
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataRoomDetail;
