import { useParams } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./DataRoomDetail.css";
import { Eye, HandThumbsUp, Share } from "react-bootstrap-icons";

const NoticeDetail = () => {
  const { id } = useParams();

  const post = {
    id,
    category: "자유글",
    title: "대전 국가정보 자원관리원 화재 관련 안내",
    author: "영업부장",
    date: "2025.09.22",
    time: "22:01",
    views: 575,
    chumbu: 1,
    content: `
      대전 국가정보자원 관리원에 화재가 나서 우리가 쓸 api가 지금 일시적으로 중단된 상태라 대비책을 찾아야하며...
    `,
    likes: 25,
  };

  return (
    <>
    <div className="container post-detail">

      {/* 제목 */}
      <h3 className="fw-bold mb-3">{post.title}</h3>

      {/* 메타정보 */}
      <div className="d-flex justify-content-between align-items-center text-muted small mb-3">
        <div>
          <span className="fw-semibold text-dark me-2">{post.author}</span>
          <span>{post.date} {post.time}</span> <Eye /> {post.views}
        </div>
      </div>

      <hr />

      {/* 본문 */}
      <div className="p-2 mb-4">
        <p className="post-content">{post.content}</p>
      </div>

      {/* 좋아요 & 공유 */}
      <div className="d-flex gap-3 mb-5">
        <button className="btn btn-outline-primary flex-fill py-2">
          <HandThumbsUp /> 좋아요 {post.likes}
        </button>
        <button className="btn btn-outline-secondary flex-fill py-2">
          <Share /> 공유
        </button>
      </div>
    </div>
    </>
  );
}

export default NoticeDetail