import React, { useEffect, useCallback } from "react";

export default function ShareModal({ show, onClose, shareTitle, pageUrl }) {

// ESC 눌러 닫기
useEffect(() => { if (!show) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
window.addEventListener("keydown", onKey);
return () => window.removeEventListener("keydown", onKey);
}, [show, onClose]);

// 복사 핸들러
const copyLink = useCallback(async () => {
    try {
    if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(pageUrl);
    } else {
        const ta = document.createElement("textarea");
        ta.value = pageUrl;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
    }
    alert("링크가 복사되었습니다.");
    onClose();
    } catch {
    alert("복사에 실패했습니다. 직접 복사해 주세요.");
    }
}, [pageUrl, onClose]);

if (!show) return null;

return (
    <>
      {/* 반투명 백드롭 */}
      <div
        className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50"
        style={{ zIndex: 1040 }}
        onClick={onClose}
      />

      {/* 실제 모달 */}
      <div
        className="position-fixed top-50 start-50 translate-middle bg-white rounded-3 shadow-lg p-3 p-md-4"
        style={{ zIndex: 1050, minWidth: "280px", maxWidth: "90vw" }}
        role="dialog"
        aria-modal="true"
      >
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h6 className="m-0">공유하기</h6>
          <button
            type="button"
            className="btn-close"
            aria-label="Close"
            onClick={onClose}
          />
        </div>

        <div className="small text-muted mb-3">{shareTitle}</div>

        <div className="input-group mb-3">
          <input
            className="form-control"
            readOnly
            value={pageUrl}
            onFocus={(e) => e.target.select()}
          />
          <button className="btn btn-outline-secondary" onClick={copyLink}>
            복사
          </button>
        </div>

        <div className="d-flex gap-2">
          <a
            className="btn btn-outline-primary flex-fill"
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
              shareTitle
            )}&url=${encodeURIComponent(pageUrl)}`}
            target="_blank"
            rel="noreferrer"
          >
            X(트위터)
          </a>
          <a
            className="btn btn-outline-primary flex-fill"
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
              pageUrl
            )}`}
            target="_blank"
            rel="noreferrer"
          >
            페이스북
          </a>
        </div>

        <div className="text-end mt-3">
          <button className="btn btn-secondary" onClick={onClose}>
            닫기
          </button>
        </div>
      </div>
    </>
  );
}