// src/component/common/NoticeBanner.js
import React from "react";

/**
 * 게시판 상단에 쓰던 공지 배너 레이아웃을 그대로 재사용.
 * 필요 시 props로 문구/링크 교체 가능.
 */
const NoticeBanner = ({
  title = "공지",
  message = "중요한 고객 공지/이벤트/점검 안내를 여기서 노출할 수 있어요.",
  linkText = "자세히 보기",
  onClick,
}) => {
  return (
    <div className="bg-primary text-white rounded-3 p-3 mb-3 d-flex justify-content-between align-items-center">
      <div className="me-3">
        <div className="fw-bold">{title}</div>
        <div className="small opacity-75">{message}</div>
      </div>
      <button className="btn btn-light btn-sm" onClick={onClick}>
        {linkText}
      </button>
    </div>
  );
};

export default NoticeBanner;
