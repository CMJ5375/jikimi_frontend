import { useEffect, useState } from "react";
import '../App.css';
import '../css/Pharmacy.css';
import { Container, Row, Col, Card, Button, Form, Dropdown } from "react-bootstrap";
import { GeoAltFill, StarFill, TelephoneFill } from "react-bootstrap-icons";
import { useNavigate } from "react-router-dom";
import { getDefaultPosition, addDistanceAndSort } from "../api/geolocationApi";
import { renderKakaoMap } from "../api/kakaoMapApi";

const colors = {
  primary: "#3B6CFF",
  primarySoft: "#E9F0FF",
  text: "#111",
  mute: "#6c757d",
};

const PharmacyMain = () => {
  const [distance, setDistance] = useState("");
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState([]);
  const [currentPos, setCurrentPos] = useState({ lat: null, lng: null });

  const navigate = useNavigate();
  const distanceList = ["500m", "1km", "5km", "10km"];

  // 기본으로 설정된 위치 가져오기
  useEffect(() => {
    getDefaultPosition().then(setCurrentPos);
  }, []);

  // 약국 검색
  const onSearch = async (e) => {
    e.preventDefault();
    try {
      const query = new URLSearchParams({
        type: "PHARMACY",
        name: keyword || "",
      });
      const url = `http://localhost:8080/api/facilities?${query.toString()}`;
      console.log("요청 URL:", url);

      const res = await fetch(url);
      if (!res.ok) throw new Error(`서버 오류: ${res.status}`);

      const data = await res.json();
      let withDistance = addDistanceAndSort(data, currentPos);

      // 거리 필터 적용
      if (distance) {
        const range = parseFloat(distance) / (distance.includes("km") ? 1 : 1000); // m → km 변환
        withDistance = withDistance.filter((item) => item.distanceValue <= range);
      }

      setResults(withDistance);
    } catch (error) {
      console.error("검색 실패:", error);
    }
  };

  // 지도 표시 (검색 결과 있을 때만)
  useEffect(() => {
    if (results.length === 0 || !currentPos.lat) return;
    renderKakaoMap("map", currentPos, results);
  }, [results, currentPos]);

  return (
    <>
      <div className="bg-white">
        <Container className="py-4">
          {/* 상단 소개 영역 */}
          <Row className="g-3 mb-3 align-items-center">
            <Col xs={6}>
              <div className="d-flex align-items-center gap-2 text-secondary mb-2">
                <GeoAltFill size={18} />
                <small>경기도 성남시 중원구</small>
              </div>
              <h3 className="fw-bold lh-base mb-3" style={{ color: colors.text }}>
                지금 나에게
                <br />
                딱 맞는 <span style={{ color: colors.primary }}>약국</span>을 찾아보세요
              </h3>
            </Col>
            <Col xs={6} className="text-end">
              <img src="/image/map.png" alt="지도" height="150" />
            </Col>
          </Row>

          {/* 병원 / 약국 버튼 */}
          <Row className="g-3 mb-4">
            <Col xs={6}>
              <Card
                className="rounded-4 shadow-sm border-0 text-dark"
                style={{ background: "#f3f4f6", cursor: "pointer", minHeight: 160 }}
                onClick={() => navigate("/")}
              >
                <Card.Body className="d-flex flex-column justify-content-center align-items-center">
                  <img src="/image/hospitalBed.png" alt="병원" height="180" />
                  <div className="fw-semibold" style={{ fontSize: "1rem" }}>
                    병원
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col xs={6}>
              <Card
                className="rounded-4 shadow-sm border-0 text-white"
                style={{
                  background: colors.primary,
                  cursor: "pointer",
                  minHeight: 180,
                }}
                onClick={() => navigate("/pharmacy")}
              >
                <Card.Body className="d-flex flex-column justify-content-center align-items-center">
                  <img src="/image/pharmacy.png" alt="약국" height="180" />
                  <div className="fw-semibold" style={{ fontSize: "1rem" }}>
                    약국
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* 검색 폼 */}
          <Form onSubmit={onSearch}>
            <Dropdown className="mb-3">
              <Dropdown.Toggle
                className="w-100 rounded-pill text-dark d-flex justify-content-between align-items-center shadow-sm"
                variant="light"
                style={{ padding: "0.9rem 1.25rem", border: "1px solid #e0e0e0" }}
              >
                <span className={distance ? "" : "text-secondary"}>
                  {distance || "거리 선택"}
                </span>
                <i className="bi bi-chevron-down"></i>
              </Dropdown.Toggle>
              <Dropdown.Menu>
                {distanceList.map((d) => (
                  <Dropdown.Item key={d} onClick={() => setDistance(d)}>
                    {d}
                  </Dropdown.Item>
                ))}
                <Dropdown.Divider />
                <Dropdown.Item onClick={() => setDistance("")}>선택 해제</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>

            <Form.Control
              type="text"
              placeholder="약국 이름을 입력하세요."
              className="rounded-3 mb-3 shadow-sm"
              style={{ padding: "0.9rem 1rem", border: "1px solid #eee", background: "#f8f9fa" }}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />

            <Button
              type="submit"
              className="w-100 rounded-pill fw-semibold shadow-sm"
              style={{ background: colors.primary, border: "none", padding: "0.9rem 1rem" }}
            >
              내 주변 약국 검색
            </Button>
          </Form>

          <hr className="my-4" style={{ border: "0.5px solid #ccc" }} />

          {/* 지도 */}
          {results.length > 0 && (
            <>
              <div id="map" style={{ width: "100%", height: "400px" }}></div>
              <div className="mt-4">
                {results.map((item, idx) => (
                  <Card
                    key={idx}
                    className="rounded-4 shadow mb-3 border-1"
                    style={{ cursor: "pointer" }}
                    onClick={() => navigate(`/pharmacydetail/${item.facilityId}`)}
                  >
                    <Card.Body>
                      <h5 className="fw-bold my-2 d-flex justify-content-between align-items-center">
                        <span>
                          {item.name}
                          <span style={{ color: "#2563eb", fontSize: "20px", marginLeft: "6px" }}>
                            ({item.distance || "—"})
                          </span>
                        </span>
                        <StarFill color="#FFD43B" size={30} />
                      </h5>
                      <div
                        className="mb-3"
                        style={{ display: "flex", alignItems: "center", marginTop: "6px" }}
                      >
                        <span
                          style={{
                            backgroundColor: "#5c5c5c",
                            color: "#fff",
                            fontSize: "12px",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            marginRight: "8px",
                          }}
                        >
                          도로명
                        </span>
                        <span style={{ color: "#555", fontSize: "14px" }}>{item.address}</span>
                      </div>
                      <div className="d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center gap-2 text-muted small">
                          <TelephoneFill className="me-1" /> {item.phone}
                        </div>
                        <div
                          className={`fw-semibold small ${
                            item.open ? "text-success" : "text-secondary"
                          }`}
                        >
                          {item.open ? "영업 중" : "영업 종료"}
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                ))}
              </div>
            </>
          )}

          {results.length === 0 && keyword && (
            <div className="text-center text-secondary mt-4">검색 결과가 없습니다.</div>
          )}
        </Container>
      </div>
    </>
  );
};

export default PharmacyMain
