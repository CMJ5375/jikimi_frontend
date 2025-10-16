import { useParams } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./DataRoomDetail.css";
import { Eye, HandThumbsUp, Share } from "react-bootstrap-icons";

export default function BoardDetail() {
  const { id } = useParams();

  const post = {
    id,
    category: "자유글",
    title: "간경화 진단을 받았습니다..",
    author: "영업부장",
    date: "2025.09.22",
    time: "22:01",
    views: 57,
    content: `
      최근 회식이 잦긴 했는데 이렇게 갑자기 간경화 진단을 받을 줄은 몰랐어요.
      영업직에 종사한지 10년이 넘었는데 어떻게 해야 좋을지 모르겠어요.
      같은 고민 하시는 분들 있으신가요?
    `,
    likes: 25,
  };

  return (
    <div className="container post-detail">

      {/* 제목 */}
      <h3 className="fw-bold mb-3">{post.title}</h3>

      {/* 메타정보 */}
      <div className="d-flex justify-content-between align-items-center text-muted small mb-3">
        <div>
          <span className="fw-semibold text-dark me-2">{post.author}</span>
          <span>{post.date} {post.time}</span>
        </div>
        <div><Eye /> {post.views}</div>
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