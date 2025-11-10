// src/page/board/BoardCreate.js
import { useRef, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../css/BoardCreate.css";
import { X } from "react-bootstrap-icons";
import { useNavigate } from "react-router-dom";
import { createPost } from "../../api/postApi";
import { getCookie } from "../../util/cookieUtil";

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

  // 파일은 백엔드가 단일만 받으므로 첫 번째만 저장
  const [files, setFiles] = useState([]);     // File[] (미리보기용으로 유지)
  const [fileOne, setFileOne] = useState(null); // 실제 업로드용 단일 File

  // 파일 선택
  const handleFiles = (e) => {
    const list = Array.from(e.target.files || []);
    if (list.length === 0) {
      setFiles([]);
      setFileOne(null);
      return;
    }
    // 첫 번째만 업로드 대상으로 사용
    setFiles(list);
    setFileOne(list[0]);
  };

  const removeFile = (idx) => {
    const next = files.filter((_, i) => i !== idx);
    setFiles(next);
    // 업로드 대상이 사라졌다면 null
    if (idx === 0) setFileOne(next[0] ?? null);
    if (fileRef.current && next.length === 0) fileRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      alert("제목과 내용을 입력해주세요.");
      return;
    }

    // 로그인 쿠키에서 username
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

    const username = parsed?.username;
    if (!username) {
      alert("로그인 정보가 올바르지 않습니다.");
      return;
    }

    // createPost에 넘길 payload
    // postApi.createPost는 내부에서 FormData 생성 시 file 1개만 append하도록 되어 있음
    const postPayload = {
      title,
      content,
      boardCategory,
      authorUsername: username,
      files: fileOne ? [fileOne] : [], // 첫 번째 파일만 서버로 전송
    };

    try {
      const newId = await createPost(postPayload);
      alert("게시글이 등록되었습니다.");
      navigate(`/boarddetails/${newId}`);
    } catch (err) {
      console.error("createPost failed", err);
      alert("등록 중 오류가 발생했습니다.");
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

        {/* 등록 버튼: submit으로 고정 */}
        <button type="submit" form="postCreateForm" className="btn btn-primary rounded-pill px-4">
          등록
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
      </form>
    </div>
  );
};

export default BoardCreat;
