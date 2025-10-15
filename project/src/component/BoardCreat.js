import React, { useRef, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./BoardCreate.css";
import { X } from "react-bootstrap-icons";

const CATEGORIES = ["자유글", "질문해요", "병원정보", "약국정보", "공지사항"];

export default function BoardCreat({ onSubmit, onClose }) {
  const [category, setCategory] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [files, setFiles] = useState([]);
  const fileRef = useRef(null);

  const handleFiles = (e) => {
    const list = Array.from(e.target.files || []);
    setFiles(list);
  };

  const removeFile = (idx) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
    if (fileRef.current && files.length === 1) fileRef.current.value = ""; // 모두 제거 시 input 초기화
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { category, title, content, files };
    if (onSubmit) onSubmit(payload);
    // 데모용 알림
    alert(
      JSON.stringify(
        {
          category,
          title,
          content: content.slice(0, 40) + (content.length > 40 ? "..." : ""),
          files: files.map((f) => f.name),
        },
        null,
        2
      )
    );
  };

  return (
    <div className="container py-3 postcreate-wrap">
      {/* 헤더 */}
      <div className="d-flex justify-content-between align-items-center mb-2">
        <button
          type="button"
          className="btn btn-link text-decoration-none text-dark px-0 fs-4"
          onClick={onClose}
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
        {/* 게시판 선택 */}
        <div className="border-bottom py-3">
          <label className="form-label text-muted mb-1">게시판을 선택하세요.</label>
          <div className="dropdown">
            <button
              className="btn btn-link w-100 text-start text-dark dropdown-toggle pc-no-underline"
              type="button"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              {category || "게시판 선택"}
            </button>
            <ul className="dropdown-menu w-100">
              {CATEGORIES.map((c) => (
                <li key={c}>
                  <button
                    type="button"
                    className="dropdown-item"
                    onClick={() => setCategory(c)}
                  >
                    {c}
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

            {/* 미리보기 썸네일 */}
            {files.length > 0 && (
              <div className="d-flex flex-wrap gap-2">
                {files.map((f, idx) => {
                  const url = URL.createObjectURL(f);
                  return (
                    <div key={`${f.name}-${idx}`} className="thumb">
                      <img src={url} alt={f.name} />
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
}