import React, { useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  ListGroup,
  Button,
  Nav,
  Pagination,
  Form,
} from "react-bootstrap";
import {
  FaBookmark,
  FaCommentDots,
  FaStar,
  FaHeart,
  FaRegCommentDots,
} from "react-icons/fa";
import "./MyPage.css";
import useCustomLogin from "../hook/useCustomLogin";

const MyPage = () => {
  const [activeMenu, setActiveMenu] = useState("favorite");
  const [favoriteTab, setFavoriteTab] = useState("hospital");
  const [postTab, setPostTab] = useState("post");
  const [activePage, setActivePage] = useState(1);

  const handlePageChange = (page) => setActivePage(page);

  // 로그인 상태, 로그인상태체크 후 로그인상태가 아니면 로그인페이지로 이동
  const {isLogin, moveToLoginReturn} = useCustomLogin()

  if(!isLogin) {
      return moveToLoginReturn()
  }

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
                  <span className="fw-bold text-primary">5</span>
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
                          className={`tab-link ${
                            favoriteTab === "hospital" ? "active" : ""
                          }`}
                          onClick={() => setFavoriteTab("hospital")}
                        >
                          병원
                        </Nav.Link>
                      </Nav.Item>
                      <Nav.Item>
                        <Nav.Link
                          className={`tab-link ${
                            favoriteTab === "pharmacy" ? "active" : ""
                          }`}
                          onClick={() => setFavoriteTab("pharmacy")}
                        >
                          약국
                        </Nav.Link>
                      </Nav.Item>
                    </Nav>

                    {favoriteTab === "hospital" && (
                      <>
                        <div className="hospital-item">
                          <strong>성남소아과</strong>
                          <p>
                            <span className="badge bg-light text-dark me-2">
                              도로명
                            </span>
                            경기 성남시 수정구 수정로171번길
                          </p>
                          <FaStar className="favorite-star" />
                        </div>
                        <hr />
                        <div className="hospital-item">
                          <strong>성남소아과</strong>
                          <p>
                            <span className="badge bg-light text-dark me-2">
                              도로명
                            </span>
                            경기 성남시 수정구 수정로171번길
                          </p>
                          <FaStar className="favorite-star" />
                        </div>
                      </>
                    )}

                    {favoriteTab === "pharmacy" && (
                      <>
                        <div className="hospital-item">
                          <strong>열린약국</strong>
                          <p>
                            <span className="badge bg-light text-dark me-2">
                              도로명
                            </span>
                            경기 성남시 중원구 산성대로 234
                          </p>
                          <FaStar className="favorite-star" />
                        </div>
                        <hr />
                        <div className="hospital-item">
                          <strong>365온누리약국</strong>
                          <p>
                            <span className="badge bg-light text-dark me-2">
                              도로명
                            </span>
                            경기 성남시 수정구 복정로 45
                          </p>
                          <FaStar className="favorite-star" />
                        </div>
                      </>
                    )}

                    <div className="d-flex justify-content-center mt-4">
                      <Pagination className="custom-pagination">
                        {[1, 2, 3, 4, 5].map((page) => (
                          <Pagination.Item
                            key={page}
                            active={activePage === page}
                            onClick={() => handlePageChange(page)}
                          >
                            {page}
                          </Pagination.Item>
                        ))}
                      </Pagination>
                    </div>
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
                        <div className="hospital-item">
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
                        <hr />
                        <div className="hospital-item">
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
                      </>
                    )}

                    {postTab === "comment" && (
                      <p className="text-center text-muted mt-5">
                        작성한 댓글이 없습니다.
                      </p>
                    )}

                    <div className="d-flex justify-content-center mt-4">
                      <Pagination className="custom-pagination">
                        {[1, 2, 3, 4, 5].map((page) => (
                          <Pagination.Item
                            key={page}
                            active={activePage === page}
                            onClick={() => handlePageChange(page)}
                          >
                            {page}
                          </Pagination.Item>
                        ))}
                      </Pagination>
                    </div>
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

export default MyPage;
