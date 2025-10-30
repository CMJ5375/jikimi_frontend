import { useMemo, useState, useEffect } from "react";
import '../../App.css';
import "../../css/Hospital.css";
import { Container, Row, Col, Card, Button, Form, Dropdown } from "react-bootstrap";
import { GeoAltFill, StarFill, Star, TelephoneFill, HospitalFill, CheckCircleFill, XCircleFill } from "react-bootstrap-icons";
import { useNavigate } from "react-router-dom";
import useFavorites from "../../hook/useFavorites";
import useFacilitySearch from "../../hook/useFacilitySearch";
import PageComponent from "../../component/common/PageComponent";
import useCustomLogin from "../../hook/useCustomLogin";
import jwtAxios from "../../util/jwtUtil";
import { getDefaultPosition, getAddressFromBackend } from "../../api/kakaoMapApi";
// import { getCurrentPosition } from "../../api/geolocationApi";

const HospitalMain = () => {
  const [dept, setDept] = useState("");
  const [org, setOrg] = useState("");
  const [keyword, setKeyword] = useState("");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [favoriteResults, setFavoriteResults] = useState([]);
  const [pageData, setPageData] = useState({ current: 0, size: 10 });
  const [searched, setSearched] = useState(false);
  const [currentAddress, setCurrentAddress] = useState("위치 확인 중...");

  const { results, pageData: searchPageData, currentPos, search, setFilters, calculateDistance } = useFacilitySearch("hospital");
  const navigate = useNavigate();
  const { favorites, toggle, isLogin } = useFavorites("HOSPITAL");
  const { /* isLogin: 훅 내부에서 사용 중 */ } = useCustomLogin();

  //드롭다운 진료과목/기관종류
  const deptList = useMemo(
    () => ["소아청소년과", "응급의학과", "이비인후과", "산부인과", "정형외과", "내과", "안과", "외과"], []
  )
  const orgList = useMemo(
    () => ["상급종합병원", "정신병원", "종합병원", "치과의원", "한방병원", "보건소", "한의원", "병원", "의원"], []
  )

  // 현재 위치 불러오기(일단 기본위치 받아옴)
  // 만약 현재 위치 불러오고 싶으면 위 import의 주석 풀고 getDefaultPosition삭제 그리고 이 아래에 문구 삽입
  // const pos = await getCurrentPosition();
  useEffect(() => {
    const fetchAddress = async () => {
      try {
        const pos = await getDefaultPosition();
        const address = await getAddressFromBackend(pos.lat, pos.lng);
        setCurrentAddress(address);
      } catch (e) {
        console.error("주소 불러오기 실패:", e);
        setCurrentAddress("(기본)경기도 성남시 중원구 광명로 4");
      }
    };
    fetchAddress();
  }, []);

  //즐겨찾기 목록 전체 가져오기
  useEffect(() => {
    const fetchFavorites = async () => {
      if (!isLogin || !showFavoritesOnly) return;
      try {
        const allData = await Promise.all(
          favorites.map(async (id) => {
            const res = await jwtAxios.get(`/project/hospital/${id}`);
            const item = res.data;
            if (currentPos?.lat && item.facility?.latitude) {
              item.distance = calculateDistance(
                currentPos.lat,
                currentPos.lng,
                item.facility.latitude,
                item.facility.longitude
              );
            }
            return item;
          })
        );
        setFavoriteResults(allData.filter(Boolean));
        setPageData((prev) => ({ ...prev, current: 0 }));
      } catch (e) {
        console.error("즐겨찾기 병원 불러오기 실패:", e);
      }
    };
    fetchFavorites();
  }, [showFavoritesOnly, favorites, isLogin, currentPos]);

  const handleSubmit = (e) => {
    e.preventDefault();
    search(e, 0, { keyword, org, dept });
    setSearched(true);
  };

  const handleToggleFavoritesOnly = () => {
    const next = !showFavoritesOnly;
    setShowFavoritesOnly(next);
    setFilters((prev) => ({ ...prev, onlyFavorites: next }));
  };

  const displayedResults = showFavoritesOnly
    ? favoriteResults.slice(pageData.current * pageData.size, (pageData.current + 1) * pageData.size)
    : results;

  const totalPages = showFavoritesOnly
    ? Math.ceil(favoriteResults.length / pageData.size)
    : (searchPageData?.pageNumList?.length || 1);

  const pagination = {
    current: (showFavoritesOnly ? pageData.current : searchPageData?.current || 0) + 1,
    pageNumList: Array.from({ length: totalPages }, (_, i) => i + 1),
    prev: (showFavoritesOnly ? pageData.current : searchPageData?.current || 0) > 0,
    next: (showFavoritesOnly ? pageData.current : searchPageData?.current || 0) < totalPages - 1,
  };

  const handlePageChange = (n) => {
    if (showFavoritesOnly) {
      setPageData((prev) => ({ ...prev, current: n }));
    } else {
      search(null, n, { keyword, org, dept });
    }
  };

  return (
    <div className="bg-white">
      <Container className="py-4">
        {/* 상단 안내 */}
        <Row className="g-3 mb-3 align-items-center">
          <Col xs={6}>
            <div className="d-flex align-items-center gap-2 text-secondary mb-2">
              <GeoAltFill size={15} />
              <small>{currentAddress}</small>
            </div>
            <h3 className="fw-bold lh-base mb-3 hospital-title">
              지금 나에게<br />딱 맞는 <span>병원</span>을 찾아보세요
            </h3>
          </Col>
          <Col xs={6} className="text-end">
            <img src="/image/map.png" alt="지도" height="150" />
          </Col>
        </Row>

        {/* 병원 / 약국 선택 버튼 */}
        <Row className="g-3 mb-4">
          <Col xs={6}>
            <Card className="card-hospital-blue text-white" onClick={() => navigate("/")}>
              <Card.Body>
                <img src="/image/hospitalBed.png" alt="병원" />
                <div className="fw-semibold">병원</div>
              </Card.Body>
            </Card>
          </Col>
          <Col xs={6}>
            <Card className="card-hospital-gray text-dark" onClick={() => navigate("/pharmacy")}>
              <Card.Body>
                <img src="/image/pharmacy.png" alt="약국" />
                <div className="fw-semibold">약국</div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* 검색 폼 */}
        <Form onSubmit={handleSubmit}>
          {/* 진료과목 선택 */}
          <Dropdown className="mb-3 dropdown-custom">
            <Dropdown.Toggle variant="light" className="text-dark d-flex justify-content-between align-items-center">
              <span className={dept ? "" : "text-secondary"}>{dept || "진료과목"}</span>
              <i className="bi bi-chevron-down"></i>
            </Dropdown.Toggle>
            <Dropdown.Menu>
              {deptList.map((d) => (
                <Dropdown.Item key={d} onClick={() => setDept(d)}>{d}</Dropdown.Item>
              ))}
              <Dropdown.Divider />
              <Dropdown.Item onClick={() => setDept("")}>선택 해제</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>

          {/* 의료기관 */}
          <Dropdown className="mb-3 dropdown-custom">
            <Dropdown.Toggle variant="light" className="text-dark d-flex justify-content-between align-items-center">
              <span className={org ? "" : "text-secondary"}>{org || "의료기관"}</span>
              <i className="bi bi-chevron-down"></i>
            </Dropdown.Toggle>
            <Dropdown.Menu>
              {orgList.map((o) => (
                <Dropdown.Item key={o} onClick={() => setOrg(o)}>{o}</Dropdown.Item>
              ))}
              <Dropdown.Divider />
              <Dropdown.Item onClick={() => setOrg("")}>선택 해제</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>

          {/* 검색창 */}
          <Form.Control
            type="text"
            placeholder="병원 이름을 입력하세요."
            className="search-input mb-3"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          <Button type="submit" className="btn-search w-100">내 주변 병원 검색</Button>
        </Form>

        {/* 즐겨찾기만 보기 */}
        {isLogin && searched && (
          <>
            <hr className="hr-line my-3" />
            <div className="d-flex justify-content-start align-items-center mt-4 mb-2">
              <Button
                variant="light"
                onClick={handleToggleFavoritesOnly}
                className="border-0 d-flex align-items-center gap-2"
              >
                {showFavoritesOnly ? <StarFill color="#FFD43B" size={20}/> : <Star color="#aaa" size={20}/>}
                <span className="small">{showFavoritesOnly ? "즐겨찾기만 보기" : "전체 보기"}</span>
              </Button>
            </div>
          </>
        )}

        {/* 검색 결과 */}
        {displayedResults.length > 0 ? (
          <>
            <div className="mt-4">
              {displayedResults.map((item) => (
                <Card
                  key={item.hospitalId || item.id}
                  className="result-card mb-3"
                  onClick={() => navigate(`/hospitaldetail/${item.hospitalId || item.id}`)}
                >
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="text-gray">{item.orgType || item.facility?.orgType || "의료기관"}</span>
                      {isLogin && (
                        <span
                          className="favorite-icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggle(item.hospitalId || item.id);
                          }}
                        >
                          {favorites.includes(String(item.hospitalId || item.id)) ? (
                            <StarFill size={30} color="#FFD43B" />
                          ) : (
                            <Star size={30} />
                          )}
                        </span>
                      )}
                    </div>
                    <h5 className="fw-bold mb-2">
                      {item.hospitalName || item.name}
                      <span className="result-distance">({item.distance || "거리정보 없음"})</span>
                    </h5>
                    <div className="my-3 d-flex align-items-center">
                      <span className="badge-road">도로명</span>
                      <span className="text-gray">{item.facility?.address || item.address || "주소 정보 없음"}</span>
                    </div>
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="text-gray d-flex align-items-center gap-2">
                        <TelephoneFill className="me-1" /> {item.facility?.phone || item.phone || "전화 정보 없음"}
                      </div>
                      <div className="d-flex align-items-center gap-3">
                        {item.hasEmergency && (
                          <div className="d-flex align-items-center text-danger small fw-semibold">
                            <HospitalFill size={18} className="me-1" />
                            응급실 운영
                          </div>
                        )}

                        <div className={`small fw-semibold ${item.open ? "text-success" : "text-secondary"}`}>
                          {item.open ? (
                            <>
                              <CheckCircleFill size={18} /> 운영 중
                            </>
                          ) : (
                            <>
                              <XCircleFill size={18} /> 운영 종료
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              ))}
            </div>
            <PageComponent pageData={pagination} onPageChange={handlePageChange} />
          </>
          ) : (
            showFavoritesOnly && (
              <div className="text-center text-secondary mt-4">
                즐겨찾기한 병원이 없습니다.
              </div>
            )
          )}

        {/* 검색 결과 없음 */}
        {results.length === 0 && keyword && (
          <div className="text-center text-secondary mt-4">
            검색 결과가 없습니다.
          </div>
        )}
      </Container>
    </div>
  );
};

export default HospitalMain;
