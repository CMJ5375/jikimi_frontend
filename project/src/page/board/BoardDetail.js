import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../css/BoardDetail.css";
import CommentSection from "./CommentSection";
import { Eye,HandThumbsUp,Share,ChevronLeft,ChevronRight,List } from "react-bootstrap-icons";
import { getOne, deletePost, getList, updatePost, increaseView, increaseLike } from "../../api/postApi";
import { getCookie } from "../../util/cookieUtil";

// ---- localStorage helpers ----
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

// 조회수 로직
const hasViewed = (postId) => {
  try {
    const raw = localStorage.getItem("VIEWED_POSTS");
    const obj = raw ? JSON.parse(raw) : {};
    return !!obj[postId];
  } catch (err) {
    console.error("hasViewed parse fail", err);
    return false;
  }
};

const markViewed = (postId) => {
  try {
    const raw = localStorage.getItem("VIEWED_POSTS");
    const obj = raw ? JSON.parse(raw) : {};
    obj[postId] = true;
    localStorage.setItem("VIEWED_POSTS", JSON.stringify(obj));
  } catch (err) {
    console.error("markViewed save fail", err);
  }
};

const BoardDetail = () => {
  const { id: idParam } = useParams();
  const navigate = useNavigate();
  const id = Number(idParam || 0);

  // 로그인 쿠키에서 username 추출 (좋아요 API에 보내줄 값)
  const rawCookie = getCookie("member");
  let usernameForLike = null;
  if (rawCookie) {
    try {
      const parsed = typeof rawCookie === "string" ? JSON.parse(rawCookie) : rawCookie;
      usernameForLike = parsed?.username || null;
    } catch (err) {
      console.error("cookie parse fail", err);
    }
  }

  // 게시글 상태
  const [post, setPost] = useState({
    title: "",
    content: "",
    likeCount: 0,
    viewCount: 0,
    createdAt: null,
    authorName: "",
    authorUsername: "", // 작성자 username (백엔드 DTO에서 꼭 내려와야 함!)
  });

  const [liked, setLiked] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // 수정 모드
  const [editMode, setEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  // 공유 모달
  const [showShare, setShowShare] = useState(false);
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
      // res = { likeCount: number, liked: boolean } 라고 가정

      setPost(prev => ({
        ...prev,
        likeCount: res.likeCount ?? prev.likeCount,
      }));
      setLiked(res.liked ?? false);

      // localStorage 동기화
      const likedMap = loadLikedMap();
      likedMap[id] = !!res.liked;
      saveLikedMap(likedMap);

    } catch (e) {
      console.error("like failed", e);
    }
  };

  const openShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareTitle,
          url: pageUrl,
        });
        return;
      } catch (err) {
        // 무시 (취소 등)
      }
    }
    setShowShare(true);
  }, [shareTitle, pageUrl]);

  const copyLink = useCallback(async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(pageUrl);
      } else {
        const ta = document.createElement("textarea");
        ta.value = pageUrl;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      alert("링크가 복사되었습니다.");
      setShowShare(false);
    } catch (e) {
      alert("복사에 실패했습니다. 직접 복사해 주세요.");
    }
  }, [pageUrl]);

  // ESC로 공유모달 닫기
  useEffect(() => {
    if (!showShare) return;
    const onKey = (e) => {
      if (e.key === "Escape") setShowShare(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showShare]);

  // 날짜 포맷
  const formatted = useMemo(() => {
    if (!post.createdAt) return { date: "", time: "" };
    const d = new Date(post.createdAt);
    return {
      date: d.toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" }),
      time: d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false }),
    };
  }, [post.createdAt]);

  // 단건 조회 + 조회수 증가
  useEffect(() => {
    let ignore = false;

    (async () => {
      setLoading(true);

      // 조회수 증가 (localStorage 기반)
      if (!hasViewed(id)) {
        try {
          await increaseView(id);
        } catch (e) {
          console.error("increaseView failed", e);
        } finally {
          markViewed(id);
        }
      }

      try {
        const data = await getOne(id); // 백엔드 /api/posts/{id}

        if (ignore) return;

        setPost({
          title: data.title ?? "",
          content: data.content ?? "",
          likeCount: data.likeCount ?? 0,
          viewCount: data.viewCount ?? 0,
          createdAt: data.createdAt ?? null,
          authorName:
            (data.authorName ?? data.userName ?? `user#${data.userId ?? ""}`).toString(),
          authorUsername: data.authorUsername ?? "", // ★ 작성자 username 받아서 저장
        });

        setEditTitle(data.title ?? "");
        setEditContent(data.content ?? "");

        // 좋아요 상태 복원
        const likedMap = loadLikedMap();
        setLiked(!!likedMap[id]);

      } catch (err) {
        console.error("getOne failed", err);
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    })();

    return () => {
      ignore = true;
    };
  }, [id]);

  // 총 개수(이전/다음 계산용)
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

  // 수정/삭제 핸들러
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
    if (!window.confirm("정말 삭제하시겠습니까?")) return;
    try {
      await deletePost(id);
      alert("게시글이 삭제되었습니다.");
      navigate("/noticeboards");
    } catch (e) {
      console.error(e);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  // 이전/다음 (연속 id 가정)
  const prevId = id > 1 ? id - 1 : null;
  const nextId = totalCount && id < totalCount ? id + 1 : null;

  if (loading) {
    return (
      <div className="container post-detail py-5 text-center text-muted">
        불러오는 중…
      </div>
    );
  }

  // 여기서 현재 로그인한 유저 정보 다시 읽어서 버튼 노출 여부 계산
  let loginUsername = null;
  let loginRoles = [];

  const rawMember = getCookie("member");
  if (rawMember) {
    try {
      const parsed = typeof rawMember === "string" ? JSON.parse(rawMember) : rawMember;
      loginUsername = parsed?.username || null;
      // roles 라는 키가 없고 roleNames로 줄 수도 있으니 둘 다 봄
      loginRoles = parsed?.roles || parsed?.roleNames || [];
    } catch (err) {
      console.error("failed to parse member cookie", err);
    }
  }

  // 내가 이 글 주인인가?
  const isOwner =
    loginUsername &&
    post.authorUsername &&
    loginUsername === post.authorUsername;

  // 나는 관리자 권한인가?
  const isAdmin =
    Array.isArray(loginRoles) &&
    loginRoles.includes("ROLE_ADMIN");


  console.log("DBG loginUsername=", loginUsername,
            "authorUsername=", post.authorUsername,
            "roles=", loginRoles);
  // === JSX ===
  return (
    <div className="container post-detail">
      {/* 상단: 제목 + (보기모드일 때만) 수정/삭제 */}
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
          <div className="post-actions d-none d-md-flex">
            {/* 수정: 글쓴이만 */}
            {isOwner && (
              <button className="btn-ghost" onClick={handleEditStart}>
                수정
              </button>
            )}

            {/* 삭제: 글쓴이 또는 관리자 */}
            {(isOwner || isAdmin) && (
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

      {/* 게시글 번호/메타 */}
      <div className="text-muted small mb-1">
        게시글 {id} / 총 {totalCount}
      </div>
      <div className="d-flex justify-content-between align-items-center post-meta mb-3">
        <div>
          {post.authorName && (
            <span className="fw-semibold text-dark me-2">
              {post.authorName}
            </span>
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

      {/* 수정모드일 때 저장/취소 */}
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

      {/* 좋아요/공유 */}
      {!editMode && (
        <div className="d-flex gap-3 mb-5 like-share">
          <button
            className={
              "btn flex-fill py-2 " +
              (liked
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

      {/* 이전/다음/목록 */}
      {!editMode && (
        <div className="post-nav">
          <div className="nav-row">
            <div className="nav-side">
              <ChevronLeft />
              {prevId ? (
                <span
                  className="nav-link"
                  onClick={() => navigate(`/boarddetails/${prevId}`)}
                >
                  이전글
                </span>
              ) : (
                <span className="empty">이전글이 없습니다</span>
              )}
            </div>
            {prevId && (
              <span
                className="go"
                onClick={() => navigate(`/boarddetails/${prevId}`)}
              >
                이동
              </span>
            )}
          </div>

          <div className="nav-row">
            <div className="nav-side">
              <ChevronRight />
              {nextId ? (
                <span
                  className="nav-link"
                  onClick={() => navigate(`/boarddetails/${nextId}`)}
                >
                  다음글
                </span>
              ) : (
                <span className="empty">다음글이 없습니다</span>
              )}
            </div>
            {nextId && (
              <span
                className="go"
                onClick={() => navigate(`/boarddetails/${nextId}`)}
              >
                이동
              </span>
            )}
          </div>

          <div className="list-wrap">
            <button
              type="button"
              className="btn btn-outline-secondary btn-list px-4"
              onClick={() => navigate("/noticeboards")}
            >
              <List className="me-1" /> 목록으로
            </button>
          </div>
        </div>
      )}

      {/* 공유 모달 */}
      {showShare && (
        <>
          <div
            className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 share-backdrop"
            onClick={() => setShowShare(false)}
          />
          <div
            className="position-fixed top-50 start-50 translate-middle bg-white rounded-3 shadow-lg p-3 p-md-4 share-modal"
            role="dialog"
            aria-modal="true"
          >
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h6 className="m-0">공유하기</h6>
              <button
                type="button"
                className="btn-close"
                aria-label="Close"
                onClick={() => setShowShare(false)}
              />
            </div>

            <div className="small text-muted mb-3">{shareTitle}</div>

            <div className="input-group mb-3">
              <input
                className="form-control"
                readOnly
                value={pageUrl}
                onFocus={(e) => e.target.select()}
              />
              <button className="btn btn-outline-secondary" onClick={copyLink}>
                복사
              </button>
            </div>

            <div className="d-flex gap-2">
              <a
                className="btn btn-outline-primary flex-fill"
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                  shareTitle
                )}&url=${encodeURIComponent(pageUrl)}`}
                target="_blank"
                rel="noreferrer"
              >
                X(트위터)
              </a>
              <a
                className="btn btn-outline-primary flex-fill"
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                  pageUrl
                )}`}
                target="_blank"
                rel="noreferrer"
              >
                페이스북
              </a>
            </div>

            <div className="text-end mt-3">
              <button
                className="btn btn-secondary"
                onClick={() => setShowShare(false)}
              >
                닫기
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default BoardDetail;