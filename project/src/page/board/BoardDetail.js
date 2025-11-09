import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../css/BoardDetail.css";
import CommentSection from "./CommentSection";
import NavModel from "./NavModel";
import ShareModal from "./ShareModal";
import { Eye, HandThumbsUp, Share, Folder } from "react-bootstrap-icons";
import { getOne, deletePost, getList, updatePost, increaseLike } from "../../api/postApi";
import { getCookie } from "../../util/cookieUtil";
import Avatar from "../board/Avatar";

// ==== local helpers ====
// fileUrl이 절대경로(S3)면 그대로, 상대경로면 현재 origin을 붙여 반환
function resolveFileUrl(u) {
  if (!u) return "";
  if (u.startsWith("http")) return u;
  try {
    // 상대 경로를 현재 origin 기준으로 절대화
    const base = typeof window !== "undefined" ? window.location.origin : "";
    return new URL(u, base).toString();
  } catch {
    return u;
  }
}

// fileUrl에서 파일명만 추출
function getFileNameFromUrl(u) {
  if (!u) return "";
  try {
    const url = new URL(u, "http://placeholder");
    const pathname = url.pathname || "";
    const name = pathname.split("/").filter(Boolean).pop() || "";
    return decodeURIComponent(name);
  } catch {
    const parts = String(u).split("/").filter(Boolean);
    return decodeURIComponent(parts.pop() || "");
  }
}

// ==== localStorage helpers (좋아요 로컬 캐시용) ====
const LS_LIKED_KEY = "LIKED_POSTS";
function loadLikedMap() {
  try {
    const raw = localStorage.getItem(LS_LIKED_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}
function saveLikedMap(map) {
  localStorage.setItem(LS_LIKED_KEY, JSON.stringify(map));
}

const BoardDetail = () => {
  const { id: idParam } = useParams();
  const navigate = useNavigate();
  const id = Number(idParam || 0);

  // 로그인 사용자 (좋아요 등)
  const rawCookie = getCookie("member");
  let usernameForLike = null;
  if (rawCookie) {
    try {
      const parsed =
        typeof rawCookie === "string" ? JSON.parse(rawCookie) : rawCookie;
      usernameForLike = parsed?.username || null;
    } catch {}
  }

  // 게시글 상태
  const [post, setPost] = useState({
    title: "",
    content: "",
    likeCount: 0,
    viewCount: 0,
    createdAt: null,
    authorName: "",
    authorUsername: "",
    authorProfileImage: "",
    fileUrl: "",
    likedUsernames: [],
  });

  const [liked, setLiked] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // 수정 모드
  const [editMode, setEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  // 첨부파일 팝업
  const [showAttachPopup, setShowAttachPopup] = useState(false);
  const [attachments, setAttachments] = useState([]);

  // 공유 모달
  const [showShare, setShowShare] = useState(false);

  // 페이지 URL/공유용 제목
  const pageUrl = typeof window !== "undefined" ? window.location.href : "";
  const shareTitle = post.title || "게시글 공유";

  // 좋아요 토글
  const handleLike = async () => {
    if (!usernameForLike) {
      alert("로그인 후 이용 가능합니다.");
      return;
    }
    try {
      const res = await increaseLike(id, usernameForLike);
      // res: { likeCount, liked }
      setPost((prev) => {
        let updatedUsers = [...(prev.likedUsernames || [])];
        if (res.liked) {
          if (!updatedUsers.includes(usernameForLike)) updatedUsers.push(usernameForLike);
        } else {
          updatedUsers = updatedUsers.filter((u) => u !== usernameForLike);
        }
        // 로컬 캐시도 갱신(옵션)
        const map = loadLikedMap();
        if (res.liked) map[id] = true;
        else delete map[id];
        saveLikedMap(map);

        return {
          ...prev,
          likeCount: res.likeCount ?? prev.likeCount,
          likedUsernames: updatedUsers,
        };
      });
    } catch (e) {
      console.error("like failed", e);
    }
  };

  // 공유 버튼 클릭
  const openShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareTitle,
          url: pageUrl,
        });
        return;
      } catch {
        /* 취소 등 무시 */
      }
    }
    setShowShare(true);
  }, [shareTitle, pageUrl]);

  // 날짜 포맷
  const formatted = useMemo(() => {
    if (!post.createdAt) return { date: "", time: "" };
    const d = new Date(post.createdAt);
    return {
      date: d.toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" }),
      time: d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false }),
    };
  }, [post.createdAt]);

  // 게시글 로드 (조회수 증가는 백엔드 GET에서 처리)
  useEffect(() => {
    let ignore = false;
    (async () => {
      setLoading(true);
      try {
        const data = await getOne(id); // GET /api/posts/{id} 내에서 조회수 증가
        if (ignore) return;

        setPost({
          title: data.title ?? "",
          content: data.content ?? "",
          likeCount: data.likeCount ?? 0,
          viewCount: data.viewCount ?? 0,
          createdAt: data.createdAt ?? null,
          authorName:
            (data.authorName ?? data.userName ?? `user#${data.userId ?? ""}`).toString(),
          authorUsername: data.authorUsername ?? "",
          authorProfileImage: data.authorProfileImage ?? "",
          fileUrl: data.fileUrl ?? "",
          likedUsernames: Array.isArray(data.likedUsernames) ? data.likedUsernames : [],
        });

        // 첨부파일 세팅: fileUrl 그대로 사용 (S3 절대/상대 모두 호환)
        if (data.fileUrl && data.fileUrl.trim() !== "") {
          const url = resolveFileUrl(data.fileUrl);
          setAttachments([{ url, fileName: getFileNameFromUrl(url) }]);
        } else {
          setAttachments([]);
        }

        // 수정 모드 초기값
        setEditTitle(data.title ?? "");
        setEditContent(data.content ?? "");

        // 좋아요 여부 로컬 복원 (옵션)
        const likedMap = loadLikedMap();
        setLiked(!!likedMap[id]);
      } catch (err) {
        console.error("getOne failed", err);
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [id]);

  // 전체 글 개수 (다음글/이전글 계산용)
  useEffect(() => {
    (async () => {
      try {
        const data = await getList({ page: 1, size: 1 });
        setTotalCount(data.totalCount ?? 0);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  // 수정/삭제
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
    const payload = {
      title: (editTitle || "").trim(),
      content: (editContent || "").trim(),
      likeCount: post.likeCount ?? 0,
    };
    if (!payload.title) {
      alert("제목을 입력해 주세요.");
      return;
    }
    try {
      await updatePost(id, payload);
      alert("수정되었습니다.");
      navigate("/noticeboards");
    } catch (e) {
      console.error(e);
      alert("수정 중 오류가 발생했습니다.");
    }
  };
  const handleDelete = async () => {
    if (!window.confirm(id + "번 게시물을 정말 삭제하시겠습니까?")) return;
    try {
      await deletePost(id);
      alert("게시글이 삭제되었습니다.");
      navigate("/noticeboards");
    } catch (e) {
      console.error(e);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  // prev/next id (단순 가정: id-1 / id+1)
  const prevId = id > 1 ? id - 1 : null;
  const nextId = totalCount && id < totalCount ? id + 1 : null;

  // 로그인 사용자 정보 (수정/삭제 권한)
  let loginUsername = null;
  let loginRoles = [];
  const rawMember = getCookie("member");
  if (rawMember) {
    try {
      const parsed = typeof rawMember === "string" ? JSON.parse(rawMember) : rawMember;
      loginUsername = parsed?.username || null;
      loginRoles = parsed?.roles || parsed?.roleNames || [];
      if (!Array.isArray(loginRoles)) loginRoles = [loginRoles].filter(Boolean);
      console.log("DBG front auth:", "username=", loginUsername, "roles=", loginRoles);
    } catch (err) {
      console.error("failed to parse member cookie", err);
    }
  }

  const isOwner =
    loginUsername && post.authorUsername && loginUsername === post.authorUsername;
  const isAdmin =
    Array.isArray(loginRoles) &&
    (loginRoles.includes("ROLE_ADMIN") || loginRoles.includes("ADMIN"));

  const canDelete = isOwner || isAdmin;
  const canEdit = isOwner || isAdmin; // 관리자는 수정 불가 규칙 유지

  if (loading) {
    return (
      <div className="container post-detail py-5 text-center text-muted">
        불러오는 중…
      </div>
    );
  }

  return (
    <div className="container post-detail">
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

        {!editMode && (
          <div className="post-actions d-flex">
            {canEdit && (
              <button className="btn-ghost" onClick={handleEditStart}>
                수정
              </button>
            )}
            {canDelete && (
              <button
                className="btn-ghost btn-ghost-danger"
                onClick={handleDelete}
              >
                삭제
              </button>
            )}
          </div>
        )}
      </div>

      {/* 글 메타 */}
      <div className="text-muted small mb-1">
        게시글 {id} / 총 {totalCount}
      </div>
      <div className="d-flex justify-content-between align-items-center post-meta mb-3">
        <div className="d-flex align-items-center">
          <Avatar src={post.authorProfileImage} size={40} className="me-2" />
          {post.authorName && (
            <span className="fw-semibold text-dark me-2">{post.authorName}</span>
          )}
          <span>
            {formatted.date} {formatted.time}
          </span>
        </div>
        <div>
          <Eye /> {post.viewCount ?? 0}
        </div>
      </div>

      <hr />

      {/* 첨부파일 */}
      {attachments.length > 0 && (
        <div className="text-end position-relative mb-3">
          <div
            className="d-inline-flex align-items-center gap-1 text-muted small popup-trigger"
            onClick={() => setShowAttachPopup(!showAttachPopup)}
            style={{ cursor: "pointer" }}
          >
            <Folder size={16} />
            첨부파일{" "}
            <span className="text-primary fw-semibold">
              {attachments.length}
            </span>
          </div>

          {showAttachPopup && (
            <div className="attachment-popup shadow-sm border rounded bg-white p-3 mt-2">
              {attachments.map((file, index) => (
                <div
                  key={index}
                  className="d-flex justify-content-between align-items-center"
                  style={{ minWidth: "220px" }}
                >
                  <span
                    className="text-truncate small fw-semibold text-dark"
                    style={{ maxWidth: "140px" }}
                    title={file.fileName}
                  >
                    {file.fileName || "(이름 없음)"}
                  </span>

                  <span className="text-muted mx-2">|</span>

                  <button
                    className="btn btn-link btn-sm p-0 text-decoration-none text-secondary"
                    onClick={() => window.open(file.url, "_blank")}
                  >
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
          <button
            className="btn-ghost btn-ghost-danger"
            onClick={handleEditCancel}
          >
            취소
          </button>
        </div>
      )}

      {/* 좋아요 & 공유 버튼 */}
      {!editMode && (
        <div className="d-flex gap-3 mb-5 like-share">
          <button
            className={
              "btn flex-fill py-2 " +
              (post.likedUsernames?.includes(usernameForLike)
                ? "btn-primary text-white"
                : "btn-outline-primary")
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

      {/* 댓글 */}
      <CommentSection postId={id} hidden={editMode} />

      {/* 이전글 / 다음글 / 목록으로 */}
      {!editMode && (
        <NavModel
          prevId={prevId}
          nextId={nextId}
          totalCount={totalCount}
          onGoPrev={() => prevId && navigate(`/boarddetails/${prevId}`)}
          onGoNext={() => nextId && navigate(`/boarddetails/${nextId}`)}
          onGoList={() => navigate("/noticeboards")}
        />
      )}

      {/* 공유 모달 */}
      <ShareModal
        show={showShare}
        onClose={() => setShowShare(false)}
        shareTitle={shareTitle}
        pageUrl={pageUrl}
      />
    </div>
  );
};

export default BoardDetail;
