import React, { useState, useEffect } from "react";
import "../../App.css";
import "../../css/MyPage.css";
import { Container, Row, Col, Card, ListGroup, Button, Nav, Form, Spinner } from "react-bootstrap";
import { FaBookmark, FaCommentDots, FaStar, FaHeart, FaRegCommentDots, FaRegStar } from "react-icons/fa";
import { getFavorites, toggleFavorite } from "../../api/favoriteApi";
import { fetchMyPosts } from "../../api/postApi";
import { useNavigate } from "react-router-dom";
import { modifyUser, updateProfileApi } from "../../api/userApi";
import { useSelector, useDispatch } from "react-redux";
import { getCookie, setCookie } from "../../util/cookieUtil";
import useCustomLogin from "../../hook/useCustomLogin";
import PageComponent from "../../component/common/PageComponent";
import MyCommentsPanel from "./MyCommentsPanel";
import MyPostsPanel from "./MyPostsPanel";
import { API_SERVER_HOST } from "../../config/api";
//프로필 업로드하면 유지가 안되어서 수정차..
const toAbsUrl = (u) => (!u ? u : u.startsWith("http") ? u : `${API_SERVER_HOST}${u}`);

const MyPage = () => {
  const dispatch = useDispatch();
  const [activeMenu, setActiveMenu] = useState("favorite");
  const [favoriteTab, setFavoriteTab] = useState("hospital");
  const [postTab, setPostTab] = useState("post");
  const [postCount, setPostCount] = useState(0);
  const [hospitalList, setHospitalList] = useState([]);
  const [pharmacyList, setPharmacyList] = useState([]);
  const [unfavorited, setUnfavorited] = useState({});
  const [loading, setLoading] = useState(true);

  //프로필 추가 2줄
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [profileUrl, setProfileUrl] = useState(null);

  //프로필 이미지 선택 핸들러
  const onPickImage = (e) => {
  const f = e.target.files?.[0];
    if (!f) {
      setFile(null);
      setPreview(null);
      return;
    }
    // 간단한 유효성 검사(옵션)
    if (!f.type.startsWith("image/")) {
      alert("이미지 파일만 업로드할 수 있습니다.");
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      alert("이미지는 최대 5MB까지 업로드할 수 있어요.");
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  //프로필 저장 버튼 핸들러
  const onSaveProfile = async () => {
    if (!loginInfo?.username) return alert("로그인 정보가 없습니다.");

    const form = new FormData();
    // 텍스트 필드
    if (user.name) form.append("name", user.name);
    if (user.address) form.append("address", user.address);
    if (user.age) form.append("age", user.age);
    // 파일
    if (file) form.append("image", file);

    try {
      const res = await updateProfileApi(loginInfo.username, form);
      alert("프로필이 저장되었습니다.");

      // 서버가 최신 프로필 URL을 돌려준다고 가정 (예: res.profileImage)
      if (res?.profileImage) {
        setProfileUrl(`${toAbsUrl(res.profileImage)}?t=${Date.now()}`);
        setPreview(null);
        setFile(null);
      }

      // ✅ 쿠키(member) 갱신: 새로고침 후에도 유지되도록
      const member = getCookie("member");
      if (member) {
        const next = {
          ...member,
          accessToken: res?.accessToken ?? member.accessToken,
          refreshToken: res?.refreshToken ?? member.refreshToken,
          profileImage: res?.profileImage ?? member.profileImage,
          name: res?.name ?? member.name,
          address: res?.address ?? member.address,
          age: res?.age ?? member.age,
        };
        // 만료일은 프로젝트 기준으로 조정(여기선 1일 예시)
        setCookie("member", next, 1);
      }
      
    } catch (e) {
      console.error(e);
      alert("프로필 저장 중 오류가 발생했습니다.");
    }
  };

  const handleChange = (e) => {
      const { name, value } = e.target;
      setUser((prev) => ({ ...prev, [name]: value }));
    };
  const navigate = useNavigate();
  const {isLogin, moveToLoginReturn} = useCustomLogin()
  const loginInfo = useSelector((state) => state.loginSlice);
  const [pageData, setPageData] = useState({
    current: 0,
    totalPages: 1,
    totalElements: 0,
    size: 10,
  });
  const [user, setUser] = useState({
    username: "", //이거 아이디임 헷갈리면 안됨
    email: "",
    name: "",
    address: "",
    age: "",
  });

  useEffect(() => {
    if (!loginInfo) return;
    setUser((prev) => ({
      ...prev,
      username: loginInfo.username ?? prev.username,
      email: loginInfo.email ?? prev.email,
      address: loginInfo.address ?? prev.address,
      age: loginInfo.age ?? prev.age,
      name: loginInfo.name ?? prev.name, // name 도 쓰면 폼에서 활용 가능
    }));
    // 로그인 정보 또는 쿠키의 profileImage로 초기화 (새로고침 대비)
    const cookieMember = getCookie("member");
    const imgPath = loginInfo.profileImage || cookieMember?.profileImage;
    if (imgPath) {
      setProfileUrl((prev) => prev ?? toAbsUrl(imgPath));
    }
  }, [loginInfo]);

  // 내가 쓴 글 개수 가져오기
  useEffect(() => {
    const loadMyPosts = async () => {
      try {
        const posts = await fetchMyPosts();
        setPostCount(posts.length || 0);
      } catch (err) {
        console.error("내가 쓴 글 개수를 불러오는 중 오류:", err);
        setPostCount(0);
      }
    };
    if (isLogin) loadMyPosts();
  }, [isLogin]);

  // 즐겨찾기 데이터 불러오기
  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const hospitalIds = await getFavorites("HOSPITAL");
        const pharmacyIds = await getFavorites("PHARMACY");

        const hospitalData = await Promise.all(
          hospitalIds.map((id) =>
            fetch(`${API_SERVER_HOST}/project/hospital/${id}`).then((res) => res.json())
           )
        );
        const pharmacyData = await Promise.all(
          pharmacyIds.map((id) =>
           fetch(`${API_SERVER_HOST}/project/pharmacy/${id}`).then((res) => res.json())
          )
        );

        const hospitals = hospitalData.filter(Boolean);
        const pharmacies = pharmacyData.filter(Boolean);

        setHospitalList(hospitals);
        setPharmacyList(pharmacies);
        setPageData({
          current: 0,
          totalPages: Math.ceil(
            (favoriteTab === "hospital" ? hospitals.length : pharmacies.length) / 10
          ),
          totalElements: favoriteTab === "hospital" ? hospitals.length : pharmacies.length,
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
  const handleClickModify = async () => {
    try {
      await modifyUser(user);
      alert("회원정보 수정이 되었습니다.");
    } catch (e) {
      console.error(e);
      alert("수정 중 오류가 발생했습니다.");
    }
  };

  if(!isLogin) {
      return moveToLoginReturn()
  }

  // 페이지네이션
  const startIdx = pageData.current * pageData.size;
  const endIdx = startIdx + pageData.size;
  const displayedHospitals = hospitalList.slice(startIdx, endIdx);
  const displayedPharmacies = pharmacyList.slice(startIdx, endIdx);
  const totalPagesHospital = Math.ceil(hospitalList.length / pageData.size) || 1;
  const totalPagesPharmacy = Math.ceil(pharmacyList.length / pageData.size) || 1;

  const currentTotalPages = favoriteTab === "hospital" ? totalPagesHospital : totalPagesPharmacy;
  const pageNumList = Array.from({ length: currentTotalPages }, (_, i) => i + 1);

  const pageDataForComponent = {
    current: pageData.current + 1,
    pageNumList,
    prev: pageData.current > 0,
    next: pageData.current < currentTotalPages - 1,
  };

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
              <div className="mypage-avatar overflow-hidden d-flex align-items-center justify-content-center">
                {preview ? (
                  <img src={preview} alt="미리보기" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : profileUrl ? (
                  <img src={profileUrl} alt="프로필" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <div className="avatar-logo">+</div>
                )}
              </div>

              {/* 이름/등급/버튼 묶음 */}
              <div className="text-start">
                <div className="d-flex align-items-center flex-wrap gap-2 mb-2">
                  <h4 className="fw-bold mb-0">{user.username || '사용자'}</h4>
                  <span className="text-muted">일반 회원</span>
                </div>

                <div className="d-flex gap-2">
                  <Form.Label className="btn btn-light mypage-btn mb-0">
                    프로필 이미지 선택
                    <Form.Control
                      type="file"
                      accept="image/*"
                      onChange={onPickImage}
                      style={{ display: "none" }}
                    />
                  </Form.Label>

                  <Button
                    variant="primary"
                    className="mypage-btn"
                    onClick={onSaveProfile}
                    disabled={!file && !user.address && !user.age && !user.name} // 아무것도 변경이 없으면 비활성(선택)
                  >
                    저장
                  </Button>
                </div>
              </div>

              {/* 즐겨찾기 / 내가 쓴 글 */}
              <div className="d-flex ms-auto gap-5 justify-content-center stats-box">
                <div className="text-center">
                  <FaBookmark className="mypage-icon mb-1" />
                  <p className="mb-0">즐겨찾기</p>
                  <span className="fw-bold text-primary">{hospitalList.length + pharmacyList.length}</span>
                </div>
                <div className="text-center">
                  <FaCommentDots className="mypage-icon mb-1" />
                  <p className="mb-0">내가 쓴 글</p>
                  <span className="fw-bold text-primary">{postCount}</span>
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
                  className={`menu-item ${activeMenu === "favorite" ? "active-item" : ""}`}
                  onClick={() => setActiveMenu("favorite")}
                >
                  즐겨찾기
                </ListGroup.Item>
                <ListGroup.Item
                  action
                  className={`menu-item ${activeMenu === "mypost" ? "active-item" : ""}`}
                  onClick={() => setActiveMenu("mypost")}
                >
                  내가 쓴 글
                </ListGroup.Item>
                <ListGroup.Item
                  action
                  className={`menu-item ${activeMenu === "profile" ? "active-item" : ""}`}
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
                          className={`tab-link ${favoriteTab === "pharmacy" ? "active" : ""}`}
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
                        <p className="mt-2 text-secondary small">불러오는 중...</p>
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
                              pageData={pageDataForComponent}
                              onPageChange={(numZeroBased) => handlePageChange(numZeroBased)}
                            />
                          )}
                        </>
                      )}

                    {/* 약국 즐겨찾기 */}
                    {!loading && favoriteTab === "pharmacy" && (
                      <>
                        {pharmacyList.length === 0 ? (
                          <p className="text-center text-secondary small mt-5">즐겨찾기한 약국이 없습니다.</p>
                        ) : (
                          displayedPharmacies.map((p, idx) => (
                              <React.Fragment key={p.pharmacyId || idx}>
                                <div
                                  className="list-item p-3"
                                  onClick={() => navigate(`/pharmacydetail/${p.pharmacyId}`)}
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
                                      handleToggleFavorite("PHARMACY", p.pharmacyId);
                                    }}
                                  />
                                ) : (
                                  <FaStar
                                    className="favorite-star"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleToggleFavorite("PHARMACY", p.pharmacyId);
                                    }}
                                  />
                                )}
                              </div>
                              {idx < displayedPharmacies.length - 1 && ( <hr className="divider my-2" /> )}
                              </React.Fragment>
                            ))
                          )}
                          {pharmacyList.length > 0 && (
                            <PageComponent
                              pageData={pageDataForComponent}
                              onPageChange={(numZeroBased) => handlePageChange(numZeroBased)}
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

                    {postTab === "post" && <MyPostsPanel />}

                    {postTab === "comment" && <MyCommentsPanel />}

                  </>
                )}

               {/* 회원정보 수정 */}
                {activeMenu === "profile" && (
                  <div className="px-3 px-md-5 py-3">
                    <Form>
                      {/* 이름: 수정 가능 */}
                      <Form.Group className="mb-3" controlId="formName">
                        <Form.Label>이름</Form.Label>
                        <Form.Control
                          type="text"
                          name="name"
                          value={user.name ?? ""}
                          onChange={handleChange}
                          placeholder="이름을 입력하세요"
                        />
                      </Form.Group>
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

                      <Form.Group className="mb-3" controlId="formEmail">
                        <Form.Label>이메일</Form.Label>
                        <Form.Control
                          type="email"
                          name="email"
                          value={user.email ?? ""}
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
                          style={{ backgroundColor: "#6c757d", borderColor: "#6c757d" }}
                          onClick={() => navigate("/finduserpw")}
                        >
                          비밀번호 변경
                        </Button>

                        <Button
                          variant="primary"
                          style={{ backgroundColor: "#3341F3", borderColor: "#3341F3" }}
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
