import { useEffect, useMemo, useState } from "react";
import "../../css/BoardDetail.css";
import { fetchComments, addComment, updateComment, deleteComment } from "../../api/commentApi";
import { ThreeDots } from "react-bootstrap-icons";
import { getCookie } from "../../util/cookieUtil";
import Avatar from "./Avatar";

// Base64URL 디코더
const b64urlDecode = (s) => {
  try {
    const pad = '='.repeat((4 - (s.length % 4)) % 4);
    const base64 = (s + pad).replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
};

// JWT에서 claim 꺼내기 (없으면 null)
const parseJwtClaims = (token) => {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  return b64urlDecode(parts[1]);
};

// 내 정보 추출: 쿠키(member) + accessToken(claim)
const useCurrentUser = () => {
  return useMemo(() => {
    // 1) 쿠키 파싱
    const raw = getCookie("member");
    let member = null;
    try {
      member = typeof raw === "string" ? JSON.parse(raw) : raw;
    } catch {
      member = raw || null;
    }

    // 2) JWT claim 파싱
    const accessToken = member?.accessToken;
    const claims = parseJwtClaims(accessToken) || {};

    const profileImage = member?.profileImage ?? claims?.profileImage ?? null;

    // 3) 후보 키들에서 뽑아내기
    const idCandidate =
      member?.userId ??
      member?.id ??
      member?.memberId ??
      member?.uid ??
      claims?.userId ??
      claims?.uid ??
      claims?.id ??
      null;

    const usernameCandidate =
      member?.username ??
      claims?.username ??
      claims?.sub ?? // 보통 sub에 username 들어가기도 함
      null;

    const nameCandidate = member?.name ?? claims?.name ?? null;

    // 이메일 앞부분 (authorName이 이메일 앞부분으로 내려올 수 있음)
    const email = member?.email ?? claims?.email ?? null;
    const emailLocal = email ? String(email).split('@')[0] : null;

    return {
      id: idCandidate != null ? Number(idCandidate) : null,
      username: usernameCandidate ? String(usernameCandidate) : null,
      name: nameCandidate ? String(nameCandidate) : null,
      emailLocal: emailLocal ? String(emailLocal) : null,
      profileImage,
    };
  }, []);
};

export default function CommentSection({ postId, hidden = false }) {
  const [comments, setComments] = useState([]);
  const [pageInfo, setPageInfo] = useState({ page: 1, size: 20, totalCount: 0 });
  const [input, setInput] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [pressing, setPressing] = useState(false); //버튼 깜빡임

  // 내 정보
  const me = useCurrentUser();

  // 날짜 포맷
  const fmt = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    const P = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}.${P(d.getMonth() + 1)}.${P(d.getDate())} ${P(d.getHours())}:${P(d.getMinutes())}`;
  };

  // 목록 로드
  const load = async (p = 1) => {
    try {
      setLoading(true);
      const data = await fetchComments(postId, { page: p, size: pageInfo.size });
      setComments(data.dtoList || []);
      setPageInfo((prev) => ({
        ...prev,
        page: data.page ?? p,
        size: data.size ?? prev.size,
        totalCount: data.totalCount ?? 0,
      }));
      setErr("");
    } catch (e) {
      setErr(e?.response?.data?.message || "댓글을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!hidden && postId) load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hidden, postId]);

  // 등록
  const submit = async () => {
    if (!input.trim()) return;
    try {
      await addComment(postId, input.trim());
      setInput("");
      await load(1); // 최신순 갱신
    } catch (e) {
      const msg =
        e?.response?.status === 401 ? "인증이 필요합니다."
        : e?.response?.status === 403 ? "댓글 등록 권한이 없습니다."
        : e?.response?.data?.message || "댓글 등록에 실패했습니다.";
      setErr(msg);
    }
  };

  // 수정
  const startEdit = (c) => {
    setEditingId(c.commentId);
    setEditingText(c.content);
  };
  const cancelEdit = () => {
    setEditingId(null);
    setEditingText("");
  };
  const saveEdit = async (c) => {
    if (!editingText.trim()) return;
    try {
      await updateComment(postId, c.commentId, editingText.trim());
      setComments((prev) =>
        prev.map((x) => (x.commentId === c.commentId ? { ...x, content: editingText } : x))
      );
      cancelEdit();
      setErr("");
    } catch (e) {
      const msg =
        e?.response?.status === 403 ? "본인 댓글만 수정할 수 있습니다."
        : e?.response?.status === 401 ? "인증이 필요합니다."
        : e?.response?.data?.message || "댓글 수정에 실패했습니다.";
      setErr(msg);
    }
  };

  // 삭제
  const removeOne = async (c) => {
    if (!window.confirm("댓글을 삭제하시겠습니까?")) return;
    try {
      await deleteComment(postId, c.commentId);
      setComments((prev) => prev.filter((x) => x.commentId !== c.commentId));
      setErr("");
    } catch (e) {
      const msg =
        e?.response?.status === 403 ? "본인 댓글만 삭제할 수 있습니다."
        : e?.response?.status === 401 ? "인증이 필요합니다."
        : e?.response?.data?.message || "댓글 삭제에 실패했습니다.";
      setErr(msg);
    }
  };

  // 내 댓글 판별: 1) userId 일치(숫자 비교) → 2) username/name/emailLocal이 authorName과 일치
  const isMine = (c) => {
    if (me.id != null && c.userId != null && Number(c.userId) === Number(me.id)) return true;
    const author = (c.authorName || "").trim();
    if (!author) return false;
    if (me.username && author === String(me.username)) return true;
    if (me.name && author === String(me.name)) return true;
    if (me.emailLocal && author === String(me.emailLocal)) return true;
    return false;
  };

  if (hidden) return null;

  return (
    <>
      <h6 className="fw-bold mb-3 mt-4">댓글 {pageInfo.totalCount ?? comments.length}</h6>

      {/* 입력창: 로그인 전용 게시판이라 항상 활성화 */}
      <div className="comment-input d-flex mb-4">
        {/* 프로필 (정사각형, 동그라미, 찌그러지지 않게) */}
        <Avatar src={me.profileImage} size={40} className="me-2" />
        
        <input
          type="text"
          className="form-control"
          placeholder="댓글을 입력하세요..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />
        <button className={
          "btn btn-sm px-4 ms-2 text-nowrap " +
          (pressing ? "text-white" : "btn-outline-secondary")
        }
        style={{ fontSize: "0.9rem", lineHeight: 1.2, paddingTop: "6px",paddingBottom: "6px",}}
        onMouseUp={() => setPressing(false)}    // 떼면 회색
        onMouseLeave={() => setPressing(false)} // 밖으로 나가면 회색
        onClick={submit}                        // 실제 전송
      >
        등록
      </button>
      </div>

      {err && <div className="text-danger small mb-2">{err}</div>}
      {loading && <div className="text-muted small mb-2">불러오는 중…</div>}

      <div className="comment-list">
        {comments.map((c) => {
          const mine = isMine(c);

          return (
            <div key={c.commentId} className="comment-box mb-3">
              <div className="d-flex justify-content-between align-items-start">
                <div className="d-flex align-items-start">
                  <Avatar src={c.authorProfileImage} size={40} className="me-2" />
                  <div>
                    <div className="fw-semibold">{c.authorName || "익명"}</div>
                    <div className="text-muted small">{fmt(c.createdAt)}</div>
                  </div>
                </div>

                {/* 내 댓글만 수정/삭제 버튼 표시 */}
                {mine && (
                  <div className="d-flex align-items-center gap-2">
                    {editingId !== c.commentId && (
                      <>
                        <button
                          className="btn-ghost p-0"
                          onClick={() => startEdit(c)}
                        >
                          수정
                        </button>
                        <button
                          className="btn-ghost btn-ghost-danger p-0"
                          onClick={() => removeOne(c)}
                        >
                          삭제
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>

              {editingId === c.commentId ? (
                <div className="mt-2">
                  <textarea
                    className="form-control"
                    rows={3}
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                  />
                  <div className="d-flex gap-2 mt-2">
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => saveEdit(c)}
                    >
                      저장
                    </button>
                    <button
                      className="btn btn-outline-secondary btn-sm"
                      onClick={cancelEdit}
                    >
                      취소
                    </button>
                  </div>
                </div>
              ) : (
                <p className="mt-2 mb-0 p-2" style={{ whiteSpace: "pre-line" }}>
                  {c.content}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
