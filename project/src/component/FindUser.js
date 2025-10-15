import React, { useState } from "react";
import { Container, Row, Col, Form, Button, Nav,Card } from "react-bootstrap";
import { Link, useLocation, useNavigate } from "react-router-dom";

import "../btn.css";

const FindUser = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();


  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [result, setResult] = useState({ userId: "", joinDate: "" });
  const [error, setError] = useState("");

  const handleSend = () => {
    setError("");
    if (!email.trim()) {
      setError("이메일을 입력해주세요.");
      return;
    }
    // TODO: 인증번호 발송 API 임시
    alert("인증번호가 발송되었습니다.");
  };

  const handleVerify = () => {
    setError("");
    if (!email.trim() || !code.trim()) {
      setError("이메일과 인증번호를 모두 입력해주세요.");
      return;
    }
    // TODO: 실제 검증 API
    // 예시: 임의로 성공 처리
    setIsVerified(true);
    setResult({
      userId: "lim_do",
      joinDate: "2025. 09. 27",
    });
  };

  const resetForm = () => {
    setIsVerified(false);
    setEmail("");
    setCode("");
    setError("");
  };
  return (
    <Container className="py-5">
      <Row className="justify-content-center align-items-center">
        {/* PC 전용 왼쪽 안내 */}
        <Col lg={6} className="d-none d-lg-block text-center order-lg-1">
          <img
            src="/image/loginLogo.png"
            alt="로고"
            style={{ width: "360px" }}
            className="mb-4"
          />
          <div className="fs-5">
            주변 공휴일에도 걱정없이,<br />
            지금 열려있는 병원/약국 안내
          </div>
        </Col>

        {/* 오른쪽 콘텐츠 */}
        <Col xs={12} md={8} lg={6} className="order-lg-2">
          {/* 탭 */}
          <Nav className="find-tabs mb-4" activeKey={pathname}>
            <Nav.Item className="text-center">
              <Nav.Link as={Link} to="/finduser" eventKey="/finduser">
                아이디 찾기
              </Nav.Link>
            </Nav.Item>
            <Nav.Item className="text-center">
              <Nav.Link as={Link} to="/finduserpw" eventKey="/finduserpw">
                비밀번호 찾기
              </Nav.Link>
            </Nav.Item>
          </Nav>

          {/* 상태별 렌더링 */}
          {!isVerified ? (
            <>
              {/* 입력 영역 */}
              <Form>
                <Form.Group className="mb-2 d-flex align-items-center">
                  <Form.Control
                    type="email"
                    placeholder="이메일을 입력해주세요."
                    className="bg-light rounded-0"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <Button
                    variant="light"
                    className="ms-2 fw-bold btn-main-blue"
                    style={{
                      fontSize: "14px",
                      height: "40px",
                      width: "76px",
                    }}
                    onClick={handleSend}
                  >
                    발송
                  </Button>
                </Form.Group>

                <Form.Group className="mb-2 d-flex align-items-center">
                  <Form.Control
                    type="text"
                    placeholder="인증번호를 입력해주세요."
                    className="bg-light rounded-0"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                  />
                  <Button
                    variant="light"
                    className="ms-2 fw-bold btn-outline-blue"
                    style={{
                      fontSize: "14px",
                      height: "40px",
                      width: "76px",
                    }}
                    onClick={handleVerify}
                  >
                    확인
                  </Button>
                </Form.Group>

                {error && (
                  <div className="text-danger small mb-2">* {error}</div>
                )}

                <div className="mb-3">
                  <button
                    type="button"
                    className="btn p-0 border-0 bg-transparent"
                    style={{ fontSize: "14px", color: "black" }}
                    onClick={handleSend}
                  >
                    인증번호가 오지 않으신가요? 재발송
                  </button>
                </div>

                {/* CTA 버튼 (공통) */}
                <div className="d-grid gap-2">
                  <Button className="w-100 fw-bold btn-main-blue">
                    아이디 찾기
                  </Button>
                  <Button
                    className="w-100 fw-bold btn-outline-blue"
                    onClick={resetForm}
                  >
                    취소
                  </Button>
                </div>
              </Form>
            </>
          ) : (
            <>
              
              <div className="text-center text-secondary mb-3" style={{ fontSize: 14 }}>
                이메일 정보와 동일한 아이디입니다.
              </div>

              <Card className="mb-4" style={{ borderRadius: 6 }}>
                <Card.Body className="bg-white p-4 text-center">
                  <div className="mb-2" style={{ fontSize: 14, }}>
                    <div className="mb-2 color-dark">아이디 : <b>{result.userId}</b></div>
                    <div>가입일 : {result.joinDate}</div>
                  </div>
                </Card.Body>
              </Card>

       
              {/* PC & 태블릿 - 세로 배치 */}
              <div className="d-none d-md-grid gap-2">
                <Button
                  className="w-100 fw-bold btn-main-blue"
                  onClick={() => navigate("/login")}
                >
                  확인
                </Button>
                <Button
                  as={Link}
                  to="/finduserpw"
                  className="w-100 fw-bold btn-outline-blue"
                >
                  비밀번호 재설정
                </Button>
              </div>

              {/* 모바일 - 가로 배치 */}
              <div className="d-flex d-md-none gap-2">
                <Button
                  className="flex-fill fw-bold btn-main-blue"
                  style={{ height: "48px", fontSize: "16px" }}
                  onClick={() => navigate("/login")}
                >
                  확인
                </Button>
                <Button
                  as={Link}
                  to="/finduserpw"
                  className="flex-fill fw-bold btn-outline-blue"
                  style={{ height: "48px", fontSize: "16px" }}
                >
                  비밀번호 재설정
                </Button>
              </div>
            </>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default FindUser;
