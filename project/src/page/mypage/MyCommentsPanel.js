import { useEffect, useState } from "react";
import { Button, Spinner } from "react-bootstrap";
import { fetchMyComments } from "../../api/commentApi";
import { useNavigate } from "react-router-dom";
import useCustomLogin from "../../hook/useCustomLogin";
import { getCookie } from "../../util/cookieUtil";
import PageComponent from "../../component/common/PageComponent";

export default function MyCommentsPanel() {
  const navigate = useNavigate();
  const { isLogin, moveToLoginReturn } = useCustomLogin();

  // ✅ 항상 같은 순서로 호출되는 Hook들
  const [tokenReady, setTokenReady] = useState(false);
  const [list, setList] = useState([]);
  const [page, setPage] = useState(1); // 1-based
  const size = 10;
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // ✅ 토큰 준비 여부를 마운트 시 1회 결정
  useEffect(() => {
    try {
      const raw = getCookie("member");
      const obj = typeof raw === "string" ? JSON.parse(raw) : raw;
      setTokenReady(!!obj?.accessToken);
    } catch {
      setTokenReady(false);
    }
  }, []);

  // ✅ 데이터 로더 (함수는 컴포넌트 안이지만 Hook 아님)
  const load = async (p = 1) => {
    try {
      setLoading(true);
      const data = await fetchMyComments({ page: p, size }); // 1-based 유지
      setList(data.dtoList || []);
      setTotal(data.totalCount ?? 0);
      setErr("");
    } catch (e) {
      setErr(e?.response?.data?.message || "내 댓글을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ 토큰 준비 후, 그리고 페이지 바뀔 때마다 로드
  useEffect(() => {
    if (!tokenReady) return;
    load(page);
    // page, tokenReady만 의존
  }, [tokenReady, page]);

  // ✅ 로그인 가드 (Hook들 이후에만 early return)
  if (!isLogin) return moveToLoginReturn();

  const totalPages = Math.ceil(total / size);
  const pageData = {
    current: page, // 1-based
    pageNumList: Array.from({ length: totalPages }, (_, i) => i + 1),
    prev: page > 1,
    next: page < totalPages,
  };

  return (
    <>
      {loading && (
        <div className="text-center my-4">
          <Spinner animation="border" />
          <p className="mt-2 text-secondary small">불러오는 중…</p>
        </div>
      )}

      {err && <p className="text-center text-danger mt-4">{err}</p>}

      {!loading && !err && list.length === 0 && (
        <p className="text-center text-muted mt-5">작성한 댓글이 없습니다.</p>
      )}

      <div className="d-flex flex-column gap-3">
        {list.map((c) => (
          <div key={c.commentId} className="p-3 border rounded-3">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <div className="small text-muted mb-1">
                  게시글 #{c.postId} ·{" "}
                  {new Date(c.createdAt).toLocaleString("ko-KR", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
                <div style={{ whiteSpace: "pre-line" }}>{c.content}</div>
              </div>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => navigate(`/boarddetails/${c.postId}`)}
              >
                바로가기
              </Button>
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <PageComponent
          pageData={pageData}
          onPageChange={(zeroBased) => setPage(zeroBased + 1)} // 0->1 보정
        />
      )}
    </>
  );
}