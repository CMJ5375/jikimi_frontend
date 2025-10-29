import { useEffect, useMemo, useState } from "react";
import { Button, Pagination } from "react-bootstrap";
import { fetchMyComments } from "../../api/commentApi";
import { useNavigate } from "react-router-dom";
import useCustomLogin from "../../hook/useCustomLogin";
import { getCookie } from "../../util/cookieUtil";

export default function MyCommentsPanel() {
  const navigate = useNavigate();

  // 1) 로그인 가드
  const { isLogin, moveToLoginReturn } = useCustomLogin();

  // 2) accessToken 준비 여부 확인 (쿠키가 문자열로 들어오는 경우 대비)
  const tokenReady = useMemo(() => {
    try {
      const raw = getCookie("member");
      const obj = typeof raw === "string" ? JSON.parse(raw) : raw;
      return !!obj?.accessToken;
    } catch {
      return false;
    }
  }, []);

  const [list, setList] = useState([]);
  const [page, setPage] = useState(1);
  const size = 10;
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const load = async (p = 1) => {
    try {
      setLoading(true);
      const data = await fetchMyComments({ page: p, size });
      setList(data.dtoList || []);
      setTotal(data.totalCount ?? 0);
      setErr("");
    } catch (e) {
      setErr(e?.response?.data?.message || "내 댓글을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 3) 토큰이 준비된 뒤에만 로드
  useEffect(() => {
    if (tokenReady) {
      load(page);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenReady, page]);

  const totalPages = Math.ceil(total / size);
  if (!isLogin) return moveToLoginReturn();

  return (
    <>
      {loading && <p className="text-center text-muted mt-4">불러오는 중…</p>}
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
                  게시글 #{c.postId} · {new Date(c.createdAt).toLocaleString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
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
        <div className="d-flex justify-content-center mt-4">
          <Pagination className="custom-pagination">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Pagination.Item key={p} active={page === p} onClick={() => setPage(p)}>
                {p}
              </Pagination.Item>
            ))}
          </Pagination>
        </div>
      )}
    </>
  );
}