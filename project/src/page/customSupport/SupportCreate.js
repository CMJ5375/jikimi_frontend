// src/page/support/SupportCreate.jsx
import { useRef, useState, useMemo } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../css/BoardCreate.css";
import { X } from "react-bootstrap-icons";
import { useNavigate, useLocation } from "react-router-dom";
import { createSupport } from "../../api/supportApi";
import { getCookie } from "../../util/cookieUtil";
import useCustomLogin from "../../hook/useCustomLogin";
import { resolveAdminId, decodeJwtPayload } from "../../util/adminIdResolver";

const DEBUG = true;

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
  const typeFromQuery = query.get("type") || "notice";

  const [boardCategory, setBoardCategory] = useState(typeFromQuery);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [files, setFiles] = useState([]);

  const { loginState } = useCustomLogin();

  // 쿠키 member 파싱
  const cookieMemberRaw = getCookie("member");
  const cookieMember = useMemo(() => {
    if (!cookieMemberRaw) return null;
    try {
      return typeof cookieMemberRaw === "string"
        ? JSON.parse(cookieMemberRaw)
        : cookieMemberRaw;
    } catch {
      return null;
    }
  }, [cookieMemberRaw]);

  // 토큰: 훅 → 쿠키(accessToken) → 쿠키(token)
  const token =
    loginState?.accessToken ||
    cookieMember?.accessToken ||
    cookieMember?.token ||
    null;

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
    if (!token) {
      alert("로그인 후 이용해주세요.");
      return;
    }

    // ★★★★★ 프론트에서 adminId 해석(백엔드는 그대로)
    const adminId = resolveAdminId({
      user: loginState,
      cookieMember,
      token,
      // 로컬 개발 편의: admin → 1 매핑 (필요 없으면 지워도 OK)
      devUsernameMap: { admin: 1 },
    });

    if (DEBUG) {
      console.debug("[SupportCreate] loginState:", loginState);
      console.debug("[SupportCreate] cookieMember:", cookieMember);
      console.debug("[SupportCreate] token payload:", decodeJwtPayload(token));
      console.debug("[SupportCreate] resolved adminId:", adminId);
    }

    if (!adminId) {
      alert(
        "관리자 정보가 올바르지 않습니다. (id 미확보)\n" +
          "로컬 테스트면 .env에 REACT_APP_ADMIN_ID=1 같은 환경변수를 넣거나,\n" +
          "devUsernameMap에서 매핑하세요."
      );
      return;
    }

    // FormData (Content-Type 자동)
    const fd = new FormData();
    fd.append("title", title);
    fd.append("content", content);
    if (boardCategory === "dataroom" && files[0]) {
      fd.append("file", files[0]); // 단일 파일만 전송(백엔드 단일 file 매핑)
    }

    try {
      await createSupport({
        type: boardCategory,
        formData: fd,
        token,
        adminId, // ← 쿼리 + form-data 양쪽으로 실려감 (supportApi에서 처리)
      });

      alert("게시글이 등록되었습니다.");
      setTitle("");
      setContent("");
      setFiles([]);
      if (fileRef.current) fileRef.current.value = "";

      if (boardCategory === "notice") navigate("/notice");
      else if (boardCategory === "faq") navigate("/faq");
      else navigate("/dataroom");
    } catch (err) {
      console.error("createSupport failed:", err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "등록 중 오류가 발생했습니다.";
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

        {/* 자료실 첨부 */}
        {boardCategory === "dataroom" && (
          <div className="py-3">
            <label className="form-label fw-semibold">첨부 파일</label>
            <div className="d-flex flex-column gap-2">
              <input
                ref={fileRef}
                className="form-control"
                type="file"
                onChange={handleFiles}
              />
              {files.length > 0 && (
                <div className="d-flex flex-wrap gap-2">
                  {files.map((f, idx) => {
                    const url = URL.createObjectURL(f);
                    return (
                      <div key={`${f.name}-${idx}`} className="thumb position-relative">
                        <img
                          src={url}
                          alt={f.name}
                          className="rounded shadow-sm"
                          style={{ maxWidth: "150px", maxHeight: "150px" }}
                        />
                        <button
                          type="button"
                          className="btn btn-sm btn-light position-absolute top-0 end-0 m-1"
                          onClick={() => {
                            // 썸네일 revoke는 페이지 떠날 때 브라우저가 정리해줌
                            removeFile(idx);
                          }}
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
