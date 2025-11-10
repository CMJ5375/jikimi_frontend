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

/** ===== FAQ와 동일 컨벤션의 권한 유틸 ===== */
function decodeJwt(token) {
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
  if (typeof value === "string") {
    return value.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return [];
}
function pickRolesFromAny(user) {
  const bag = [];
  bag.push(...normalizeToList(user?.roleNames));
  bag.push(...normalizeToList(user?.roles));
  bag.push(...normalizeToList(user?.authorities));
  const token = user?.accessToken || user?.token;
  if (token) {
    const p = decodeJwt(token);
    if (p) {
      bag.push(...normalizeToList(p.roleNames));
      bag.push(...normalizeToList(p.roles));
      bag.push(...normalizeToList(p.authorities));
    }
  }
  return Array.from(new Set(bag.flatMap((v) =>
    typeof v === "string" ? v.split(",").map((s) => s.trim()).filter(Boolean) : v
  ))).filter(Boolean);
}
function hasAdminRole(roleList) {
  return roleList.some((r) => r === "ADMIN" || r === "ROLE_ADMIN");
}

const DataRoomDetail = () => {
  const { id: idParam } = useParams();
  const navigate = useNavigate();
  const id = Number(idParam || 0);
  const type = "dataroom";

  const { loginState } = useCustomLogin();
  const user = loginState || {};
  const token = user?.accessToken || null;

  // FAQ와 동일한 권한 판정
  const rolesAll = useMemo(() => pickRolesFromAny(user), [user]);
  const isAdmin = useMemo(() => hasAdminRole(rolesAll), [rolesAll]);

  // 글 데이터
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

  // 첨부 URL (항상 API 서버 기준)
  const resolvedUrl = useMemo(() => {
    if (post.fileName) {
      return `${API_SERVER_HOST}/uploads/support/${encodeURIComponent(post.fileName)}`;
    }
    if (post.fileUrl) {
      if (post.fileUrl.startsWith("http")) return post.fileUrl;
      const segs = post.fileUrl.split("/");
      const last = segs.pop() || "";
      return `${API_SERVER_HOST}${segs.join("/")}/${encodeURIComponent(last)}`;
    }
    return null;
  }, [post.fileName, post.fileUrl]);

  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [showAttachPopup, setShowAttachPopup] = useState(false);

  // 날짜 포맷
  const formatted = useMemo(() => {
    if (!post.createdAt) return { date: "", time: "" };
    const d = new Date(post.createdAt);
    return {
      date: d.toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" }),
      time: d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false }),
    };
  }, [post.createdAt]);

  /** ===== 게시글 로드 ===== */
  useEffect(() => {
    if (!id || isNaN(id)) {
      console.warn("[DataRoomDetail] 잘못된 ID:", idParam);
      setLoading(false);
      return;
    }
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
        setEditTitle(data.title ?? "");
        setEditContent(data.content ?? "");
      } catch (err) {
        console.error("[DataRoomDetail] getSupport 실패:", err);
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => { ignore = true; };
  }, [id, idParam]);

  /** ===== 좋아요 상태 (FAQ 패턴: 상태값 있으면 사용, 없으면 비활성) ===== */
  useEffect(() => {
    (async () => {
      if (!user?.userId || !token) {
        setLiked(false);
        return;
      }
      try {
        const status = await getSupportLikeStatus({
          type,
          id,
          userId: user.userId,
          token,
        });
        setLiked(status?.liked ?? false);
      } catch (e) {
        console.warn("[DataRoomDetail] like status 실패:", e);
        setLiked(false);
      }
    })();
  }, [id, token, user?.userId]);

  /** ===== 수정/삭제/좋아요 ===== */
  const handleEditStart = () => setEditMode(true);
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
      await updateSupport({
        type,
        id,
        dto,
        adminId: user.userId,           // FAQ와 동일: 훅 값 사용
        token: user.accessToken,
      });
      alert("수정되었습니다.");
      setPost((prev) => ({ ...prev, ...dto }));
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
      await removeSupport({
        type,
        id,
        adminId: user.userId,           // FAQ와 동일
        token: user.accessToken,
      });
      alert("삭제되었습니다.");
      navigate("/dataroom");
    } catch (e) {
      console.error("[DataRoomDetail] 삭제 실패:", e);
      alert("삭제 실패");
    }
  };

  const handleLike = async () => {
    if (!user?.userId || !token) {
      alert("로그인이 필요합니다.");
      return;
    }
    try {
      const res = await toggleSupportLike({
        type,
        id,
        userId: user.userId,           // FAQ와 동일
        token,
      });
      setLiked(res?.liked ?? false);
      setPost((prev) => ({ ...prev, likeCount: res?.likeCount ?? prev.likeCount }));
    } catch (err) {
      console.error("[DataRoomDetail] 좋아요 실패:", err);
      alert("좋아요 처리 중 오류가 발생했습니다.");
    }
  };

  /** ===== 공유 ===== */
  const openShare = useCallback(async () => {
    const pageUrl = typeof window !== "undefined" ? window.location.href : "";
    const shareTitle = post.title || "자료실";
    if (navigator.share) {
      try {
        await navigator.share({ title: shareTitle, text: shareTitle, url: pageUrl });
        return;
      } catch {}
    }
    navigator.clipboard
      .writeText(pageUrl)
      .then(() => alert("링크가 복사되었습니다."))
      .catch(() => alert("복사 실패"));
  }, [post.title]);

  if (loading) {
    return (
      <div className="container post-detail py-5 text-center text-muted">
        불러오는 중…
      </div>
    );
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

      {/* 작성자 / 날짜 / 조회수 */}
      <div className="d-flex justify-content-between align-items-center post-meta mb-3">
        <div className="d-flex align-items-center">
          <Avatar src={post.authorProfileImage} size={40} className="me-2 border border-light shadow-sm" />
          <span className="fw-semibold text-dark me-2">{post.name}</span>
          <span>{formatted.date} {formatted.time}</span>
        </div>
        <div><Eye /> {post.viewCount ?? 0}</div>
      </div>

      <hr />

      {/* 첨부파일 */}
      {(post.fileName || post.fileUrl) && (
        <div className="text-end position-relative mb-3">
          <div
            className="d-inline-flex align-items-center gap-1 text-muted small popup-trigger"
            onClick={() => setShowAttachPopup(!showAttachPopup)}
            style={{ cursor: "pointer" }}
          >
            <Folder size={16} />
            첨부파일 <span className="text-primary fw-semibold">1</span>
          </div>

          {showAttachPopup && (
            <div className="attachment-popup shadow-sm border rounded bg-white p-3 mt-2">
              <div className="d-flex justify-content-between align-items-center" style={{ minWidth: "220px" }}>
                <a
                  href={resolvedUrl || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-truncate small fw-semibold text-dark text-decoration-none"
                  style={{ maxWidth: "140px" }}
                  title={post.fileName}
                  download
                >
                  {post.fileName || "첨부파일"}
                </a>

                <span className="text-muted mx-2">|</span>

                <button
                  className="btn btn-link btn-sm p-0 text-decoration-none text-secondary"
                  onClick={() => {
                    const downloadUrl = `${API_SERVER_HOST}/project/support/${id}/download`;
                    window.location.href = downloadUrl;
                  }}
                >
                  내PC 저장
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 본문 */}
      <div className="post-body">
        {!editMode ? (
          <p className="post-content" style={{ whiteSpace: "pre-line" }}>
            {post.content}
          </p>
        ) : (
          <textarea
            className="form-control"
            rows={10}
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            placeholder="내용을 입력하세요"
          />
        )}
      </div>

      {/* 수정모드 버튼 */}
      {editMode && (
        <div className="d-flex justify-content-end gap-3 mt-3 post-actions">
          <button className="btn-ghost" onClick={handleEditSave}>저장</button>
          <button className="btn-ghost btn-ghost-danger" onClick={handleEditCancel}>취소</button>
        </div>
      )}

      {/* 좋아요 & 공유 */}
      {!editMode && (
        <div className="d-flex gap-3 mb-5 like-share">
          <button
            className={
              "btn flex-fill py-2 " + (liked ? "btn-primary text-white" : "btn-outline-primary")
            }
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
            <button
              type="button"
              className="btn btn-outline-secondary btn-list px-4"
              onClick={() => navigate("/dataroom")}
            >
              <List className="me-1" /> 목록으로
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataRoomDetail;
