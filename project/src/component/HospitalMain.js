import { useMemo, useState } from "react";
import { Container, Row, Col, Card, Button, Form, Dropdown } from "react-bootstrap";
import { GeoAltFill, StarFill, TelephoneFill, HospitalFill, CheckCircleFill } from "react-bootstrap-icons";
import { useNavigate } from "react-router-dom";

const colors = {
  primary: "#3B6CFF",
  primarySoft: "#E9F0FF",
  text: "#111",
  mute: "#6c757d",
};

const HospitalMain = () => {
  const [dept, setDept] = useState("");
  const [org, setOrg] = useState("");
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState([]);

  const navigate = useNavigate(); // ✅ 네비게이션 훅

  const deptList = useMemo(
    () => ["내과", "외과", "정형외과", "소아청소년과", "산부인과", "안과", "이비인후과", "응급의학과"],
    []
  );
  const orgList = useMemo(
    () => ["상급종합병원", "종합병원", "병원", "의원", "보건소", "한방병원", "치과의원"],
    []
  );

  const onSearch = (e) => {
    e.preventDefault();
    setResults([
      {
        type: "소아청소년과",
        name: "성남소아과",
        distance: "178m",
        address: "경기 성남시 수정구 수진로171번길",
        phone: "031-715-2000",
        emergency: true,
        open: true,
      },
    ]);
  };

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
              지금 나에게<br />
              딱 맞는 <span style={{ color: colors.primary }}>병원</span>을 찾아보세요
            </h3>
          </Col>
          <Col xs={6} className="text-end">
            <img src="/image/map.png" alt="지도" height="150" />
          </Col>
        </Row>

        {/* 병원 / 약국 선택 버튼 */}
        <Row className="g-3 mb-4">
          {/* 병원 버튼 */}
          <Col xs={6}>
            <Card
              className="rounded-4 shadow-sm border-0 text-white"
              style={{
                background: colors.primary,
                cursor: "pointer",
                minHeight: 180,
              }}
              onClick={() => navigate("/")} // 병원 클릭 시 이동
            >
              <Card.Body className="d-flex flex-column justify-content-center align-items-center">
                <img
                  src="/image/hospitalBed.png"
                  alt="병원 이미지"
                  style={{
                    height: 180,
                    objectFit: "contain",
                    marginBottom: 8,
                  }}
                />
                <div className="fw-semibold" style={{ fontSize: "1rem" }}>
                  병원
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* 약국 버튼 */}
          <Col xs={6}>
            <Card
              className="rounded-4 shadow-sm border-0 text-dark"
              style={{
                background: "#f3f4f6",
                cursor: "pointer",
                minHeight: 180,
              }}
              onClick={() => navigate("/pharmacy")} // ✅ 약국 클릭 시 이동
            >
              <Card.Body className="d-flex flex-column justify-content-center align-items-center">
                <img
                  src="/image/pharmacy.png"
                  alt="약국 이미지"
                  style={{
                    height: 180,
                    objectFit: "contain",
                    marginBottom: 8,
                  }}
                />
                <div className="fw-semibold" style={{ fontSize: "1rem" }}>
                  약국
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* 검색 폼 */}
        <Form onSubmit={onSearch}>
          {/* 진료과목 */}
          <Dropdown className="mb-3">
            <Dropdown.Toggle
              className="w-100 rounded-pill text-dark d-flex justify-content-between align-items-center shadow-sm"
              variant="light"
              style={{ padding: "0.9rem 1.25rem", border: "1px solid #e0e0e0" }}
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
          <Dropdown className="mb-3">
            <Dropdown.Toggle
              className="w-100 rounded-pill text-dark d-flex justify-content-between align-items-center shadow-sm"
              variant="light"
              style={{ padding: "0.9rem 1.25rem", border: "1px solid #e0e0e0" }}
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
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="병원 이름을 입력하세요."
            className="rounded-3 mb-3 shadow-sm"
            style={{ padding: "0.9rem 1rem", border: "1px solid #eee", background: "#f8f9fa" }}
          />

          <Button
            type="submit"
            className="w-100 rounded-pill fw-semibold shadow-sm"
            style={{ background: colors.primary, border: "none", padding: "0.9rem 1rem" }}
          >
            내 주변 병원 검색
          </Button>
        </Form>

        <hr className="my-4" style={{ border: "0.5px solid #ccc" }} />

        {/* 검색 결과 */}
        {results.length > 0 && (
          <div className="mt-4">
            {results.map((item, idx) => (
              <Card key={idx} className="rounded-4 shadow mb-3 border-1" style={{cursor: "pointer"}} onClick={() => navigate("/hospitaldetail")}>
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <small className="text-muted">{item.type}</small>
                    <StarFill color="#FFD43B" size={30} />
                  </div>
                  <h5 className="fw-bold mb-3">{item.name}
                    <span style={{ color: "#2563eb", fontSize: "20px", marginLeft: "6px"}}>({item.distance})</span>
                  </h5>
                  <div className="mb-3" style={{ display: "flex", alignItems: "center", marginTop: "6px" }}>
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
                    <div className="d-flex align-items-center gap-2">
                      {item.emergency && (
                        <div className="d-flex align-items-center gap-1 text-danger fw-semibold small">
                          <HospitalFill /> 응급실 운영
                        </div>
                      )}
                      {item.open && <div className="text-success small fw-semibold ms-2"><CheckCircleFill /> 진료 가능</div>}
                    </div>
                  </div>
                </Card.Body>
              </Card>
            ))}
          </div>
        )}
      </Container>
    </div>
    </>
  );
}

export default HospitalMain