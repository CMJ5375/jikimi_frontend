import { ChevronLeft, ChevronRight, List } from "react-bootstrap-icons";

export default function NavModel({
  prevId,
  nextId,
  onGoPrev,
  onGoNext,
  onGoList,
}) {
return (
    <div className="post-nav">
        {/* 이전글 */}
        <div className="nav-row">
            <div className="nav-side">
                <ChevronLeft />
                {prevId ? (
                <span className="nav-link" onClick={onGoPrev} style={{ cursor: "pointer" }}>
                    이전글
                </span>
                ) : (
                <span className="empty">이전글이 없습니다</span>
                )}
            </div>
        </div>

        {/* 다음글 */}
        <div className="nav-row">
            <div className="nav-side">
                <ChevronRight />
                {nextId ? (
                <span className="nav-link" onClick={onGoNext} style={{ cursor: "pointer" }}>
                    다음글
                </span>
                ) : (
                <span className="empty">다음글이 없습니다</span>
                )}
            </div>
        </div>

        {/* 목록 버튼 */}
        <div className="list-wrap">
        <button
            type="button"
            className="btn btn-outline-secondary btn-list px-4"
            onClick={onGoList}
        >
            <List className="me-1" /> 목록으로
        </button>
        </div>
    </div>
    );
}