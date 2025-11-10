// src/page/support/NoticeDetail.jsx (경로는 네 프로젝트 구조에 맞춰 유지)
import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../css/BoardDetail.css";
import { Eye, HandThumbsUp, Share, List } from "react-bootstrap-icons";
import {
  getSupport,
  removeSupport,
  updateSupport,
  toggleSupportLike,
  getSupportLikeStatus,
} from "../../api/supportApi";
import useCustomLogin from "../../hook/useCustomLogin";
import Avatar from "../board/Avatar";

// ===== 권한 유틸 =====
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
    return value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}
function pickRolesFromAny(user) {
  const bag = [];
  // 상태 내 필드
  bag.push(...normalizeToList(user?.roleNames));
  bag.push(...normalizeToList(user?.roles));
  bag.push(...normalizeToList(user?.authorities));
  // 토큰 payload
  const token = user?.accessToken || user?.token;
  if (token) {
    const p = decodeJwt(token);
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
            ? v.split(",").map((s) => s.trim()).filter(Boolean)
            : v
        )
        .filter(Boolean)
    )
  );
}
function hasAdminRole(roleList) {
  return roleList.some((r) => r === "ADMIN" || r === "ROLE_ADMIN");
}

const NoticeDetail = () => {
  const { id: idParam } = useParams();
  const navigate = useNavigate();
  const id = Number(idParam || 0);
  const type = "notice";

  const { loginState } = useCustomLogin();
  const user = loginState || {};

  // 🔒 관리자 판정 (강화)
  const rolesAll = useMemo(() => pickRolesFromAny(user), [user]);
  const isAdmin = useMemo(() => hasAdminRole(rolesAll), [rolesAll]);

  const [post, setPost] = useState({
    title: "",
    content: "",
    likeCount: 0,
    viewCount: 0,
    createdAt: null,
    name: "",
    authorProfileImage: null,
  });

  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  // 날짜 포맷
  const formatted = useMemo(() => {
    if (!post.createdAt) return { date: "", time: "" };
    const d = new Date(post.createdAt);
    return {
      date: d.toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }),
      time: d.toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
    };
  }, [post.createdAt]);

  // 공지사항 로드
  useEffect(() => {
    if (!id || isNaN(id)) {
      console.warn("잘못된 ID로 접근:", idParam);
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
          authorProfileImage: data.authorProfileImage ?? null,
        });
        setEditTitle(data.title ?? "");
        setEditContent(data.content ?? "");

        if (user?.userId && user?.accessToken) {
          const status = await getSupportLikeStatus({
            type,
            id,
            userId: user.userId,
            token: user.accessToken,
          });
          setLiked(status?.liked ?? false);
        } else {
          setLiked(false);
        }
      } catch (err) {
        console.error("getSupport failed", err);
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [id, user?.userId, user?.accessToken, idParam]);

  // 수정모드
  const handleEditStart = () => setEditMode(true);
  const handleEditCancel = () => {
    setEditMode(false);
    setEditTitle(post.title);
    setEditContent(post.content);
  };

  // 수정
  const handleEditSave = async () => {
    const dto = {
      title: (editTitle || "").trim(),
      content: (editContent || "").trim(),
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
        adminId: user.userId,
        token: user.accessToken,
      });
      alert("수정되었습니다.");
      setPost((prev) => ({ ...prev, ...dto }));
      setEditMode(false);
    } catch (e) {
      console.error(e);
      alert("수정 실패");
    }
  };

  // 삭제
  const handleDelete = async () => {
    if (!isAdmin) return;
    if (!window.confirm("정말 삭제하시겠습니까?")) return;
    try {
      await removeSupport({
        type,
        id,
        adminId: user.userId,
        token: user.accessToken,
      });
      alert("삭제되었습니다.");
      navigate("/notice");
    } catch (e) {
      console.error(e);
      alert("삭제 실패");
    }
  };

  // 좋아요
  const handleLike = async () => {
    if (!user?.userId || !user?.accessToken) {
      alert("로그인이 필요합니다.");
      return;
    }
    try {
      const res = await toggleSupportLike({
        type,
        id,
        userId: user.userId,
        token: user.accessToken,
      });
      setLiked(res?.liked ?? false);
      setPost((prev) => ({
        ...prev,
        likeCount: res?.likeCount ?? prev.likeCount,
      }));
    } catch (err) {
      console.error("좋아요 실패:", err);
      alert("좋아요 처리 중 오류가 발생했습니다.");
    }
  };

  // 공유
  const openShare = useCallback(async () => {
    const pageUrl = typeof window !== "undefined" ? window.location.href : "";
    const shareTitle = post.title || "공지사항";
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
            <button className="btn-ghost" onClick={handleEditStart}>
              수정
            </button>
            <button className="btn-ghost btn-ghost-danger" onClick={handleDelete}>
              삭제
            </button>
          </div>
        )}
      </div>

      {/* 글 메타 */}
      <div className="d-flex justify-content-between align-items-center post-meta mb-3">
        <div className="d-flex align-items-center">
          <Avatar
            src={post.authorProfileImage}
            size={40}
            className="me-2 border border-light shadow-sm"
          />
          <span className="fw-semibold text-dark me-2">{post.name}</span>
          <span>
            {formatted.date} {formatted.time}
          </span>
        </div>
        <div>
          <Eye /> {post.viewCount ?? 0}
        </div>
      </div>

      <hr />

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

      {/* 수정모드 저장/취소 */}
      {editMode && (
        <div className="d-flex justify-content-end gap-3 mt-3 post-actions">
          <button className="btn-ghost" onClick={handleEditSave}>
            저장
          </button>
          <button className="btn-ghost btn-ghost-danger" onClick={handleEditCancel}>
            취소
          </button>
        </div>
      )}

      {/* 좋아요 & 공유 */}
      {!editMode && (
        <div className="d-flex gap-3 mb-5 like-share">
          <button
            className={
              "btn flex-fill py-2 " +
              (liked ? "btn-primary text-white" : "btn-outline-primary")
            }
            onClick={handleLike}
          >
            <HandThumbsUp /> 좋아요 {post.likeCount}
          </button>

          <button
            className="btn btn-outline-secondary flex-fill py-2"
            onClick={openShare}
          >
            <Share /> 공유
          </button>
        </div>
      )}

      {/* 오른쪽 하단 '목록으로' 버튼 */}
      {!editMode && (
        <div className="post-nav mt-4 text-end">
          <div className="list-wrap">
            <button
              type="button"
              className="btn btn-outline-secondary btn-list px-4"
              onClick={() => navigate("/notice")}
            >
              <List className="me-1" /> 목록으로
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NoticeDetail;
