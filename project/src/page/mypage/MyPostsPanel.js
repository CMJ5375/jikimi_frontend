import React, { useEffect, useState } from "react";
import { Spinner } from "react-bootstrap";
import { FaHeart, FaRegCommentDots } from "react-icons/fa";

// 옵션:
// - fetcher: (async ({page, size}) => { posts: [], totalPages: n }) 형태로 주면 API 연동 모드
// - pageSize: 페이지당 개수 (기본 10)
export default function MyPostsPanel({ fetcher = null, pageSize = 10 }) {
  const [loading, setLoading] = useState(!!fetcher); // fetcher 없으면 바로 렌더
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1); // 1-based
  const [totalPages, setTotalPages] = useState(1);

  // 처음엔 더미 표시(네가 쓰던 느낌 그대로)
  useEffect(() => {
    if (!fetcher) {
      setPosts([
        {
          postId: 1,
          title: "간경화 진단을 받았습니다..",
          summary: "최근 회식이 잦긴 했는데 이렇게 갑자기...",
          likeCount: 25,
          commentCount: 11,
        },
        {
          postId: 2,
          title: "간경화 진단을 받았습니다..",
          summary: "최근 회식이 잦긴 했는데 이렇게 갑자기...",
          likeCount: 25,
          commentCount: 11,
        },
      ]);
      setTotalPages(1);
      return;
    }

    // fetcher가 있으면 API로 교체
    (async () => {
      setLoading(true);
      try {
        const res = await fetcher({ page: page - 1, size: pageSize }); // page-1: 0-based 서버 대비
        // 기대 형태: { posts: [], totalPages: n }
        setPosts(res?.posts ?? []);
        setTotalPages(res?.totalPages ?? 1);
      } finally {
        setLoading(false);
      }
    })();
  }, [fetcher, page, pageSize]);

  if (loading) {
    return (
      <div className="text-center my-4">
        <Spinner animation="border" />
        <p className="mt-2 text-secondary small">불러오는 중…</p>
      </div>
    );
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
      {posts.map((post, idx) => (
        <React.Fragment key={post.postId ?? idx}>
          <div className="list-item p-3">
            <strong>{post.title ?? "제목 없음"}</strong>
            <p className="text-muted mb-2">
              {post.summary ?? post.content?.slice(0, 100) ?? ""}
            </p>
            <div className="d-flex gap-3 text-muted">
              <span>
                <FaHeart /> {post.likeCount ?? 0}
              </span>
              <span>
                <FaRegCommentDots /> {post.commentCount ?? 0}
              </span>
            </div>
          </div>
          {idx < posts.length - 1 && <hr className="divider my-2" />}
        </React.Fragment>
      ))}

      {/* 간단 페이지네이션 (더미/간단 용) */}
      {totalPages > 1 && (
        <ul className="pagination justify-content-center mt-4">
          {Array.from({ length: totalPages }).map((_, i) => (
            <li
              key={i}
              className={`page-item ${page === i + 1 ? "active" : ""}`}
            >
              <button className="page-link" onClick={() => setPage(i + 1)}>
                {i + 1}
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
