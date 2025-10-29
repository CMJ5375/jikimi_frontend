import React from "react";
import '../../App.css';
import { Pagination } from "react-bootstrap";

const PageComponent = ({ pageData, onPageChange }) => {
  if (!pageData) return null;

  const blockSize = 10;
  const currentPage = pageData.current;
  const totalPages = pageData.pageNumList?.length || 0;
  const currentBlock = Math.floor((currentPage - 1) / blockSize);
  const startPage = currentBlock * blockSize + 1;
  const endPage = Math.min(startPage + blockSize - 1, totalPages);
  const visiblePages = pageData.pageNumList?.slice(startPage - 1, endPage) || [];

  return (
    <Pagination className="justify-content-center my-5 pagination-block">
      {/* 맨 앞으로 이동 */}
      <Pagination.First
        onClick={() => onPageChange(0)}
        disabled={currentPage === 1}
      />

      {/* 이전 블록으로 이동 */}
      <Pagination.Prev
        onClick={() => onPageChange(currentPage - 2)}
        disabled={currentPage === 1}
      />

      {/* 현재 블록의 페이지 목록 */}
      {visiblePages.map((pageNum) => (
        <Pagination.Item
          key={pageNum}
          active={pageData.current === pageNum}
          onClick={() => onPageChange(pageNum - 1)}
        >
          {pageNum}
        </Pagination.Item>
      ))}

      {/* 다음 블록으로 이동 */}
      <Pagination.Next
        onClick={() => onPageChange(currentPage)}
        disabled={currentPage === totalPages}
      />

      {/* 맨 끝으로 이동 */}
      <Pagination.Last
        onClick={() => onPageChange(totalPages - 1)}
        disabled={currentPage === totalPages}
      />
    </Pagination>
  );
};

export default PageComponent;
