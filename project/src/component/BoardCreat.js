import React, { useRef, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./BoardCreate.css";
import { X } from "react-bootstrap-icons";
import { useNavigate } from "react-router-dom";
import { createPost } from "../api/postApi"; // 백엔드 호출 함수 import***

const CATEGORIES = ["자유글", "질문해요", "병원정보", "약국정보", "공지사항"];

const BoardCreat = ({ onClose }) => {
  const [category, setCategory] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [files, setFiles] = useState([]);
  const fileRef = useRef(null);
  const navigate = useNavigate();

  // 파일 처리
  const handleFiles = (e) => {
    const list = Array.from(e.target.files || []);
    setFiles(list);
  };

  const removeFile = (idx) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
    if (fileRef.current && files.length === 1) fileRef.current.value = "";
  };

  // 등록 버튼 클릭 시
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      alert("제목과 내용을 입력해주세요.");
      return;
    }

    try {
      // 파일은 추후 별도 업로드 로직을 추가할 수 있음.
      // 현재는 fileUrl 빈값으로 전달.
      const newPost = {
        title,
        content,
        fileUrl: files.length > 0 ? files[0].name : "",
        likeCount: 0,
        isDeleted: false,
        userId: 1, // 로그인 연결 전이므로 임시 userId
      };

      const newId = await createPost(newPost); // /api/posts/add 호출***
      alert("게시글이 등록되었습니다.");
      navigate(`/boardRead/${newId}`); // 등록 후 상세 페이지로 이동***
    } catch (err) {
      console.error(err);
      alert("등록 중 오류가 발생했습니다.");
    }
  };

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