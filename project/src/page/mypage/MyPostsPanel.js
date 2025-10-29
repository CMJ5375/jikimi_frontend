import React, { useEffect, useMemo, useState } from "react";
import { Spinner } from "react-bootstrap";
import { FaHeart, FaRegCommentDots } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import useCustomLogin from "../../hook/useCustomLogin";
import { getCookie } from "../../util/cookieUtil";
import { fetchMyPosts } from "../../api/postApi";
import PageComponent from "../../component/common/PageComponent";

export default function MyPostsPanel({ pageSize = 10 }) {
  const navigate = useNavigate();
  const { isLogin, moveToLoginReturn } = useCustomLogin();

  // 토큰 준비 여부
  const tokenReady = useMemo(() => {
    try {
      const raw = getCookie("member");
      const obj = typeof raw === "string" ? JSON.parse(raw) : raw;
      return !!obj?.accessToken;
    } catch {
      return false;
    }
  }, []);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1); // 1-based

  useEffect(() => {
    if (!tokenReady) return;
    (async () => {
      setLoading(true);
      try {
        const list = await fetchMyPosts(); // 전체 목록 한 번에
        setPosts(Array.isArray(list) ? list : []);
        setErr("");
      } catch (e) {
        setErr(e?.response?.data?.message || "내 게시글을 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    })();
  }, [tokenReady]);

  // 로그인 가드
  if (!isLogin) return moveToLoginReturn();

  if (loading) {
    return (
      <div className="text-center my-4">
        <Spinner animation="border" />
        <p className="mt-2 text-secondary small">불러오는 중…</p>
      </div>
    );
  }

  if (err) return <p className="text-center text-danger mt-4">{err}</p>;

  if (!posts || posts.length === 0) {
    return (
      <p className="text-center text-secondary small mt-5">
        작성한 게시글이 없습니다.
      </p>
    );
  }

  // --- 클라이언트 페이징 ---
  const totalPages = Math.ceil(posts.length / pageSize);
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const visible = posts.slice(start, end);

  const pageData = {
    current: page, // 1-based
    pageNumList: Array.from({ length: totalPages }, (_, i) => i + 1),
    prev: page > 1,
    next: page < totalPages,
  };

  return (
    <>
      {visible.map((post, idx) => {
        const likeCount =
          post.likeCount ?? post.likes ?? post.like?.count ?? 0;
        const commentCount =
          post.commentCount ?? post.commentsCount ?? post.comments?.length ?? 0;
        const summary =
          post.summary ?? (post.content ? String(post.content).slice(0, 100) : "");

        return (
          <React.Fragment key={post.postId ?? idx}>
            <div
              className="list-item p-3"
              onClick={() => navigate(`/boarddetails/${post.postId}`)}
              style={{ cursor: "pointer" }}
            >
              <strong>{post.title ?? "제목 없음"}</strong>
              <p className="text-muted mb-2">{summary}</p>
              <div className="d-flex gap-3 text-muted">
                <span><FaHeart /> {likeCount}</span>
                <span><FaRegCommentDots /> {commentCount}</span>
              </div>
              {post.createdAt && (
                <div className="small text-muted mt-1">
                  {new Date(post.createdAt).toLocaleString("ko-KR", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              )}
            </div>
            {idx < visible.length - 1 && <hr className="divider my-2" />}
          </React.Fragment>
        );
      })}

      {totalPages > 1 && (
        <PageComponent
          pageData={pageData}
          onPageChange={(zeroBased) => setPage(zeroBased + 1)} // 0->1 보정
        />
      )}
    </>
  );
}
