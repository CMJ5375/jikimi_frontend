import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import '../../css/BoardDetail.css';
import { Eye,HandThumbsUp,Share,ThreeDots,ChevronLeft,ChevronRight,List, } from "react-bootstrap-icons";
import { getOne, deletePost, getList, updatePost } from "../../api/postApi";

const BoardDetail = () => {
  const { id: idParam } = useParams();
  const navigate = useNavigate();
  const id = Number(idParam || 0);

  const [post, setPost] = useState({
    title: "",
    content: "",
    likeCount: 0,
    createdAt: null,
    userName: "",
  });
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // 수정 모드 & 입력값
  const [editMode, setEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  // 날짜 포맷
  const formatted = useMemo(() => {
    if (!post.createdAt) return { date: "", time: "" };
    const d = new Date(post.createdAt);
    return {
      date: d.toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" }),
      time: d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false }),
    };
  }, [post.createdAt]);

  // 단건 조회
  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        setLoading(true);
        const data = await getOne(id);
        if (ignore) return;
        setPost({
          title: data.title ?? "",
          content: data.content ?? "",
          likeCount: data.likeCount ?? 0,
          createdAt: data.createdAt ?? null,
          userName: data.userName ?? "",
        });
        setEditTitle(data.title ?? "");
        setEditContent(data.content ?? "");
      } catch (e) {
        console.error(e);
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => { ignore = true; };
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
    return <div className="container post-detail py-5 text-center text-muted">불러오는 중…</div>;
  }

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
            <button className="btn-ghost" onClick={handleEditStart}>수정</button>
            <button className="btn-ghost btn-ghost-danger" onClick={handleDelete}>삭제</button>
          </div>
        )}
      </div>

      {/* 게시글 번호/메타 */}
      <div className="text-muted small mb-1">게시글 {id} / 총 {totalCount}</div>
      <div className="d-flex justify-content-between align-items-center post-meta mb-3">
        <div>
          {post.userName && <span className="fw-semibold text-dark me-2">{post.userName}</span>}
          <span>{formatted.date} {formatted.time}</span>
        </div>
        <div><Eye /> 0</div>
      </div>

      <hr />

      {/* 본문 */}
      <div className="post-body">
        {!editMode ? (
          <p className="post-content" style={{ whiteSpace: "pre-line" }}>{post.content}</p>
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

      {/* ↓↓↓ 여기! 수정모드일 때만 하단에 저장/취소 표시 ↓↓↓ */}
      {editMode && (
        <div className="d-flex justify-content-end gap-3 mt-3 post-actions">
          <button className="btn-ghost" onClick={handleEditSave}>저장</button>
          <button className="btn-ghost btn-ghost-danger" onClick={handleEditCancel}>취소</button>
        </div>
      )}

      {/* 좋아요/공유 (수정모드 숨김) */}
      {!editMode && (
        <div className="d-flex gap-3 mb-5 like-share">
          <button className="btn btn-outline-primary flex-fill py-2">
            <HandThumbsUp /> 좋아요 {post.likeCount}
          </button>
          <button className="btn btn-outline-secondary flex-fill py-2">
            <Share /> 공유
          </button>
        </div>
      )}

      {/* 댓글 (수정모드 숨김) */}
      {!editMode && (
        <>
          <h6 className="fw-bold mb-3 mt-4">댓글 2</h6>
          <div className="comment-input d-flex mb-4">
            <div className="profile-img bg-light me-2"></div>
            <input type="text" className="form-control" placeholder="댓글을 입력하세요..." />
          </div>

          <div className="comment-list">
            {[
              { id: 1, author: "프로단식러", datetime: "2025.09.22 23:57", text: "힘내세요. 저도 간경화 진단 받고나서는 회식 참여 전혀 안했어요. 영업직은 힘들지만 건강이 최우선이에요!" },
              { id: 2, author: "희망찬직장인", datetime: "2025.09.23 09:15", text: "저도 비슷한 경험이 있었는데 식습관 바꾸고 운동하니 좋아졌어요!" },
            ].map((c) => (
              <div key={c.id} className="comment-box mb-3">
                <div className="d-flex justify-content-between align-items-start">
                  <div className="d-flex align-items-start">
                    <div className="profile-img bg-light me-2"></div>
                    <div>
                      <div className="fw-semibold">{c.author}</div>
                      <div className="text-muted small">{c.datetime}</div>
                    </div>
                  </div>
                  <button className="btn btn-link text-secondary p-0"><ThreeDots /></button>
                </div>
                <p className="mt-2 mb-0 p-2">{c.text}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {/* 이전/다음/목록 (수정모드 숨김) */}
      {!editMode && (
        <div className="post-nav">
          <div className="nav-row">
            <div className="nav-side">
              <ChevronLeft />
              {prevId ? (
                <span className="nav-link" onClick={() => navigate(`/boarddetails/${prevId}`)}>
                  이전글
                </span>
              ) : (
                <span className="empty">이전글이 없습니다</span>
              )}
            </div>
            {prevId && <span className="go" onClick={() => navigate(`/boarddetails/${prevId}`)}>이동</span>}
          </div>

          <div className="nav-row">
            <div className="nav-side">
              <ChevronRight />
              {nextId ? (
                <span className="nav-link" onClick={() => navigate(`/boarddetails/${nextId}`)}>
                  다음글
                </span>
              ) : (
                <span className="empty">다음글이 없습니다</span>
              )}
            </div>
            {nextId && <span className="go" onClick={() => navigate(`/boarddetails/${nextId}`)}>이동</span>}
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
    </div>
  );
};

export default BoardDetail;