import { useParams, useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./DataRoomDetail.css";
import { Eye, HandThumbsUp, Share, ThreeDots, Download } from "react-bootstrap-icons";

export default function BoardDetail() {
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

  const comments = [
    {
      id: 1,
      author: "프로단식러",
      datetime: "2025.09.22 23:57",
      text:
        "힘내세요. 저도 간경화 진단 받고나서는 회식 참여 전혀 안했어요. 영업직은 힘들지만 건강이 최우선이에요!",
    },
    {
      id: 2,
      author: "희망찬직장인",
      datetime: "2025.09.23 09:15",
      text: "저도 비슷한 경험이 있었는데 식습관 바꾸고 운동하니 좋아졌어요!",
    },
  ];

  return (
    <div className="container post-detail">

      {/* 제목 */}
      <h3 className="fw-bold mb-3">{post.title}</h3>

      {/* 메타정보 */}
      <div className="d-flex justify-content-between align-items-center text-muted small mb-3">
        <div>
          <span className="fw-semibold text-dark me-2">{post.author}</span>
          <span>{post.date} {post.time}</span> <Eye /> {post.views}
        </div>
        <div><Download /> {post.chumbu}</div>
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
  );
}