// src/component/BoardCreate.jsx
import React, { useRef, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./BoardCreate.css";
import { X } from "react-bootstrap-icons";
import { useNavigate } from "react-router-dom";
import { createPost } from "../api/postApi";

// 한글 라벨 ↔ Enum 코드 매핑 (백엔드 enum: BoardCategory)
const CATEGORY_OPTIONS = [
  { label: "자유글",   value: "FREE" },
  { label: "질문해요", value: "QUESTION" },
  { label: "병원정보", value: "HOSPITAL_INFO" },
  { label: "약국정보", value: "PHARMACY_INFO" },
  // ⚠️ 백엔드 enum에 NOTICE가 없다면 주석 처리하거나 막아두세요.
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

  // 등록
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      alert("제목과 내용을 입력해주세요.");
      return;
    }

    // ⚠️ 백엔드 enum에 없는 값(예: NOTICE)이면 막기
    const enumValues = CATEGORY_OPTIONS.map((o) => o.value);
    if (!enumValues.includes(boardCategory)) {
      alert("지원하지 않는 카테고리입니다. 다른 카테고리를 선택해주세요.");
      return;
    }

    try {
      const newPost = {
        title,
        content,
        fileUrl: files.length > 0 ? files[0].name : "",
        likeCount: 0,
        isDeleted: false,
        // TODO: 로그인 연동 후 실제 userId로 교체
        userId: 1,
        // ✅ 가장 중요: Enum 코드 그대로 보내기
        boardCategory,
      };

      const newId = await createPost(newPost); // POST /api/posts/add
      alert("게시글이 등록되었습니다.");
      // 네 리스트에서 상세 이동 경로가 /boarddetails/:id 였으므로 여기도 맞춰줌
      navigate(`/boarddetails/${newId}`);
    } catch (err) {
      console.error(err);
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