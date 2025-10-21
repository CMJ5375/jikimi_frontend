import { useMemo, useState } from "react";
import { Container, Row, Col, Card, Button, Form, Dropdown } from "react-bootstrap";
import { GeoAltFill } from "react-bootstrap-icons";
import "bootstrap/dist/css/bootstrap.min.css";

/** 간단 테마 */
const colors = {
  primary: "#3B6CFF",
  primarySoft: "#E9F0FF",
  text: "#111",
  mute: "#6c757d",
};

const Main = () => {
  const [type, setType] = useState("hospital"); // 'hospital' | 'pharmacy'
  const [dept, setDept] = useState("");         // 진료과목
  const [org, setOrg] = useState("");           // 의료기관
  const [keyword, setKeyword] = useState("");   // 병원명

  // 더미 목록 (원하면 API 연동)
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
    // TODO: 실제 검색로직
    alert(
      JSON.stringify(
        {
          type,
          dept: dept || null,
          org: org || null,
          keyword: keyword || null,
        },
        null,
        2
      )
    );
  };

  return (
    <>
    <div className="bg-white">
      <Container className="py-4">
        {/* 위치 */}
        <div className="d-flex align-items-center gap-2 text-secondary mb-2">
          <GeoAltFill size={18} />
          <small>경기도 성남시 중원구</small>
        </div>

        {/* 상단 썸네일(선택) */}
        <Row className="g-3 mb-2">
          <Col xs={6}>
            <h3 className="fw-bold lh-base mb-3" style={{ color: colors.text }}>
              지금 나에게<br />
              딱 맞는 <span style={{ color: colors.primary, textDecoration: "none" }}>병원</span>
              을 찾아보세요
            </h3>
          </Col>
          <Col xs={6} className="text-end">
            <img src="/image/map.png" alt="지도" height="150"></img>
            {/* <div
              className="rounded-4 w-100 h-100"
              style={{ background: colors.primarySoft, minHeight: 100 }}
            /> */}
          </Col>
        </Row>

        {/* 병원 약국 선택 카드 */}
        <Row className="g-3 mb-3">
        {/* 병원 카드 */}
        <Col xs={6}>
          <Card
            className={`rounded-4 shadow-sm border-0 h-100 ${
              type === "hospital" ? "text-white" : "text-dark"
            }`}
            style={{
              background: type === "hospital" ? colors.primary : "#f3f4f6",
              cursor: "pointer",
              minHeight: 180,
              transition: "0.2s ease",
            }}
            onClick={() => setType("hospital")}
          >
            <Card.Body className="d-flex flex-column justify-content-center align-items-center py-4">
              <img
                src="/image/hospitalBed.png"
                alt="병원침대"
                style={{
                  height: 150,
                  marginBottom: 12,
                  objectFit: "contain",
                }}
              />
              <div className="fw-semibold" style={{ fontSize: "1rem" }}>
                병원
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* 약국 카드 */}
        <Col xs={6}>
          <Card
            className={`rounded-4 shadow-sm border-0 h-100 ${
              type === "pharmacy" ? "text-white" : "text-dark"
            }`}
            style={{
              background: type === "pharmacy" ? colors.primary : "#f3f4f6",
              cursor: "pointer",
              minHeight: 150,
              transition: "0.2s ease",
            }}
            onClick={() => setType("pharmacy")}
          >
            <Card.Body className="d-flex flex-column justify-content-center align-items-center py-4">
              <img
                src="/image/pharmacy.png"
                alt="약국이미지"
                style={{
                  height: 180,
                  marginBottom: 12,
                  objectFit: "contain",
                }}
              />
              <div className="fw-semibold" style={{ fontSize: "1rem" }}>
                약국
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

        {/* 폼 */}
        <Form onSubmit={onSearch}>
          {/* 진료과목 */}
          <Dropdown className="mb-3">
            <Dropdown.Toggle
              className="w-100 rounded-pill text-dark d-flex justify-content-between align-items-center shadow-sm"
              variant="light"
              id="dropdown-dept"
              style={{ padding: "0.9rem 1.25rem", border: "1px solid #e0e0e0" }}
            >
              <span className={dept ? "" : "text-secondary"}>{dept || "진료과목"}</span>
              <i className="bi bi-chevron-down"></i>
            </Dropdown.Toggle>
            <Dropdown.Menu className="w-100">
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
              id="dropdown-org"
              style={{ padding: "0.9rem 1.25rem", border: "1px solid #e0e0e0" }}
            >
              <span className={org ? "" : "text-secondary"}>{org || "의료기관"}</span>
              <i className="bi bi-chevron-down"></i>
            </Dropdown.Toggle>
            <Dropdown.Menu className="w-100">
              {orgList.map((o) => (
                <Dropdown.Item key={o} onClick={() => setOrg(o)}>
                  {o}
                </Dropdown.Item>
              ))}
              <Dropdown.Divider />
              <Dropdown.Item onClick={() => setOrg("")}>선택 해제</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>

          {/* 검색어 */}
          <Form.Control
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="병원 이름을 입력하세요."
            className="rounded-3 mb-3 shadow-sm"
            style={{ padding: "0.9rem 1rem", border: "1px solid #eee", background: "#f8f9fa" }}
          />

          {/* 검색 버튼 */}
          <Button
            type="submit"
            className="w-100 rounded-pill shadow-sm fw-semibold"
            style={{ background: colors.primary, border: "none", padding: "0.9rem 1rem" }}
          >
            내 주변 {type === "hospital" ? "병원" : "약국"} 검색
          </Button>
        </Form>
      </Container>
    </div>
    </>
  );
}

export default Main