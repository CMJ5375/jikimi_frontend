import React, { useState, useEffect } from "react";
import "../../App.css";
import "../../css/MyPage.css";
import { Container, Row, Col, Card, ListGroup, Button, Nav, Form, Spinner } from "react-bootstrap";
import { FaBookmark, FaCommentDots, FaStar, FaHeart, FaRegCommentDots, FaRegStar } from "react-icons/fa";
import { getFavorites, toggleFavorite } from "../../api/favoriteApi";
import { useNavigate } from "react-router-dom";
import useCustomLogin from "../../hook/useCustomLogin";

const MyPage = () => {
  const [activeMenu, setActiveMenu] = useState("favorite");
  const [favoriteTab, setFavoriteTab] = useState("hospital");
  const [postTab, setPostTab] = useState("post");
  const [activePage, setActivePage] = useState(1);
  const itemsPerPage = 10;

  const [loading, setLoading] = useState(true);
  const [hospitalList, setHospitalList] = useState([]);
  const [pharmacyList, setPharmacyList] = useState([]);
  const [unfavorited, setUnfavorited] = useState({});

  const navigate = useNavigate();
  const handlePageChange = (page) => setActivePage(page);
  // 로그인 상태, 로그인상태체크 후 로그인상태가 아니면 로그인페이지로 이동
  const {isLogin, moveToLoginReturn} = useCustomLogin()

  // 즐겨찾기 데이터 불러오기
  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const hospitalIds = await getFavorites("HOSPITAL");
        const pharmacyIds = await getFavorites("PHARMACY");

        const hospitalData = await Promise.all(
          hospitalIds.map((id) =>
            fetch(`http://localhost:8080/project/hospital/${id}`).then((res) => res.json())
          )
        );

        const pharmacyData = await Promise.all(
          pharmacyIds.map((id) =>
            fetch(`http://localhost:8080/project/pharmacy/${id}`).then((res) => res.json())
          )
        );

        setHospitalList(hospitalData.filter(Boolean));
        setPharmacyList(pharmacyData.filter(Boolean));
      } catch (err) {
        console.error("즐겨찾기 데이터를 불러오는 중 오류 발생:", err);
      } finally {
        setLoading(false);
      }
    };

    if (isLogin) {
      fetchFavorites();
    }
  }, [isLogin]);

  const totalFavorites = hospitalList.length + pharmacyList.length;

  // 즐겨찾기 토글
  const handleToggleFavorite = async (type, entityId) => {
    try {
      const newState = await toggleFavorite(type, entityId);
      setUnfavorited((prev) => ({
        ...prev,
        [`${type}_${entityId}`]: !newState,
      }));
    } catch (e) {
      console.error("즐겨찾기 토글 실패:", e);
    }
  };

  if(!isLogin) {
      return moveToLoginReturn()
  }

  // 페이지네이션
  const paginate = (list) => {
    const startIndex = (activePage - 1) * itemsPerPage;
    return list.slice(startIndex, startIndex + itemsPerPage);
  };

  const pagedHospitals = paginate(hospitalList);
  const pagedPharmacies = paginate(pharmacyList);

  return (
    <>
    <Container fluid className="mypage-section py-5">
      <Container className="mypage-container narrow-container">

        {/* 상단 타이틀 */}
        <Row className="text-center mb-5">
          <Col>
            <h2 className="mypage-title fw-bold">마이페이지</h2>
          </Col>
        </Row>

        {/* 프로필 */}
        <Row className="align-items-center text-center mb-5 gy-4">
          <Col xs={12}>
            <div className="profile-box d-flex flex-wrap justify-content-center justify-content-md-start align-items-center gap-4">

              {/* 프로필 이미지 */}
              <div className="mypage-avatar">
                <div clssName="avatar-logo">+</div>
              </div>

              {/* 이름/등급/버튼 묶음 */}
              <div className="text-start">
                <div className="d-flex align-items-center flex-wrap gap-2 mb-2">
                  <h4 className="fw-bold mb-0">limdo</h4>
                  <span className="text-muted">일반 회원</span>
                </div>
                <Button variant="light" className="mypage-btn">
                  프로필 수정
                </Button>
              </div>

              {/* 즐겨찾기 / 내가 쓴 글 */}
              <div className="d-flex ms-auto gap-5 justify-content-center stats-box">
                <div className="text-center">
                  <FaBookmark className="mypage-icon mb-1" />
                  <p className="mb-0">즐겨찾기</p>
                  <span className="fw-bold text-primary">{totalFavorites}</span>
                </div>
                <div className="text-center">
                  <FaCommentDots className="mypage-icon mb-1" />
                  <p className="mb-0">내가 쓴 글</p>
                  <span className="fw-bold text-primary">8</span>
                </div>
              </div>
            </div>
          </Col>
        </Row>


        {/* 본문 */}
        <Row className="gy-4">
          {/* 좌측 메뉴 */}
          <Col xs={12} lg={3}>
            <Card className="menu-card border-0 shadow-sm">
              <ListGroup variant="flush">
                <ListGroup.Item
                  action
                  className={`menu-item ${
                    activeMenu === "favorite" ? "active-item" : ""
                  }`}
                  onClick={() => setActiveMenu("favorite")}
                >
                  즐겨찾기
                </ListGroup.Item>
                <ListGroup.Item
                  action
                  className={`menu-item ${
                    activeMenu === "mypost" ? "active-item" : ""
                  }`}
                  onClick={() => setActiveMenu("mypost")}
                >
                  내가 쓴 글
                </ListGroup.Item>
                <ListGroup.Item
                  action
                  className={`menu-item ${
                    activeMenu === "profile" ? "active-item" : ""
                  }`}
                  onClick={() => setActiveMenu("profile")}
                >
                  회원정보 수정
                </ListGroup.Item>
              </ListGroup>
            </Card>
          </Col>

          {/* 우측 콘텐츠 */}
          <Col xs={12} lg={9}>
            <Card className="content-card border-0 shadow-sm">
              <Card.Body>
                {/* 즐겨찾기 */}
                {activeMenu === "favorite" && (
                  <>
                    <Nav className="custom-tabs mb-4">
                      <Nav.Item>
                        <Nav.Link
                          className={`tab-link ${favoriteTab === "hospital" ? "active" : ""}`}
                          onClick={() => { setActiveTabAndResetPage("hospital", setFavoriteTab, setActivePage); }}
                        >
                          병원
                        </Nav.Link>
                      </Nav.Item>
                      <Nav.Item>
                        <Nav.Link
                          className={`tab-link ${favoriteTab === "pharmacy" ? "active" : ""}`}
                          onClick={() => { setActiveTabAndResetPage("pharmacy", setFavoriteTab, setActivePage); }}
                        >
                          약국
                        </Nav.Link>
                      </Nav.Item>
                    </Nav>

                    {/* 로딩 중 */}
                    {loading && (
                      <div className="text-center my-4">
                        <Spinner animation="border" variant="primary" />
                        <p className="mt-2 text-secondary small">불러오는 중...</p>
                      </div>
                    )}

                    {/* 병원 즐겨찾기 */}
                    {!loading && favoriteTab === "hospital" && (
                      <>
                      {hospitalList.length === 0 ? (
                        <p className="text-center text-secondary small mt-5">즐겨찾기한 병원이 없습니다.</p>
                      ) : (
                        pagedHospitals.map((h, idx) => (
                          <React.Fragment key={h.hospitalId || idx}>
                            <div
                              className="list-item p-3"
                              onClick={() => navigate(`/hospitaldetail/${h.hospitalId}`)}
                              style={{ cursor: "pointer" }}
                            >
                              <strong>{h.hospitalName}</strong>
                              <div className="my-2 d-flex align-items-center">
                                <span className="badge-road me-2">도로명</span>
                                <span className="text-gray">
                                  {h.facility?.address || "주소 정보 없음"}
                                </span>
                              </div>
                              {unfavorited[`HOSPITAL_${h.hospitalId}`] ? (
                                  <FaRegStar
                                    className="favorite-star"
                                    color="#ccc"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      h.hospitalId && handleToggleFavorite("HOSPITAL", h.hospitalId);
                                    }}
                                  />
                                ) : (
                                  <FaStar
                                    className="favorite-star"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      h.hospitalId && handleToggleFavorite("HOSPITAL", h.hospitalId);
                                    }}
                                  />
                                )}
                            </div>
                            {idx < pagedHospitals.length - 1 && <hr className="divider my-2" />}
                          </React.Fragment>
                        ))
                      )}
                    </>
                    )}

                    {/* 약국 즐겨찾기 */}
                    {!loading && favoriteTab === "pharmacy" && (
                      <>
                        {pharmacyList.length === 0 ? (
                          <p className="text-center text-secondary small mt-5">즐겨찾기한 약국이 없습니다.</p>
                        ) : (
                          pagedPharmacies.map((p, idx) => (
                            <React.Fragment key={p.pharmacyId || idx}>
                              <div
                                className="list-item p-3"
                                onClick={() => navigate(`/pharmacydetail/${p.pharmacyId}`)}
                                style={{ cursor: "pointer" }}
                              >
                                <strong>{p.pharmacyName}</strong>
                                <div className="my-2 d-flex align-items-center">
                                  <span className="badge-road me-2">도로명</span>
                                  <span className="text-gray">
                                    {p.facility?.address || "주소 정보 없음"}
                                  </span>
                                </div>
                                {unfavorited[`PHARMACY_${p.pharmacyId}`] ? (
                                  <FaRegStar
                                    className="favorite-star"
                                    color="#ccc"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      p.pharmacyId && handleToggleFavorite("PHARMACY", p.pharmacyId);
                                    }}
                                  />
                                ) : (
                                  <FaStar
                                    className="favorite-star"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      p.pharmacyId && handleToggleFavorite("PHARMACY", p.pharmacyId);
                                    }}
                                  />
                                )}
                              </div>
                              {idx < pagedPharmacies.length - 1 && <hr className="divider my-2" />}
                            </React.Fragment>
                          ))
                        )}
                      </>
                    )}

                    {/* 페이지네이션 */}
                    <ul className="pagination justify-content-center mt-4">
                        {Array.from({
                          length: Math.ceil(
                            (favoriteTab === "hospital" ? hospitalList.length : pharmacyList.length) /
                              itemsPerPage
                          ),
                        }).map((_, i) => (
                          <li key={i} className={`page-item ${activePage === i + 1 ? "active" : ""}`}>
                            <button className="page-link" onClick={() => handlePageChange(i + 1)}>
                              {i + 1}
                            </button>
                          </li>
                        ))}
                      </ul>
                  </>
                )}

                {/* 내가 쓴 글 */} 
                {activeMenu === "mypost" && (
                  <>
                    <Nav className="custom-tabs mb-4">
                      <Nav.Item>
                        <Nav.Link
                          className={`tab-link ${postTab === "post" ? "active" : ""}`}
                          onClick={() => setPostTab("post")}
                        >
                          게시글
                        </Nav.Link>
                      </Nav.Item>
                      <Nav.Item>
                        <Nav.Link
                          className={`tab-link ${postTab === "comment" ? "active" : ""}`}
                          onClick={() => setPostTab("comment")}
                        >
                          댓글
                        </Nav.Link>
                      </Nav.Item>
                    </Nav>

                    {postTab === "post" && (
                      <>
                        {[1, 2].map((n, idx) => ( // 예시: 2개 더미 게시글
                          <React.Fragment key={idx}>
                            <div className="list-item p-3">
                              <strong>간경화 진단을 받았습니다..</strong>
                              <p className="text-muted mb-2">
                                최근 회식이 잦긴 했는데 이렇게 갑자기...
                              </p>
                              <div className="d-flex gap-3 text-muted">
                                <span>
                                  <FaHeart /> 25
                                </span>
                                <span>
                                  <FaRegCommentDots /> 11
                                </span>
                              </div>
                            </div>
                            {idx < 1 && <hr className="divider my-2" />}
                          </React.Fragment>
                        ))}
                      </>
                    )}

                    {postTab === "comment" && (
                      <p className="text-center text-secondary small mt-5">
                        작성한 댓글이 없습니다.
                      </p>
                    )}

                    {/* 페이지네이션 */}
                    <ul className="pagination justify-content-center mt-4">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <li key={n} className={`page-item ${activePage === n ? "active" : ""}`}>
                          <button className="page-link" onClick={() => handlePageChange(n)}>
                            {n}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </>
                )}

                {/* 회원정보 수정 */}
                {activeMenu === "profile" && (
                  <div className="px-3 px-md-5 py-3">
                    <Form>
                      <Form.Group className="mb-3" controlId="formRank">
                        <Form.Label>등급</Form.Label>
                        <Form.Control type="text" value="일반 회원" readOnly />
                      </Form.Group>

                      <Form.Group className="mb-3" controlId="formEmail">
                        <Form.Label>이메일</Form.Label>
                        <Form.Control
                          type="email"
                          value="limdoyung@naver.com"
                          readOnly
                        />
                      </Form.Group>

                      <Form.Group className="mb-3" controlId="formId">
                        <Form.Label>아이디</Form.Label>
                        <Form.Control type="text" value="limdo" readOnly />
                      </Form.Group>

                      <Form.Group className="mb-3" controlId="formPassword">
                        <Form.Label>비밀번호</Form.Label>
                        <Form.Control type="password" value="******" readOnly />
                      </Form.Group>

                      <Form.Group className="mb-4" controlId="formAge">
                        <Form.Label>
                          나이 <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Select>
                          <option>연령대를 선택하면 관련 안내를 받을 수 있어요.</option>
                          <option>10대</option>
                          <option>20대</option>
                          <option>30대</option>
                          <option>40대</option>
                          <option>50대 이상</option>
                        </Form.Select>
                      </Form.Group>

                      <div className="text-end">
                        <Button
                          variant="primary"
                          style={{
                            backgroundColor: "#3341F3",
                            borderColor: "#3341F3",
                          }}
                        >
                          회원정보 수정
                        </Button>
                      </div>
                    </Form>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </Container>
    </>
  );
};

function setActiveTabAndResetPage(value, setTab, setPage) {
  setTab(value);
  setPage(1);
}

export default MyPage;
