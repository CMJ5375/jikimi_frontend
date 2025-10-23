import React from 'react'
import { Container, Row, Col, Form, Button } from 'react-bootstrap';

const Register = () => {
  return (
    <Container className="py-5">
      <Row className="justify-content-center align-items-center">

        {/* PC 전용  */}
        <Col lg={6} className="d-none d-lg-block text-center order-lg-1">
          <img
            src="/image/loginLogo.png"
            alt="로고"
            style={{ width: '360px' }}
            className="mb-4"
          />
          <div className="fs-5">
            주변 공휴일에도 걱정없이,<br />
            지금 열려있는 병원/약국 안내
          </div>
        </Col>

        {/* 로그인 폼 영역 */}
        <Col xs={12} md={8} lg={6} className="order-lg-2">
          <h3 className="mb-4 fw-bold text-center text-lg-center">회원가입</h3>

          <Form>
            <Form.Group className="mb-2">
              <Form.Control
                type="text"
                placeholder="아이디를 입력해주세요."
                className="bg-light rounded-0"
              />
            </Form.Group>

            <Form.Group className="mb-2">
              <Form.Control
                type="email"
                placeholder="이메일을 입력해주세요."
                className="bg-light rounded-0"
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Control
                type="password"
                placeholder="비밀번호를 입력해주세요."
                className="bg-light rounded-0"
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Control
                type="password"
                placeholder="비밀번호를 입력해주세요."
                className="bg-light rounded-0"
              />
            </Form.Group>


            <div className="mb-3">
              <a href="/login" style={{ fontSize: "14px",color:'black'}}>
                이미 아이디가 있으신가요?
              </a>
            </div>


            {/* 모바일*/}
            <div className="d-block d-md-none mb-3">
              <Row className="g-2">
                <Col xs={6}>
                  <Button
                    className="w-100 fw-bold mb-3 btn-main-blue"
                    style={{
                      fontSize: "16px",
                      height: "48px",
                    }}
                  >
                    회원가입
                  </Button>
                </Col>
                <Col xs={6}>
                    <Button className="w-100 fw-bold btn-outline-blue">
                        취소
                    </Button>
                </Col>
              </Row>
            </div>

            {/* 태블릿 */}
            <div className="d-none d-md-block d-lg-none d-grid gap-2 mb-3">
              <Button
                className="w-100 fw-bold mb-3 shadow btn-main-blue"
                style={{
                  fontSize: "18px",
                  height: "50px",
                }}
              >
                회원가입
              </Button>
              <Button className="w-100 fw-bold btn-outline-blue">
                취소
              </Button>
            </div>

            {/*PC*/}
            <div className="d-none d-lg-block d-grid gap-2">
              <Button
                className="w-100 fw-bold shadow mb-3 btn-main-blue"
                style={{
                  fontSize: "18px",
                  height: "50px",
                }}
              >
                회원가입
              </Button>
              <Button className="w-100 fw-bold btn-outline-blue" >
                취소
              </Button>
            </div>
            <div className="d-flex align-items-center my-3 divider">
              <div className="flex-grow-1 border-bottom fw-bold"></div>
              <span className="mx-3">또는</span>
              <div className="flex-grow-1 border-bottom"></div>
            </div>

            {/* 소셜 로그인 버튼들 */}
            <div className="d-grid gap-2">
              {/* 카카오 */}
              <Button
                className="text-dark fw-bold d-flex align-items-center justify-content-center shadow"
                style={{
                  backgroundColor: "#fef01b",
                  border: "none",
                  height: "50px",
                }}
              >
                <img
                  src="/image/kakao.png"
                  alt="Kakao"
                  style={{ width: "28px" }}
                  className="me-2"
                />
                카카오로 시작하기
              </Button>

              {/* 구글 */}
              <Button
                variant="light"
                className="d-flex align-items-center justify-content-center border fw-semibold shadow"
                style={{ height: "50px" }}
              >
                <img
                  src="/image/google-logo.png"
                  alt="google"
                  style={{ width: "28px" }}
                  className="me-2"
                />
                구글로 시작하기
              </Button>
            </div>
          </Form>
        </Col>
      </Row>
    </Container>
  );
}

export default Register