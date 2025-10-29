import React, { useEffect, useMemo, useState } from "react";
import { Button, Spinner } from "react-bootstrap";
import { FaHeart, FaRegCommentDots } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import useCustomLogin from "../../hook/useCustomLogin";
import { getCookie } from "../../util/cookieUtil";
import { fetchMyPosts } from "../../api/postApi";

export default function MyPostsPanel() {
  const navigate = useNavigate();
  const { isLogin, moveToLoginReturn } = useCustomLogin();

  // 토큰 준비 여부 (댓글 패널과 동일 로직)
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

  useEffect(() => {
    if (!tokenReady) return;
    (async () => {
      setLoading(true);
      try {
        const list = await fetchMyPosts();
        setPosts(Array.isArray(list) ? list : []);
        setErr("");
      } catch (e) {
        setErr(e?.response?.data?.message || "내 게시글을 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    })();
  }, [tokenReady]);

  if (!isLogin) {
    return moveToLoginReturn();
  }

  if (loading) {
    return (
      <div className="text-center my-4">
        <Spinner animation="border" />
        <p className="mt-2 text-secondary small">불러오는 중…</p>
      </div>
    );
  }

  if (err) {
    return <p className="text-center text-danger mt-4">{err}</p>;
  }

  if (!posts || posts.length === 0) {
    return (
      <p className="text-center text-secondary small mt-5">
        작성한 게시글이 없습니다.
      </p>
    );
  }

  return (
    <>
      {posts.map((post, idx) => {
        const likeCount =
          post.likeCount ??
          post.likes ??
          post.like?.count ??
          0;
        const commentCount =
          post.commentCount ??
          post.commentsCount ??
          post.comments?.length ??
          0;
        const summary =
          post.summary ??
          (post.content ? String(post.content).slice(0, 100) : "");

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
                <span>
                  <FaHeart /> {likeCount}
                </span>
                <span>
                  <FaRegCommentDots /> {commentCount}
                </span>
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
            {idx < posts.length - 1 && <hr className="divider my-2" />}
          </React.Fragment>
        );
      })}
    </>
  );
}
