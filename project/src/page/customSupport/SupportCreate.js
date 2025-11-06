import { useRef, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../css/BoardCreate.css";
import { X } from "react-bootstrap-icons";
import { useNavigate, useLocation } from "react-router-dom";
import { createSupport } from "../../api/supportApi";
import { getCookie } from "../../util/cookieUtil";
import { decodeToken } from "../../util/jwtUtil";

const CATEGORY_OPTIONS = [
  { label: "공지사항", value: "notice" },
  { label: "FAQ", value: "faq" },
  { label: "자료실", value: "dataroom" },
];

const SupportCreate = ({ onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const fileRef = useRef(null);
  const query = new URLSearchParams(location.search);
  const typeFromQuery = query.get("type");
  const initialCategory = typeFromQuery || "notice";
  const [boardCategory, setBoardCategory] = useState(initialCategory);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [files, setFiles] = useState([]);

  // 파일 선택 (자료실에서만 허용)
  const handleFiles = (e) => {
    const list = Array.from(e.target.files || []);
    setFiles(list);
  };

  const removeFile = (idx) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
    if (fileRef.current && files.length === 1) fileRef.current.value = "";
  };

  // 등록 처리
const handleSubmit = async (e) => {
  e.preventDefault();

  if (!title.trim() || !content.trim()) {
    alert("제목과 내용을 입력해주세요.");
    return;
  }

  const raw = getCookie("member");
  if (!raw) {
    alert("로그인 후 이용해주세요.");
    return;
  }

  let parsed;
  try {
    parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch {
    alert("로그인 정보가 손상되었습니다. 다시 로그인해주세요.");
    return;
  }

  const token = parsed?.accessToken;
  if (!token) {
    alert("로그인 정보가 올바르지 않습니다.");
    return;
  }

  const claims = decodeToken(token);
  const adminId =
    claims?.id ||
    claims?.userId ||
    claims?.memberId ||
    parsed?.id ||
    parsed?.userId ||
    0;

  if (!adminId || adminId <= 0) {
    alert("관리자 정보가 올바르지 않습니다.");
    return;
  }

  // FormData 전송 (Content-Type 수동 지정 금지)
  const fd = new FormData();
  fd.append("adminId", String(adminId));
  fd.append("title", title);
  fd.append("content", content);
  if (boardCategory === "dataroom" && files[0]) {
    fd.append("file", files[0]); // 단일 파일만 전송 (백엔드가 단일 file 받음)
  }

  try {
    await createSupport({
      type: boardCategory,
      formData: fd,
      token,
    });

    alert("게시글이 등록되었습니다.");

    // 입력값/파일 초기화 (선택)
    setTitle("");
    setContent("");
    setFiles([]);
    if (fileRef.current) fileRef.current.value = "";

    // 카테고리별 이동
    if (boardCategory === "notice") navigate("/notice");
    else if (boardCategory === "faq") navigate("/faq");
    else navigate("/dataroom");
  } catch (err) {
    console.error("createSupport failed:", err);
    const msg = err?.response?.data?.message || "등록 중 오류가 발생했습니다.";
    alert(msg);
  }
};

  const selectedLabel =
    CATEGORY_OPTIONS.find((o) => o.value === boardCategory)?.label || "공지사항";

  return (
    <div className="container py-3 postcreate-wrap">
      {/* 헤더 */}
      <div className="d-flex justify-content-between align-items-center mb-2">
        <button
          type="button"
          className="btn btn-link text-decoration-none text-dark px-0 fs-4"
          onClick={onClose || (() => navigate(-1))}
          aria-label="close"
          title="닫기"
        >
          <X />
        </button>

        <button
          type="button"
          className="btn btn-primary rounded-pill px-4"
          onClick={handleSubmit}
        >
          등록
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {/* 카테고리 선택 */}
        <div className="border-bottom py-3">
          <label className="form-label text-muted mb-1">게시판을 선택하세요.</label>
          <div className="dropdown">
            <button
              className="btn btn-link w-100 text-start text-dark dropdown-toggle pc-no-underline"
              type="button"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              {selectedLabel}
            </button>
            <ul className="dropdown-menu w-100">
              {CATEGORY_OPTIONS.map((opt) => (
                <li key={opt.value}>
                  <button
                    type="button"
                    className="dropdown-item"
                    onClick={() => setBoardCategory(opt.value)}
                  >
                    {opt.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 제목 */}
        <div className="border-bottom py-3">
          <label className="form-label text-muted mb-1">제목</label>
          <input
            type="text"
            className="form-control form-control-plain"
            placeholder="제목을 입력하세요."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {/* 내용 */}
        <div className="border-bottom py-3">
          <textarea
            className="form-control form-control-plain postcreate-textarea"
            placeholder="내용을 입력하세요."
            rows={10}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>

        {/* 자료실일 경우만 첨부 파일 표시 */}
        {boardCategory === "dataroom" && (
          <div className="py-3">
            <label className="form-label fw-semibold">첨부 파일</label>
            <div className="d-flex flex-column gap-2">
              <input
                ref={fileRef}
                className="form-control"
                type="file"
                multiple
                onChange={handleFiles}
              />
              {files.length > 0 && (
                <div className="d-flex flex-wrap gap-2">
                  {files.map((f, idx) => {
                    const url = URL.createObjectURL(f);
                    return (
                      <div
                        key={`${f.name}-${idx}`}
                        className="thumb position-relative"
                      >
                        <img
                          src={url}
                          alt={f.name}
                          className="rounded shadow-sm"
                          style={{ maxWidth: "150px", maxHeight: "150px" }}
                        />
                        <button
                          type="button"
                          className="btn btn-sm btn-light position-absolute top-0 end-0 m-1"
                          onClick={() => removeFile(idx)}
                          title="삭제"
                        >
                          <i className="bi bi-x-lg"></i>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default SupportCreate;