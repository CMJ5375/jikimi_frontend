import { useEffect, useState } from "react";
import { Button, Pagination } from "react-bootstrap";
import { fetchMyComments } from "../../api/commentApi";
import { useNavigate } from "react-router-dom";

export default function MyCommentsPanel() {
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [page, setPage] = useState(1);
  const size = 10;
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const load = async (p=1) => {
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

  useEffect(() => { load(page); }, [page]);

  const totalPages = Math.ceil(total / size);

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
                  게시글 #{c.postId} · {new Date(c.createdAt).toLocaleString("ko-KR",{year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"})}
                </div>
                <div style={{ whiteSpace: "pre-line" }}>{c.content}</div>
              </div>
              <Button variant="outline-secondary" size="sm" onClick={() => navigate(`/boarddetails/${c.postId}`)}>
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
