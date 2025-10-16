import React from 'react'

const NoticeDetail = () => {
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

export default NoticeDetail