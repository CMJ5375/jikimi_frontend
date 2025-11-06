import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../css/BoardDetail.css";
import { Eye, HandThumbsUp, Share, Folder, List } from "react-bootstrap-icons";
import { getSupport, removeSupport, updateSupport, toggleSupportLike, getSupportLikeStatus } from "../../api/supportApi";
import useCustomLogin from "../../hook/useCustomLogin";

const DataRoomDetail = () => {
  const { id: idParam } = useParams();
  const navigate = useNavigate();
  const id = Number(idParam || 0);
  const type = "dataroom";

  const { loginState } = useCustomLogin();
  const user = loginState || {};
  const roles = user?.roleNames || user?.roles || [];
  const isAdmin =
    Array.isArray(roles) && roles.some((r) => r === "ADMIN" || r === "ROLE_ADMIN");

  const [post, setPost] = useState({
    title: "",
    content: "",
    likeCount: 0,
    viewCount: 0,
    createdAt: null,
    name: "",
    fileName: "",
    fileUrl: "",
  });

  //첨부파일 다운로드 3000번으로 열리는거 문제
  const apiBase = process.env.REACT_APP_API_BASE_URL || "http://localhost:8080";

  const resolvedUrl = useMemo(() => {
    // 1순위: fileName이 있으면 fileName으로 안전하게 만들기(권장)
    if (post.fileName) {
      return `${apiBase}/uploads/support/${encodeURIComponent(post.fileName)}`;
    }
    // 2순위: fileUrl이 저장돼 있으면 그것도 보정
    if (post.fileUrl) {
      // 절대 URL이면 그대로, 상대면 apiBase 붙이고 마지막 파일명만 인코딩
      if (post.fileUrl.startsWith("http")) return post.fileUrl;
      const segs = post.fileUrl.split("/");
      const last = segs.pop() || "";
      return `${apiBase}${segs.join("/")}/${encodeURIComponent(last)}`;
    }
    return null;
  }, [post.fileName, post.fileUrl, apiBase]);

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

  // 게시글 로드
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
          fileName: data.fileName ?? "",
          fileUrl: data.fileUrl ?? "",
        });
        setEditTitle(data.title ?? "");
        setEditContent(data.content ?? "");

        if (user?.userId) {
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
  }, [id, user?.userId]);

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
      navigate("/dataroom");
    } catch (e) {
      console.error(e);
      alert("삭제 실패");
    }
  };

  // 좋아요
  const handleLike = async () => {
    if (!user?.userId) {
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
      setPost((prev) => ({ ...prev, likeCount: res?.likeCount ?? prev.likeCount }));
    } catch (err) {
      console.error("좋아요 실패:", err);
      alert("좋아요 처리 중 오류가 발생했습니다.");
    }
  };

  // 공유
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
          <div className="post-actions d-none d-md-flex">
            <button className="btn-ghost" onClick={handleEditStart}>
              수정
            </button>
            <button className="btn-ghost btn-ghost-danger" onClick={handleDelete}>
              삭제
            </button>
          </div>
        )}
      </div>

      {/* 작성자 / 날짜 / 조회수 */}
      <div className="d-flex justify-content-between align-items-center post-meta mb-3">
        <div>
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

      {/* 첨부파일 */}
      {(post.fileName || post.fileUrl) && (
        <div className="text-end position-relative mb-3">
          <div
            className="d-inline-flex align-items-center gap-1 text-muted small popup-trigger"
            onClick={() => setShowAttachPopup(!showAttachPopup)}
            style={{ cursor: "pointer" }}
          >
            <Folder size={16} />
            첨부파일{" "}
            <span className="text-primary fw-semibold">1</span>
          </div>

          {showAttachPopup && (
            <div className="attachment-popup shadow-sm border rounded bg-white p-3 mt-2">
              <div
                className="d-flex justify-content-between align-items-center"
                style={{ minWidth: "220px" }}
              >
                <a
                  href={resolvedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-truncate small fw-semibold text-dark text-decoration-none"
                  style={{ maxWidth: "140px" }}
                  title={post.fileName}
                  download // ← 저장 대화상자 띄우고 싶으면 추가
                >
                  {post.fileName || "첨부파일"}
                </a>

                <span className="text-muted mx-2">|</span>

                <button
                  className="btn btn-link btn-sm p-0 text-decoration-none text-secondary"
                  onClick={() => {
                    const apiBase = process.env.REACT_APP_API_BASE_URL || "";
                    const downloadUrl = `${apiBase}/project/support/${id}/download`;
                    window.location.href = downloadUrl; // 브라우저가 바로 다운로드 처리
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

      {/* '목록으로' 버튼 */}
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