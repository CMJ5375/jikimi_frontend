import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../css/BoardDetail.css";
import CommentSection from "./CommentSection";
import NavModel from "./NavModel";
import ShareModal from "./ShareModal";
import { Eye, HandThumbsUp, Share, Folder, } from "react-bootstrap-icons";
import { getOne, deletePost, getList, updatePost, increaseView, increaseLike } from "../../api/postApi";
import { getCookie } from "../../util/cookieUtil";

// ==== localStorage helpers ====
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

// 조회수 helper
const hasViewed = (postId) => {
  try {
    const raw = localStorage.getItem("VIEWED_POSTS");
    const obj = raw ? JSON.parse(raw) : {};
    return !!obj[postId];
  } catch {
    return false;
  }
};
const markViewed = (postId) => {
  try {
    const raw = localStorage.getItem("VIEWED_POSTS");
    const obj = raw ? JSON.parse(raw) : {};
    obj[postId] = true;
    localStorage.setItem("VIEWED_POSTS", JSON.stringify(obj));
  } catch {}
};

const BoardDetail = () => {
  const { id: idParam } = useParams();
  const navigate = useNavigate();
  const id = Number(idParam || 0);

  // 로그인 사용자 (좋아요 etc)
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
          if (!updatedUsers.includes(usernameForLike))
            updatedUsers.push(usernameForLike);
        } else {
          updatedUsers = updatedUsers.filter(u => u !== usernameForLike);
        }

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
    // 모바일 브라우저 등에서 네이티브 공유 먼저 시도
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareTitle,
          url: pageUrl,
        });
        return;
      } catch {
        /* 사용자가 취소한 경우 등은 무시 */
      }
    }
    // 안 되면 우리 모달 켜기
    setShowShare(true);
  }, [shareTitle, pageUrl]);

  // 날짜 포맷
  const formatted = useMemo(() => {
    if (!post.createdAt) return { date: "", time: "" };
    const d = new Date(post.createdAt);
    return {
      date: d.toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit", }),
      time: d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false, }),
    };
  }, [post.createdAt]);

  // 게시글 로드 + 조회수 증가
  useEffect(() => {
    let ignore = false;

    (async () => {
      setLoading(true);

      // 아직 안 본 글이면 조회수 +1
      if (!hasViewed(id)) {
        try {
          await increaseView(id);
        } catch (e) {
          console.error("increaseView failed", e);
        } finally {
          markViewed(id);
        }
      }

      try {const data = await getOne(id); // /api/posts/{id}

        if (ignore) return;

        // 본문 세팅
        setPost({
          title: data.title ?? "",
          content: data.content ?? "",
          likeCount: data.likeCount ?? 0,
          viewCount: data.viewCount ?? 0,
          createdAt: data.createdAt ?? null,
          authorName:
            (data.authorName ??
              data.userName ??
              `user#${data.userId ?? ""}`).toString(),
          authorUsername: data.authorUsername ?? "",
          fileUrl: data.fileUrl ?? "",
          likedUsernames: Array.isArray(data.likedUsernames) ? data.likedUsernames : [],
        });

        // 첨부파일 세팅 (우린 fileUrl 단일 필드만 쓰므로 배열 1개짜리로)
        if (data.fileUrl && data.fileUrl.trim() !== "") {
          // data.fileUrl = "/files/35/Group.png"
          // 여기서 파일명만 뽑자
          const parts = data.fileUrl.split("/");
          // ["", "files", "35", "Group.png"]
          const fileName = parts[parts.length - 1];   // "Group.png"
          const postIdFromUrl = parts[parts.length - 2]; // "35"

          setAttachments([
            {
              postId: postIdFromUrl,
              fileName: fileName,
            },
          ]);
        } else {
          setAttachments([]);
        }

        // 수정 모드 초기값
        setEditTitle(data.title ?? "");
        setEditContent(data.content ?? "");

        // 좋아요 여부 복원
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

  // 전체 글 개수 (다음글/이전글 계산용)
  useEffect(() => {
    (async () => {
      try {
        const data = await getList({ page: 1, size: 1 });
        setTotalCount(data.totalCount ?? 0);
        console.log(data)
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

  // prev/next id (지금은 단순히 id-1/id+1 로 가정)
  const prevId = id > 1 ? id - 1 : null;
  const nextId = totalCount && id < totalCount ? id + 1 : null;

  // 로그인 사용자 정보 (수정/삭제 권한)
  let loginUsername = null;
  let loginRoles = [];

  const rawMember = getCookie("member");
  if (rawMember) {
    try {
      const parsed =
        typeof rawMember === "string" ? JSON.parse(rawMember) : rawMember;

      loginUsername = parsed?.username || null;

      // roles가 없으면 roleNames, 그것도 없으면 빈 배열
      loginRoles = parsed?.roles || parsed?.roleNames || [];
      if (!Array.isArray(loginRoles)) {
        // 혹시 문자열 하나만 오는 경우도 대비
        loginRoles = [loginRoles].filter(Boolean);
      }

      console.log("DBG front auth:",
        "username=", loginUsername,
        "roles=", loginRoles
      );
    } catch (err) {
      console.error("failed to parse member cookie", err);
    }
  }

  // 작성자인가?
  const isOwner =
    loginUsername &&
    post.authorUsername &&
    loginUsername === post.authorUsername;

  // 관리자냐?
  const isAdmin =
    Array.isArray(loginRoles) &&
    (loginRoles.includes("ROLE_ADMIN") || loginRoles.includes("ADMIN"));

  // 최종 버튼 노출 조건
  const canDelete = isOwner || isAdmin;
  const canEdit = isOwner; // 관리자는 수정 못 하게 할 거라 그 규칙 유지

  // 로딩 스피너
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
          <div className="post-actions d-none d-md-flex">
            {canEdit && (
              <button className="btn-ghost" onClick={handleEditStart}> 수정 </button>
            )}
            {(isOwner || isAdmin) && (
              <button className="btn-ghost btn-ghost-danger" onClick={handleDelete}> 삭제 </button>
            )}
          </div>
        )}
      </div>

      {/* 글 메타 */}
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
                  {/* ✅ 파일명 표시 */}
                  <span
                    className="text-truncate small fw-semibold text-dark"
                    style={{ maxWidth: "140px" }}
                    title={file.fileName} // 마우스 올리면 전체 이름 툴팁으로 보이게
                  >
                    {file.fileName || "(이름 없음)"}
                  </span>

                  <span className="text-muted mx-2">|</span>

                  {/* 다운로드 버튼 */}
                  <button
                    className="btn btn-link btn-sm p-0 text-decoration-none text-secondary"
                    onClick={() => {
                      const downloadUrl = `http://localhost:8080/files/${file.postId}/${file.fileName}`;
                      window.open(downloadUrl, "_blank");
                    }}
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
          ><Share /> 공유
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