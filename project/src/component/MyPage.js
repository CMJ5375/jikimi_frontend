import { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./MyPage.css";

export default function MyPage() {
  const [selectedMenu, setSelectedMenu] = useState("favorites");
  const [favTab, setFavTab] = useState("hospital");
  const [page, setPage] = useState(1);

  // Mock data
  const hospitalData = [
    { id: 1, name: "성남소아과", addr: "경기 성남시 수정구 수정로171번길", favorite: true },
    { id: 2, name: "성남소아과", addr: "경기 성남시 수정구 수정로171번길", favorite: true },
  ];

  const postCount = 8;
  const favoriteCount = 5;

  const StarFilled = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="#FFC107" aria-hidden="true">
      <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
    </svg>
  );

  const Tag = ({ children }) => <span className="tag-label">{children}</span>;

  const renderFavoritesList = (items) => (
    <div className="px-3">
      {items.map((it, idx) => (
        <div key={it.id} className="py-3">
          <div className="d-flex align-items-start justify-content-between">
            <div>
              <div className="fav-title">{it.name}</div>
              <div className="d-flex align-items-center">
                <Tag>도로명</Tag>
                <span className="fav-addr">{it.addr}</span>
              </div>
            </div>
            {it.favorite && <StarFilled />}
          </div>
          {idx !== items.length - 1 && <hr className="fav-divider" />}
        </div>
      ))}
    </div>
  );

  const Pagination = () => (
    <nav className="d-flex justify-content-center my-4">
      <ul className="pagination mb-0">
        <li className="page-item"><button className="page-link border-0">«</button></li>
        {[1, 2, 3, 4, 5].map((p) => (
          <li key={p} className={`page-item ${page === p ? "active" : ""}`}>
            <button
              className="page-link"
              onClick={() => setPage(p)}
              style={{ width: 36, height: 36 }}
            >
              {p}
            </button>
          </li>
        ))}
        <li className="page-item"><button className="page-link border-0">»</button></li>
      </ul>
    </nav>
  );

  const FavTabs = () => (
    <div className="fav-tabs text-center">
      <button
        className={`fav-tab ${favTab === "hospital" ? "active" : ""}`}
        onClick={() => setFavTab("hospital")}
      >
        병원
      </button>
      <button
        className={`fav-tab ${favTab === "pharmacy" ? "active" : ""}`}
        onClick={() => setFavTab("pharmacy")}
      >
        약국
      </button>
    </div>
  );

  const Sidebar = () => (
    <div className="sidebar rounded-4 shadow-sm bg-white p-3">
      {[
        { key: "favorites", label: "즐겨찾기", count: favoriteCount },
        { key: "posts", label: "내가 쓴글", count: postCount },
        { key: "edit", label: "회원정보 수정", count: null },
      ].map((m) => (
        <button
          key={m.key}
          onClick={() => setSelectedMenu(m.key)}
          className={`sidebar-item ${selectedMenu === m.key ? "active" : ""}`}
        >
          <div className="d-flex align-items-center">
            <span>{m.label}</span>
            {m.count !== null && <span className="menu-count ms-2">{m.count}</span>}
          </div>
          <span>›</span>
        </button>
      ))}
    </div>
  );

  return (
    <div className="mypage-wrapper">
      <div className="container py-5">
        <h3 className="fw-bold text-center mb-5">마이페이지</h3>

        {/* 프로필 영역 */}
        <div className="profile-section bg-white rounded-4 shadow-sm p-4 mb-4 text-center text-md-start">
          <div className="d-flex flex-column flex-md-row align-items-center justify-content-between">
            <div className="d-flex align-items-center mb-3 mb-md-0">
              <div className="profile-img">＋</div>
              <div className="ms-3 text-start">
                <p className="text-secondary small mb-1">일반 회원</p>
                <h4 className="fw-bold mb-2">limdo 님 환영합니다!</h4>
              </div>
            </div>
            <button className="btn btn-light btn-sm rounded-3 px-4 fw-semibold">프로필 수정</button>
          </div>

          <div className="d-flex justify-content-center justify-content-md-end mt-3 gap-4">
            <div className="text-center">
              <i className="bi bi-bookmark-star-fill fs-5 text-dark"></i>
              <div className="small text-secondary">즐겨찾기</div>
              <div className="fw-bold text-primary">{favoriteCount}</div>
            </div>
            <div className="text-center">
              <i className="bi bi-chat-left-text-fill fs-5 text-dark"></i>
              <div className="small text-secondary">내가 쓴글</div>
              <div className="fw-bold text-primary">{postCount}</div>
            </div>
          </div>
        </div>

        <div className="row g-4">
          {/* 좌측 탭 */}
          <div className="col-lg-3 d-none d-lg-block">
            <Sidebar />
          </div>

          {/* 우측 콘텐츠 */}
          <div className="col-12 col-lg-9">
            {selectedMenu === "favorites" && (
              <div className="card border-0 shadow-sm rounded-4 p-0">
                <FavTabs />
                <hr className="fav-hr" />
                {favTab === "hospital" && renderFavoritesList(hospitalData)}
                {favTab === "pharmacy" && (
                  <div className="py-5 text-center text-secondary">즐겨찾기한 약국이 없습니다.</div>
                )}
                <Pagination />
              </div>
            )}

            {selectedMenu === "posts" && (
              <div className="card border-0 shadow-sm rounded-4 p-5 text-center text-muted">
                ✏️ 내가 쓴 글 (총 {postCount}개)
              </div>
            )}

            {selectedMenu === "edit" && (
              <div className="card border-0 shadow-sm rounded-4 p-5 text-center text-muted">
                ⚙️ 회원정보 수정 페이지
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
