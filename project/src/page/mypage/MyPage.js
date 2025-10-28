import React, { useState, useEffect } from "react";
import "../../App.css";
import "../../css/MyPage.css";
import {Container,Row,Col,Card,ListGroup,Button,Nav,Form,Spinner,} from "react-bootstrap";
import {FaBookmark,FaCommentDots,FaStar,FaHeart,FaRegCommentDots,FaRegStar,} from "react-icons/fa";
import { getFavorites, toggleFavorite } from "../../api/favoriteApi";
import { useNavigate } from "react-router-dom";
import { modifyUser } from "../../api/userApi";
import useCustomLogin from "../../hook/useCustomLogin";
import PageComponent from "../../component/common/PageComponent";
import { useSelector } from "react-redux";

const MyPage = () => {
  const initUser = {
    username: "",
    email: "",
    address: "",
    age: "",
  };
  const [user, setUser] = useState(initUser);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUser((prev) => ({ ...prev, [name]: value }));
  };

  const loginInfo = useSelector((state) => state.loginSlice);

  useEffect(() => {
    if (!loginInfo) return;
    setUser((prev) => ({
      ...prev,
      username: loginInfo.username ?? prev.username,
      email: loginInfo.email ?? prev.email,
      address: loginInfo.address ?? prev.address,
      age: loginInfo.age ?? prev.age,
    }));
  }, [loginInfo]);

  // ---------- 화면 탭/리스트 상태 ----------
  const [activeMenu, setActiveMenu] = useState("favorite");
  const [favoriteTab, setFavoriteTab] = useState("hospital");
  const [postTab, setPostTab] = useState("post");

  const [hospitalList, setHospitalList] = useState([]);
  const [pharmacyList, setPharmacyList] = useState([]);
  const [unfavorited, setUnfavorited] = useState({});
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const { isLogin, moveToLoginReturn } = useCustomLogin();

  const [pageData, setPageData] = useState({
    current: 0,
    totalPages: 1,
    totalElements: 0,
    size: 10,
  });

  // 즐겨찾기 데이터 불러오기
  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const hospitalIdsRaw = await getFavorites("HOSPITAL");
        const pharmacyIdsRaw = await getFavorites("PHARMACY");

        const hospitalIds = Array.isArray(hospitalIdsRaw) ? hospitalIdsRaw : [];
        const pharmacyIds = Array.isArray(pharmacyIdsRaw) ? pharmacyIdsRaw : [];

        const hospitalData = await Promise.all(
          hospitalIds.map((id) =>
            fetch(`http://localhost:8080/project/hospital/${id}`).then((res) =>
              res.json()
            )
          )
        );
        const pharmacyData = await Promise.all(
          pharmacyIds.map((id) =>
            fetch(`http://localhost:8080/project/pharmacy/${id}`).then((res) =>
              res.json()
            )
          )
        );

        const hospitals = hospitalData.filter(Boolean);
        const pharmacies = pharmacyData.filter(Boolean);

        setHospitalList(hospitals);
        setPharmacyList(pharmacies);

        const totalForTab =
          favoriteTab === "hospital" ? hospitals.length : pharmacies.length;

        setPageData({
          current: 0,
          totalPages: Math.ceil(totalForTab / 10) || 1,
          totalElements: totalForTab,
          size: 10,
        });
      } catch (err) {
        console.error("즐겨찾기 데이터를 불러오는 중 오류 발생:", err);
      } finally {
        setLoading(false);
      }
    };

    if (isLogin) fetchFavorites();
  }, [isLogin, favoriteTab]);

  // 페이지 이동
  const handlePageChange = (pageNum) => {
    setPageData((prev) => ({ ...prev, current: pageNum }));
  };

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

  // 회원정보 수정 버튼
  const handleClickModify = async () => {
    try {
      await modifyUser(user);
      alert("회원정보 수정이 되었습니다.");
    } catch (e) {
      console.error(e);
      alert("수정 중 오류가 발생했습니다.");
    }
  };

  if (!isLogin) {
    return moveToLoginReturn();
  }

  // 페이지네이션
  const startIdx = pageData.current * pageData.size;
  const endIdx = startIdx + pageData.size;
  const displayedHospitals = hospitalList.slice(startIdx, endIdx);
  const displayedPharmacies = pharmacyList.slice(startIdx, endIdx);

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
                  <div className="avatar-logo">+</div>
                </div>

                {/* 이름/등급/버튼 묶음 */}
                <div className="text-start">
                  <div className="d-flex align-items-center flex-wrap gap-2 mb-2">
                    <h4 className="fw-bold mb-0">{user.username || "회원"}</h4>
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
                    <span className="fw-bold text-primary">
                      {hospitalList.length + pharmacyList.length}
                    </span>
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
                <Card.Body
                  className={`${
                    (hospitalList.length === 0 && favoriteTab === "hospital") ||
                    (pharmacyList.length === 0 && favoriteTab === "pharmacy")
                      ? "d-flex justify-content-center align-items-center"
                      : ""
                  }`}
                  style={{ minHeight: "400px" }}
                >
                  {/* 즐겨찾기 */}
                  {activeMenu === "favorite" && (
                    <>
                      <Nav className="custom-tabs mb-4">
                        <Nav.Item>
                          <Nav.Link
                            className={`tab-link ${
                              favoriteTab === "hospital" ? "active" : ""
                            }`}
                            onClick={() => {
                              setFavoriteTab("hospital");
                              setPageData((prev) => ({ ...prev, current: 0 }));
                            }}
                          >
                            병원
                          </Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                          <Nav.Link
                            className={`tab-link ${
                              favoriteTab === "pharmacy" ? "active" : ""
                            }`}
                            onClick={() => {
                              setFavoriteTab("pharmacy");
                              setPageData((prev) => ({ ...prev, current: 0 }));
                            }}
                          >
                            약국
                          </Nav.Link>
                        </Nav.Item>
                      </Nav>

                      {/* 로딩 중 */}
                      {loading && (
                        <div className="text-center my-4">
                          <Spinner animation="border" variant="primary" />
                          <p className="mt-2 text-secondary small">
                            불러오는 중...
                          </p>
                        </div>
                      )}

                      {/* 병원 즐겨찾기 */}
                      {!loading && favoriteTab === "hospital" && (
                        <>
                          {hospitalList.length === 0 ? (
                            <p className="text-center text-secondary small mt-5">
                              즐겨찾기한 병원이 없습니다.
                            </p>
                          ) : (
                            displayedHospitals.map((h, idx) => (
                              <React.Fragment key={h.hospitalId || idx}>
                                <div
                                  className="list-item p-3"
                                  onClick={() =>
                                    navigate(`/hospitaldetail/${h.hospitalId}`)
                                  }
                                >
                                  <strong>{h.hospitalName}</strong>
                                  <div className="my-2 d-flex align-items-center">
                                    <span className="badge-road me-2">
                                      도로명
                                    </span>
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
                                        handleToggleFavorite(
                                          "HOSPITAL",
                                          h.hospitalId
                                        );
                                      }}
                                    />
                                  ) : (
                                    <FaStar
                                      className="favorite-star"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleToggleFavorite(
                                          "HOSPITAL",
                                          h.hospitalId
                                        );
                                      }}
                                    />
                                  )}
                                </div>
                                {idx < displayedHospitals.length - 1 && (
                                  <hr className="divider my-2" />
                                )}
                              </React.Fragment>
                            ))
                          )}
                          {hospitalList.length > 0 && (
                            <PageComponent
                              pageResponse={{
                                dtoList: [],
                                page: pageData.current + 1,
                                start: 1,
                                end: Math.ceil(
                                  hospitalList.length / pageData.size
                                ),
                                prev: pageData.current > 0,
                                next:
                                  pageData.current <
                                  Math.ceil(
                                    hospitalList.length / pageData.size
                                  ) -
                                    1,
                                totalPages: Math.ceil(
                                  hospitalList.length / pageData.size
                                ),
                              }}
                              movePage={(num) => handlePageChange(num - 1)}
                            />
                          )}
                        </>
                      )}

                      {/* 약국 즐겨찾기 */}
                      {!loading && favoriteTab === "pharmacy" && (
                        <>
                          {pharmacyList.length === 0 ? (
                            <p className="text-center text-secondary small mt-5">
                              즐겨찾기한 약국이 없습니다.
                            </p>
                          ) : (
                            displayedPharmacies.map((p, idx) => (
                              <React.Fragment key={p.pharmacyId || idx}>
                                <div
                                  className="list-item p-3"
                                  onClick={() =>
                                    navigate(
                                      `/pharmacydetail/${p.pharmacyId}`
                                    )
                                  }
                                >
                                  <strong>{p.pharmacyName}</strong>
                                  <div className="my-2 d-flex align-items-center">
                                    <span className="badge-road me-2">
                                      도로명
                                    </span>
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
                                        handleToggleFavorite(
                                          "PHARMACY",
                                          p.pharmacyId
                                        );
                                      }}
                                    />
                                  ) : (
                                    <FaStar
                                      className="favorite-star"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleToggleFavorite(
                                          "PHARMACY",
                                          p.pharmacyId
                                        );
                                      }}
                                    />
                                  )}
                                </div>
                                {idx < displayedPharmacies.length - 1 && (
                                  <hr className="divider my-2" />
                                )}
                              </React.Fragment>
                            ))
                          )}
                          {pharmacyList.length > 0 && (
                            <PageComponent
                              pageResponse={{
                                dtoList: [],
                                page: pageData.current + 1,
                                start: 1,
                                end: Math.ceil(
                                  pharmacyList.length / pageData.size
                                ),
                                prev: pageData.current > 0,
                                next:
                                  pageData.current <
                                  Math.ceil(
                                    pharmacyList.length / pageData.size
                                  ) -
                                    1,
                                totalPages: Math.ceil(
                                  pharmacyList.length / pageData.size
                                ),
                              }}
                              movePage={(num) => handlePageChange(num - 1)}
                            />
                          )}
                        </>
                      )}
                    </>
                  )}

                  {/* 내가 쓴 글 */}
                  {activeMenu === "mypost" && (
                    <>
                      <Nav className="custom-tabs mb-4">
                        <Nav.Item>
                          <Nav.Link
                            className={`tab-link ${
                              postTab === "post" ? "active" : ""
                            }`}
                            onClick={() => setPostTab("post")}
                          >
                            게시글
                          </Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                          <Nav.Link
                            className={`tab-link ${
                              postTab === "comment" ? "active" : ""
                            }`}
                            onClick={() => setPostTab("comment")}
                          >
                            댓글
                          </Nav.Link>
                        </Nav.Item>
                      </Nav>

                      {postTab === "post" && (
                        <>
                          {[1, 2].map((n, idx) => (
                            // 예시 더미
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
                        <p className="text-center text-muted mt-5">
                          작성한 댓글이 없습니다.
                        </p>
                      )}
                    </>
                  )}

                  {/* 회원정보 수정 */}
                  {activeMenu === "profile" && (
                    <div className="px-3 px-md-5 py-3">
                      <Form>
                        {/* 주소: 수정 가능 */}
                        <Form.Group className="mb-3" controlId="formAddress">
                          <Form.Label>주소</Form.Label>
                          <Form.Control
                            type="text"
                            name="address"
                            value={user.address ?? ""}
                            onChange={handleChange}
                            placeholder="도로명 주소를 입력하세요"
                          />
                        </Form.Group>

                        {/* 이메일: DB 값 보이게 + 수정 가능 */}
                        <Form.Group className="mb-3" controlId="formEmail">
                          <Form.Label>이메일</Form.Label>
                          <Form.Control
                            type="email"
                            name="email"
                            value={user.email ?? ""} // 예: 'siny0913@naver.com'
                            onChange={handleChange}
                          />
                        </Form.Group>


                        {/* 나이: 수정 가능 */}
                        <Form.Group className="mb-4" controlId="formAge">
                          <Form.Label>
                            나이 <span className="text-danger">*</span>
                          </Form.Label>
                          <Form.Control
                            type="number"
                            name="age"
                            value={user.age ?? ""}
                            onChange={handleChange}
                            min="1"
                            placeholder="나이를 입력하세요"
                          />
                        </Form.Group>

                        {/* 버튼: 왼쪽 회색(비밀번호 변경) / 오른쪽 파란(회원정보 수정) */}
                        <div className="d-flex justify-content-end gap-2">
                          <Button
                            variant="secondary"
                            style={{
                              backgroundColor: "#6c757d",
                              borderColor: "#6c757d",
                            }}
                            onClick={() => navigate("/finduserpw")}
                          >
                            비밀번호 변경
                          </Button>

                          <Button
                            variant="primary"
                            style={{
                              backgroundColor: "#3341F3",
                              borderColor: "#3341F3",
                            }}
                            onClick={handleClickModify}
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

export default MyPage;
