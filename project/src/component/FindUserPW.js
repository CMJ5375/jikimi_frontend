import React, { useState } from 'react';
import { Container, Row, Col, Form, Button, Nav } from 'react-bootstrap';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import '../btn.css';

const FindUserPW = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const [userId, setUserId] = useState('');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPw, setNewPw] = useState('');
  const [newPw2, setNewPw2] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState('');

  const handleSend = () => {
    if (!email.trim()) return setError('이메일을 입력해주세요.');
    alert('인증번호가 발송되었습니다.');
  };

  const handleVerify = () => {
    if (!userId.trim() || !email.trim() || !code.trim())
      return setError('아이디, 이메일, 인증번호를 모두 입력해주세요.');
    setIsVerified(true);
  };

  const handleResetPassword = () => {
    if (!newPw || !newPw2) return setError('새 비밀번호를 입력해주세요.');
    if (newPw !== newPw2) return setError('비밀번호가 일치하지 않습니다.');
    alert('비밀번호가 변경되었습니다.');
    navigate('/login');
  };

  const resetForm = () => {
    setUserId('');
    setEmail('');
    setCode('');
    setNewPw('');
    setNewPw2('');
    setIsVerified(false);
    setError('');
  };

  return (
    <>
    <Container className="py-5">
      <Row className="justify-content-center align-items-center">
        <Col lg={6} className="d-none d-lg-block text-center order-lg-1">
          <img src="/image/loginLogo.png" alt="로고" style={{ width: '360px' }} className="mb-4" />
          <div className="fs-5">
            주변 공휴일에도 걱정없이,<br />지금 열려있는 병원/약국 안내
          </div>
        </Col>

        <Col xs={12} md={8} lg={6} className="order-lg-2">
          <Nav className="find-tabs mb-4" activeKey={pathname}>
            <Nav.Item className="text-center">
              <Nav.Link as={Link} to="/finduser" eventKey="/finduser">아이디 찾기</Nav.Link>
            </Nav.Item>
            <Nav.Item className="text-center">
              <Nav.Link as={Link} to="/finduserpw" eventKey="/finduserpw">비밀번호 찾기</Nav.Link>
            </Nav.Item>
          </Nav>

          {!isVerified ? (
            <>
              <Form>
                <Form.Group className="mb-2">
                  <Form.Control
                    type="text"
                    placeholder="아이디를 입력해주세요."
                    className="bg-light rounded-0"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                  />
                </Form.Group>

                <Form.Group className="mb-2 d-flex align-items-center">
                  <Form.Control
                    type="email"
                    placeholder="이메일을 입력해주세요."
                    className="bg-light rounded-0"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <Button className="ms-2 fw-bold btn-main-blue" style={{ fontSize: '14px', height: '40px', width: '76px' }} onClick={handleSend}>발송</Button>
                </Form.Group>

                <Form.Group className="mb-2 d-flex align-items-center">
                  <Form.Control
                    type="text"
                    placeholder="인증번호를 입력해주세요."
                    className="bg-light rounded-0"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                  />
                  <Button className="ms-2 fw-bold btn-outline-blue" style={{ fontSize: '14px', height: '40px', width: '76px' }} onClick={handleVerify}>확인</Button>
                </Form.Group>

                {error && <div className="text-danger small mb-2">* {error}</div>}

                <div className="mb-3">
                  <button type="button" className="btn p-0 border-0 bg-transparent" style={{ fontSize: '14px', color: 'black' }} onClick={handleSend}>
                    인증번호가 오지 않으신가요? 재발송
                  </button>
                </div>

                <div className="d-grid gap-2">
                  <Button className="w-100 fw-bold btn-main-blue">로그인</Button>
                  <Button className="w-100 fw-bold btn-outline-blue" onClick={resetForm}>취소</Button>
                </div>
              </Form>
            </>
          ) : (
            <>
              <Form>
                <Form.Group className="mb-2">
                  <Form.Control
                    type="password"
                    placeholder="비밀번호를 새로 입력해주세요."
                    className="bg-light rounded-0"
                    value={newPw}
                    onChange={(e) => setNewPw(e.target.value)}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Control
                    type="password"
                    placeholder="비밀번호를 다시 입력해주세요."
                    className="bg-light rounded-0"
                    value={newPw2}
                    onChange={(e) => setNewPw2(e.target.value)}
                  />
                </Form.Group>

                {error && <div className="text-danger small mb-2">* {error}</div>}

                
                <div className="d-none d-md-grid gap-2">
                  <Button className="w-100 fw-bold btn-main-blue" onClick={handleResetPassword}>비밀번호 변경</Button>
                  <Button className="w-100 fw-bold btn-outline-blue" onClick={resetForm}>취소</Button>
                </div>

              
                <div className="d-flex d-md-none gap-2">
                  <Button className="flex-fill fw-bold btn-main-blue" style={{ height: '48px', fontSize: '16px' }} onClick={handleResetPassword}>로그인</Button>
                  <Button className="flex-fill fw-bold btn-outline-blue" style={{ height: '48px', fontSize: '16px' }} onClick={resetForm}>취소</Button>
                </div>
              </Form>
            </>
          )}
        </Col>
      </Row>
    </Container>
    </>
  );
};

export default FindUserPW;
