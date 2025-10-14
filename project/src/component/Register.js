import React from 'react'
import '../btn.css'
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
          <h3 className="mb-4 fw-bold text-center text-lg-start">로그인</h3>

          <Form>
            {/* 아이디/비밀번호 입력 */}
            <Form.Group className="mb-3">
              <Form.Control
                type="text"
                placeholder="아이디를 입력해주세요."
                className="bg-light rounded-0"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Control
                type="password"
                placeholder="비밀번호를 입력해주세요."
                className="bg-light rounded-0"
              />
            </Form.Group>


            <div className="mb-3 text-end">
              <a href="#" style={{ fontSize: "14px", textDecoration: "none" }}>
                계정을 잊으셨나요?
              </a>
            </div>


            {/* 모바일*/}
            <div className="d-block d-md-none mb-3">
              <Row className="g-2">
                <Col xs={6}>
                  <Button
                    className="w-100 fw-bold mb-3"
                    style={{
                      backgroundColor: "#3341F3",
                      color: "#fff",
                      fontSize: "16px",
                      height: "48px",
                    }}
                  >
                    로그인
                  </Button>
                </Col>
                <Col xs={6}>
                 <Button
                  className="w-100 fw-bold custom-outline-blue">
                  회원가입
                  </Button>
                </Col>
              </Row>
            </div>

            {/* 태블릿 */}
            <div className="d-none d-md-block d-lg-none d-grid gap-2 mb-3">
              <Button
                className="w-100 fw-bold mb-3 shadow"
                style={{
                  backgroundColor: "#3341F3",
                  color: "#fff",
                  fontSize: "18px",
                  height: "50px",
                }}
              >
                로그인
              </Button>
              <Button
                  className="w-100 fw-bold custom-outline-blue">
                회원가입
              </Button>
            </div>

            {/*PC*/}
            <div className="d-none d-lg-block d-grid gap-2">
              <Button
                className="w-100 fw-bold shadow mb-3"
                style={{
                  backgroundColor: "#3341F3",
                  color: "#fff",
                  fontSize: "18px",
                  height: "50px",
                }}
              >
                로그인
              </Button>
              <Button
                  className="w-100 fw-bold custom-outline-blue">
                회원가입
              </Button>
            </div>
            <div className="text-center my-3 text-muted">또는</div>

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