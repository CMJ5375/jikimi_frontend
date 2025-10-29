import { useRef, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import '../../css/BoardCreate.css';
import { X } from "react-bootstrap-icons";
import { useNavigate } from "react-router-dom";
import { createPost } from "../../api/postApi"; // 백엔드 호출 함수 import***
import { getCookie } from "../../util/cookieUtil";

// 한글 라벨 ↔ Enum 코드 매핑 (백엔드 enum: BoardCategory)
const CATEGORY_OPTIONS = [
  { label: "자유글",   value: "FREE" },
  { label: "질문해요", value: "QUESTION" },
  { label: "병원정보", value: "HOSPITAL_INFO" },
  { label: "약국정보", value: "PHARMACY_INFO" },
  // { label: "공지사항", value: "NOTICE" },
];

const BoardCreat = ({ onClose }) => {
  const navigate = useNavigate();
  const fileRef = useRef(null);

  // 폼 상태
  const [boardCategory, setBoardCategory] = useState("FREE"); // ✅ Enum 코드로 관리
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [files, setFiles] = useState([]);

  // 파일 선택
  const handleFiles = (e) => {
    const list = Array.from(e.target.files || []);
    setFiles(list);
  };

  const removeFile = (idx) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
    if (fileRef.current && files.length === 1) fileRef.current.value = "";
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

    if (!title.trim() || !content.trim()) {
      alert("제목과 내용을 입력해주세요.");
      return;
    }

    // 로그인 쿠키에서 username / token 꺼내던 기존 로직 그대로 유지
    const raw = getCookie("member");
    if (!raw) {
      alert("로그인 후 이용해주세요.");
      return;
    }

    let parsed;
    try {
      parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    } catch (err) {
      alert("로그인 정보가 손상되었습니다. 다시 로그인해주세요.");
      return;
    }

    const token = parsed?.accessToken;
    const username = parsed?.username;

    if (!token || !username) {
      alert("로그인 정보가 올바르지 않습니다.");
      return;
    }

    // ✅ createPost에 넘길 payload
    const postPayload = {
      title,
      content,
      boardCategory,
      authorUsername: username,
      files, // 여기! File 객체 배열 그대로
    };

    try {
      const newId = await createPost(postPayload, token);
      alert("게시글이 등록되었습니다.");
      navigate(`/boarddetails/${newId}`);
    } catch (err) {
      console.error("createPost failed", err);
      alert("등록 중 오류가 발생했습니다.");
    }
  };
  
  // 라벨 표시용 (현재 선택 값 → 한글)
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

        <button
          type="button"
          className="btn btn-primary rounded-pill px-4"
          onClick={handleSubmit}
        >
          등록
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {/* 카테고리 선택 (Dropdown UI 유지, 내부값은 Enum) */}
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
                    onClick={() => setBoardCategory(opt.value)} // ✅ Enum 코드 저장
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

        {/* 첨부 이미지 */}
        <div className="py-3">
          <label className="form-label fw-semibold">첨부 이미지</label>
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