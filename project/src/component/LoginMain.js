import { Container, Row, Col, Form, Button } from 'react-bootstrap';
import { Google, ChatDots } from 'react-bootstrap-icons';

function LoginMain() {
  return (
    <Container className="py-5">
      <Row className="justify-content-center align-items-center">
        <Col md={6} className="d-none d-md-block text-center">
          <img src="/image/logo.png" alt="로고" style={{ width: '180px' }} className="mb-4" />
          <div className="fs-5">
            주변 공휴일에도 걱정없이,<br />
            지금 열려있는 병원/약국 안내
          </div>
        </Col>
        <Col xs={12} md={6} className="mb-4 mb-md-0">
          <h3 className="mb-4 fw-bold text-center text-md-start">로그인</h3>

          <Form>
            <Form.Group className="mb-3">
              <Form.Control type="text" placeholder="아이디를 입력해주세요." />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Control type="password" placeholder="비밀번호를 입력해주세요." />
            </Form.Group>

            <div className="mb-3">
              <a href="#">계정을 잊으셨나요?</a>
            </div>

            <div className="d-grid gap-2 mb-3">
              <Button variant="primary" size="lg">로그인</Button>
              <Button variant="outline-primary" size="lg">회원가입</Button>
            </div>

            <div className="text-center my-2 text-muted">또는</div>

            <div className="d-grid gap-2">
              <Button
                    size="lg"
                    className="text-dark fw-bold d-flex align-items-center justify-content-center"
                    style={{ backgroundColor: "#ffeb00", border: "none" }}
                  >
                <img src="/image/kakao.png" alt="Kakao" style={{ width: '32px' }} className="me-2" /> 
                카카오로 시작하기 
                </Button>
              <Button
                variant="light"
                size="lg"
                className="d-flex align-items-center justify-content-center border"
              >
                <img src="/image/google-logo.png" alt="google" style={{ width: '32px' }} className="me-2" />
                구글로 시작하기
              </Button>
            </div>
          </Form>
        </Col>
      </Row>
    </Container>
  );
}

export default LoginMain;
