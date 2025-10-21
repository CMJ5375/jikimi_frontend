import { useEffect, useMemo, useState } from "react";
import '../App.css';
import '../css/Hospital.css';
import { Container, Row, Col, Card, Button, Form, Dropdown } from "react-bootstrap";
import { GeoAltFill, StarFill, TelephoneFill, HospitalFill, CheckCircleFill } from "react-bootstrap-icons";
import { useNavigate } from "react-router-dom";
import { getDefaultPosition, addDistanceAndSort } from "../api/geolocationApi";

const HospitalMain = () => {
  const [dept, setDept] = useState("");
  const [org, setOrg] = useState("");
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState([]);
  const [currentPos, setCurrentPos] = useState({ lat: null, lng: null });

  const navigate = useNavigate();

  const deptList = useMemo(
    () => ["내과", "외과", "정형외과", "소아청소년과", "산부인과", "안과", "이비인후과", "응급의학과"], []
  );
  const orgList = useMemo(
    () => ["상급종합병원", "종합병원", "병원", "의원", "보건소", "한방병원", "치과의원"], []
  );

  useEffect(() => {
    getDefaultPosition().then(setCurrentPos);
  }, []);

  const onSearch = async (e) => {
    e.preventDefault();
    try {
      const query = new URLSearchParams({
        type: "HOSPITAL",
        name: keyword || "",
        orgType: org || "",
        deptName: dept || "",
      });

      const url = `http://localhost:8080/api/facilities?${query.toString()}`;
      const res = await fetch(url);
      const data = await res.json();
      const sortedData = addDistanceAndSort(data, currentPos);
      setResults(sortedData);
    } catch (error) {
      console.error("검색 실패:", error);
    }
  };

  return (
    <div className="bg-white">
      <Container className="py-4">
        {/* 상단 소개 영역 */}
        <Row className="g-3 mb-3 align-items-center">
          <Col xs={6}>
            <div className="d-flex align-items-center gap-2 text-secondary mb-2">
              <GeoAltFill size={18} />
              <small>경기도 성남시 중원구</small>
            </div>
            <h3 className="fw-bold lh-base mb-3 hospital-title">
              지금 나에게<br />
              딱 맞는 <span>병원</span>을 찾아보세요
            </h3>
          </Col>
          <Col xs={6} className="text-end">
            <img src="/image/map.png" alt="지도" height="150" />
          </Col>
        </Row>

        {/* 병원 / 약국 선택 버튼 */}
        <Row className="g-3 mb-4">
          <Col xs={6}>
            <Card
              className="card-hospital-blue text-white"
              onClick={() => navigate("/")}
            >
              <Card.Body>
                <img src="/image/hospitalBed.png" alt="병원 이미지" />
                <div className="fw-semibold">병원</div>
              </Card.Body>
            </Card>
          </Col>

          <Col xs={6}>
            <Card
              className="card-hospital-gray text-dark"
              onClick={() => navigate("/pharmacy")}
            >
              <Card.Body>
                <img src="/image/pharmacy.png" alt="약국 이미지" />
                <div className="fw-semibold">약국</div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* 검색 폼 */}
        <Form onSubmit={onSearch}>
          {/* 진료과목 */}
          <Dropdown className="mb-3 dropdown-custom">
            <Dropdown.Toggle
              variant="light"
              className="text-dark d-flex justify-content-between align-items-center"
            >
              <span className={dept ? "" : "text-secondary"}>{dept || "진료과목"}</span>
              <i className="bi bi-chevron-down"></i>
            </Dropdown.Toggle>
            <Dropdown.Menu>
              {deptList.map((d) => (
                <Dropdown.Item key={d} onClick={() => setDept(d)}>
                  {d}
                </Dropdown.Item>
              ))}
              <Dropdown.Divider />
              <Dropdown.Item onClick={() => setDept("")}>선택 해제</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>

          {/* 의료기관 */}
          <Dropdown className="mb-3 dropdown-custom">
            <Dropdown.Toggle
              variant="light"
              className="text-dark d-flex justify-content-between align-items-center"
            >
              <span className={org ? "" : "text-secondary"}>{org || "의료기관"}</span>
              <i className="bi bi-chevron-down"></i>
            </Dropdown.Toggle>
            <Dropdown.Menu>
              {orgList.map((o) => (
                <Dropdown.Item key={o} onClick={() => setOrg(o)}>
                  {o}
                </Dropdown.Item>
              ))}
              <Dropdown.Divider />
              <Dropdown.Item onClick={() => setOrg("")}>선택 해제</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>

          {/* 검색창 */}
          <Form.Control
            type="text"
            placeholder="병원 이름을 입력하세요."
            className="rounded-3 mb-3 shadow-sm"
            style={{ padding: "0.9rem 1rem", border: "1px solid #eee", background: "#f8f9fa" }}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />

          <Button
            type="submit"
            className="w-100 rounded-pill fw-semibold shadow-sm"
            style={{ border: "none", padding: "0.9rem 1rem" }}
          >
            내 주변 병원 검색
          </Button>
        </Form>

        <hr className="my-4" style={{ border: "0.5px solid #ccc" }} />

        {/* 검색 결과 */}
        {results.length > 0 && (
          <div className="mt-4">
            {results.map((item) => (
              <Card
                key={item.facilityId}
                className="result-card mb-3"
                onClick={() => navigate(`/hospitaldetail/${item.facilityId}`)}
              >
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span style={{ color: "#555", fontSize: "14px" }}>{item.orgType || "의료기관 미지정"}</span>
                    <StarFill color="#FFD43B" size={30} />
                  </div>
                  <h5 className="fw-bold mb-2">
                    {item.name}{" "}
                    <span style={{ color: "#2563eb" }}>({item.distance})</span>
                  </h5>
                  <div className="mb-3 d-flex align-items-center" style={{ marginTop: "6px" }}>
                    <span className="badge-road">도로명</span>
                    <span style={{ color: "#555", fontSize: "14px" }}>{item.address}</span>
                  </div>
                  <div className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center gap-2 text-muted small">
                      <TelephoneFill className="me-1" /> {item.phone}
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      {item.emergency && (
                        <div className="d-flex align-items-center gap-1 text-danger fw-semibold small">
                          <HospitalFill /> 응급실 운영
                        </div>
                      )}
                      {item.open && (
                        <div className="text-success small fw-semibold ms-2">
                          <CheckCircleFill /> 진료 가능
                        </div>
                      )}
                    </div>
                  </div>
                </Card.Body>
              </Card>
            ))}
          </div>
        )}
      </Container>
    </div>
  );
};

export default HospitalMain;
