// src/page/board/BoardCreate.js
import { useRef, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../css/BoardCreate.css";
import { X } from "react-bootstrap-icons";
import { useNavigate } from "react-router-dom";
import { createPost } from "../../api/postApi";
import { getCookie } from "../../util/cookieUtil";
import { decodeToken } from "../../util/jwtUtil"; // ✅ 토큰에서 username/sub 읽기

// 한글 라벨 ↔ Enum 코드
const CATEGORY_OPTIONS = [
  { label: "자유글", value: "FREE" },
  { label: "질문해요", value: "QUESTION" },
  { label: "병원정보", value: "HOSPITAL_INFO" },
  { label: "약국정보", value: "PHARMACY_INFO" },
  // { label: "공지사항", value: "NOTICE" },
];

const BoardCreat = ({ onClose }) => {
  const navigate = useNavigate();
  const fileRef = useRef(null);

  // 폼 상태
  const [boardCategory, setBoardCategory] = useState("FREE");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  // 파일: 백엔드가 단일만 받으므로 첫 번째만 업로드 대상으로 사용
  const [files, setFiles] = useState([]);       // 미리보기용
  const [fileOne, setFileOne] = useState(null); // 실제 업로드용

  // 파일 선택
  const handleFiles = (e) => {
    const list = Array.from(e.target.files || []);
    if (list.length === 0) {
      setFiles([]);
      setFileOne(null);
      return;
    }
    setFiles(list);
    setFileOne(list[0]); // ✅ 첫 번째만 업로드
  };

  const removeFile = (idx) => {
    const next = files.filter((_, i) => i !== idx);
    setFiles(next);
    if (idx === 0) setFileOne(next[0] ?? null);
    if (fileRef.current && next.length === 0) fileRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      alert("제목과 내용을 입력해주세요.");
      return;
    }

    // 로그인 쿠키 가져오기
    const raw = getCookie("member");
    if (!raw) {
      alert("로그인 후 이용해주세요.");
      return;
    }

    // 쿠키 파싱
    let parsed;
    try {
      parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    } catch {
      alert("로그인 정보가 손상되었습니다. 다시 로그인해주세요.");
      return;
    }

    // ✅ 토큰에서 username/sub 우선 추출 (서버 DB 사용자와 1:1 매칭 보장)
    const accessToken = parsed?.accessToken || parsed?.token || null;
    const payload = accessToken ? decodeToken(accessToken) : null;
    const jwtUsername = payload?.username || payload?.sub || null;

    // fallback: 쿠키의 username (가능하면 쓰지 않음)
    const cookieUsername = parsed?.username || null;

    const finalUsername = jwtUsername || cookieUsername;
    if (!finalUsername) {
      alert("로그인 정보가 올바르지 않습니다. 다시 로그인해주세요.");
      return;
    }

    // 전송 페이로드 (파일은 1개만)
    const postPayload = {
      title,
      content,
      boardCategory,
      authorUsername: finalUsername, // ✅ 서버가 JUserRepository.findByUsername(...) 하는 값
      files: fileOne ? [fileOne] : [],
    };

    try {
      const newId = await createPost(postPayload); // jwtAxios가 Authorization 부착/리프레시 처리
      alert("게시글이 등록되었습니다.");
      navigate(`/boarddetails/${newId}`);
    } catch (err) {
      // 디버깅 도움: 서버 응답 메시지 노출
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "등록 중 오류가 발생했습니다.";
      console.error("createPost failed", err);
      alert(msg);
    }
  };

  // 라벨 표시
  const selectedLabel =
    CATEGORY_OPTIONS.find((o) => o.value === boardCategory)?.label || "자유글";

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
      </div>

      <form id="postCreateForm" onSubmit={handleSubmit}>
        {/* 카테고리 */}
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

        {/* 첨부 이미지 (첫 번째만 업로드) */}
        <div className="py-3">
          <div className="d-flex align-items-center justify-content-between">
            <label className="form-label fw-semibold mb-0">첨부 이미지</label>
            <small className="text-muted">
              * 현재 서버는 1개 파일만 저장합니다. (첫 번째 파일이 업로드됨)
            </small>
          </div>

          <div className="d-flex flex-column gap-2">
            <input
              ref={fileRef}
              className="form-control"
              type="file"
              accept="image/*"
              multiple
              onChange={handleFiles}
            />

            {files.length > 0 && (
              <div className="d-flex flex-wrap gap-2">
                {files.map((f, idx) => {
                  const url = URL.createObjectURL(f);
                  return (
                    <div key={`${f.name}-${idx}`} className="thumb position-relative">
                      <img src={url} alt={f.name} className="rounded shadow-sm" />
                      <button
                        type="button"
                        className="btn btn-sm btn-light position-absolute top-0 end-0 m-1"
                        onClick={() => removeFile(idx)}
                        title="삭제"
                      >
                        <i className="bi bi-x-lg"></i>
                      </button>
                      {idx === 0 && (
                        <span className="badge text-bg-primary position-absolute bottom-0 start-0 m-1">
                          업로드 대상
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="d-flex justify-content-end">
          <button type="submit" form="postCreateForm" className="btn btn-primary rounded-pill px-4">
            등록
          </button>
        </div>
      </form>
    </div>
  );
};

export default BoardCreat;
