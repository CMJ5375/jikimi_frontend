import { useEffect, useState } from "react";
import '../../App.css';
import "../../css/Pharmacy.css";
import { Container, Row, Col, Card, Button, Form, Dropdown } from "react-bootstrap";
import { GeoAltFill, StarFill, Star, TelephoneFill, CheckCircleFill, XCircleFill } from "react-bootstrap-icons";
import { useNavigate } from "react-router-dom";
import useFavorites from "../../hook/useFavorites";
import useFacilitySearch from "../../hook/useFacilitySearch";
import PageComponent from "../../component/common/PageComponent";
import KakaoMapComponent from "../../component/common/KakaoMapComponent";

const PharmacyMain = () => {
  const [distance, setDistance] = useState("")
  const [keyword, setKeyword] = useState("")
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)

  const { results, pageData, currentPos, search } = useFacilitySearch("pharmacy");
  const { favorites, toggle, check } = useFavorites("PHARMACY");
  const navigate = useNavigate()

  //드롭다운 거리
  const distanceList = ["500m", "1km", "5km", "10km"]

  // 즐겨찾기 필터 적용
  const displayedResults = showFavoritesOnly
    ? results.filter(r => favorites.includes(String(r.pharmacyId)))
    : results;

  return (
    <>
      <div className="bg-white">
        <Container className="py-4">
          {/* 상단 소개 */}
          <Row className="g-3 mb-3 align-items-center">
            <Col xs={6}>
              <div className="d-flex align-items-center gap-2 text-secondary mb-2">
                <GeoAltFill size={18}/>
                <small>경기도 성남시 중원구</small>
              </div>
              <h3 className="fw-bold lh-base mb-3 pharmacy-title">
                지금 나에게<br/>딱 맞는 <span>약국</span>을 찾아보세요
              </h3>
            </Col>
            <Col xs={6} className="text-end">
              <img src="/image/map.png" alt="지도" height="150"/>
            </Col>
          </Row>

          {/* 병원 / 약국 선택 카드 */}
          <Row className="g-3 mb-4">
          <Col xs={6}>
            <Card className="card-pharmacy-gray text-dark" onClick={() => navigate("/")}>
              <Card.Body>
                <img src="/image/hospitalBed.png" alt="병원" />
                <div className="fw-semibold">병원</div>
              </Card.Body>
            </Card>
          </Col>
          <Col xs={6}>
            <Card className="card-pharmacy-blue text-white" onClick={() => navigate("/pharmacy")}>
              <Card.Body>
                <img src="/image/pharmacy.png" alt="약국" />
                <div className="fw-semibold">약국</div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

          {/* 검색 폼 */}
          <Form onSubmit={search}>
            <Dropdown className="mb-3 dropdown-custom">
              <Dropdown.Toggle variant="light" className="text-dark d-flex justify-content-between align-items-center">
                <span className={distance ? "" : "text-secondary"}>{distance || "거리 선택"}</span>
                <i className="bi bi-chevron-down"></i>
              </Dropdown.Toggle>
              <Dropdown.Menu>
                {distanceList.map(d => <Dropdown.Item key={d} onClick={() => setDistance(d)}>{d}</Dropdown.Item>)}
                <Dropdown.Divider/>
                <Dropdown.Item onClick={() => setDistance("")}>선택 해제</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>

            {/* 검색창 */}
            <Form.Control
              type="text"
              placeholder="약국 이름을 입력하세요."
              className="search-input mb-3"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
            <Button type="submit" className="btn-search w-100">내 주변 약국 검색</Button>
          </Form>

          {/* 즐겨찾기만 보기 토글 버튼 */}
          {results.length > 0 && (
            <>
              <hr className="hr-line my-3"/>
              <div className="d-flex justify-content-start align-items-center mt-4 mb-3">
                <Button variant="light" onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                        className="border-0 d-flex align-items-center gap-2">
                  {showFavoritesOnly ? <StarFill color="#FFD43B" size={20}/> : <Star color="#aaa" size={20}/>}
                  <span className="small">{showFavoritesOnly ? "즐겨찾기만 보기" : "전체 보기"}</span>
                </Button>
              </div>
            </>
          )}

          {/* 지도 */}
          {displayedResults.length > 0 && currentPos.lat && (
            <KakaoMapComponent
              id="map"
              lat={currentPos.lat}
              lng={currentPos.lng}
              name="약국 위치"
              height={400}
            />
          )}

          {/* 검색 결과 */}
          {displayedResults.length > 0 && (
            <>
              <div className="mt-4">
                {displayedResults.map((item) => (
                  <Card
                    key={item.id}
                    className="result-card mb-3"
                    onClick={() => navigate(`/pharmacydetail/${item.id}`)}
                  >
                    <Card.Body>
                      <h5 className="fw-bold my-2 d-flex justify-content-between align-items-center">
                        <span>
                          {item.name}
                          <span className="result-distance">({item.distance})</span>
                        </span>
                        <span
                          className="favorite-icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggle(item.id);
                          }}
                        >
                          {favorites.includes(String(item.id)) ? (
                            <StarFill size={30} color="#FFD43B" />
                          ) : (
                            <Star size={30} />
                          )}
                        </span>
                      </h5>

                      <div className="my-3 d-flex align-items-center">
                        <span className="badge-road">도로명</span>
                        <span className="text-gray">{item.address}</span>
                      </div>

                      <div className="d-flex align-items-center justify-content-between">
                        <div className="text-gray d-flex align-items-center gap-2">
                          <TelephoneFill className="me-1" /> {item.phone}
                        </div>
                        <div
                          className={`small fw-semibold ${
                            item.open ? "text-success" : "text-secondary"
                          }`}
                        >
                          {item.open ? (
                            <>
                              <CheckCircleFill size={18} /> 영업 중
                            </>
                          ) : (
                            <>
                              <XCircleFill size={18} /> 영업 종료
                            </>
                          )}
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                ))}
              </div>
              <PageComponent pageData={pageData} onPageChange={(n) => search(null, n)} />
            </>
          )}

          {/* 검색 결과 없음 */}
          {results.length === 0 && keyword && (
            <div className="text-center text-secondary mt-4">
              검색 결과가 없습니다.
            </div>
          )}
        </Container>
      </div>
    </>
  );
};

export default PharmacyMain
