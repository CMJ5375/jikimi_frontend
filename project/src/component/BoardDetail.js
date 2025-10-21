import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./BoardDetail.css";
import {
  Eye,
  HandThumbsUp,
  Share,
  ThreeDots,
  ChevronLeft,
  ChevronRight,
  List,
} from "react-bootstrap-icons";
import { getOne, deletePost, getList } from "../api/postApi";

const BoardDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [post, setPost] = useState({
    title: "",
    content: "",
    likeCount: 0,
    createdAt: null,
    userName: "",
  });
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // 날짜 포맷
  const formatted = useMemo(() => {
    if (!post.createdAt) return { date: "", time: "" };
    const d = new Date(post.createdAt);
    const date = d.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const time = d.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    return { date, time };
  }, [post.createdAt]);

  // 게시글 불러오기
  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        setLoading(true);
        const data = await getOne(id);
        if (!ignore) {
          setPost({
            title: data.title ?? "",
            content: data.content ?? "",
            likeCount: data.likeCount ?? 0,
            createdAt: data.createdAt ?? null,
            userName: data.userName ?? "",
          });
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => (ignore = true);
  }, [id]);

  // 전체 게시글 수
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

  // 수정 / 삭제
  const handleEdit = () =>
    navigate(`/boardCreats?id=${id}`, { state: { mode: "edit", post } });

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

  // 이전글 / 다음글 계산
  const prevId = parseInt(id) > 1 ? parseInt(id) - 1 : null;
  const nextId =
    totalCount && parseInt(id) < totalCount ? parseInt(id) + 1 : null;

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
        <h3 className="fw-bold post-title">{post.title}</h3>
        <div className="d-none d-md-flex post-actions">
          <button className="btn-ghost" onClick={handleEdit}>
            수정
          </button>
          <button className="btn-ghost btn-ghost-danger" onClick={handleDelete}>
            삭제
          </button>
        </div>
      </div>

      {/* 게시글 번호 */}
      <div className="text-muted small mb-1">
        게시글 {id} / 총 {totalCount}
      </div>

      {/* 메타정보 */}
      <div className="d-flex justify-content-between align-items-center post-meta mb-3">
        <div>
          {post.userName && (
            <span className="fw-semibold text-dark me-2">{post.userName}</span>
          )}
          <span>
            {formatted.date} {formatted.time}
          </span>
        </div>
        <div>
          <Eye /> 0
        </div>
      </div>

      <hr />

      {/* 본문 */}
      <div className="post-body">
        <p className="post-content" style={{ whiteSpace: "pre-line" }}>
          {post.content}
        </p>
      </div>

      {/* 좋아요 & 공유 */}
      <div className="d-flex gap-3 mb-5 like-share">
        <button className="btn btn-outline-primary flex-fill py-2">
          <HandThumbsUp /> 좋아요 {post.likeCount}
        </button>
        <button className="btn btn-outline-secondary flex-fill py-2">
          <Share /> 공유
        </button>
      </div>

      {/* 모바일 수정/삭제 */}
      <div className="d-flex d-md-none justify-content-end gap-2 mt-2 pe-2 post-actions">
        <button className="btn-ghost small" onClick={handleEdit}>
          글수정
        </button>
        <button className="btn-ghost btn-ghost-danger small" onClick={handleDelete}>
          삭제
        </button>
      </div>

      {/* 댓글 */}
      <h6 className="fw-bold mb-3 mt-4">댓글 2</h6>
      <div className="comment-input d-flex mb-4">
        <div className="profile-img bg-light me-2"></div>
        <input
          type="text"
          className="form-control"
          placeholder="댓글을 입력하세요..."
        />
      </div>

      <div className="comment-list">
        {[
          {
            id: 1,
            author: "프로단식러",
            datetime: "2025.09.22 23:57",
            text: "힘내세요. 저도 간경화 진단 받고나서는 회식 참여 전혀 안했어요. 영업직은 힘들지만 건강이 최우선이에요!",
          },
          {
            id: 2,
            author: "희망찬직장인",
            datetime: "2025.09.23 09:15",
            text: "저도 비슷한 경험이 있었는데 식습관 바꾸고 운동하니 좋아졌어요!",
          },
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
              <button className="btn btn-link text-secondary p-0">
                <ThreeDots />
              </button>
            </div>
            <p className="mt-2 mb-0 p-2">{c.text}</p>
          </div>
        ))}
      </div>

      {/* 이전글 / 다음글 / 목록으로 */}
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
    </div>
  );
};

export default BoardDetail;