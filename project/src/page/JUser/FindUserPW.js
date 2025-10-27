import React, { useEffect, useRef, useState } from 'react';
import { Container, Row, Col, Form, Button, Nav } from 'react-bootstrap';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { sendPwdCodeApi, verifyPwdCodeApi, resetPasswordApi } from '../../api/userApi';
import '../../css/btn.css';

const FindUserPW = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const [userId, setUserId]   = useState('');
  const [email, setEmail]     = useState('');
  const [code, setCode]       = useState('');
  const [newPw, setNewPw]     = useState('');
  const [newPw2, setNewPw2]   = useState('');

  const [isVerified, setIsVerified] = useState(false);

  // 공통 서버/네트워크 에러
  const [error, setError] = useState('');

  // placeholder 빨간색 토글
  const [uErr, setUErr] = useState(false);
  const [eErr, setEErr] = useState(false);
  const [cErr, setCErr] = useState(false);
  const [pErr, setPErr] = useState(false);
  const [p2Err, setP2Err] = useState(false);

  // 발송/재발송 안내 메시지(지속 유지)
  const [sendMsg, setSendMsg] = useState('');   // "", "인증번호를 보냈습니다...", "인증번호를 다시 보냈습니다..."
  const [isResend, setIsResend] = useState(false); // 재발송 여부(스타일 다르게)

  // 재발송 타이머 (버튼은 항상 클릭 가능)
  const [left, setLeft] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (left <= 0) return;
    timerRef.current = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(timerRef.current);
  }, [left]);

  const startTimer = (sec = 300) => {
    clearTimeout(timerRef.current);
    setLeft(sec);
  };

  const mmss = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  // 1) 코드 발송 (재발송 시 메시지 굵고 크게, 계속 유지)
  const handleSend = async () => {
    setError('');
    setUErr(false); setEErr(false);
    setIsVerified(false);

    let hasErr = false;
    if (!userId.trim()) { setUErr(true); hasErr = true; }
    if (!email.trim())  { setEErr(true); hasErr = true; }
    if (hasErr) return;

    try {
      const wasResend = left > 0;

      const resp = await sendPwdCodeApi(userId.trim(), email.trim());
      const data = resp?.data ?? resp; // axios 응답/데이터 양쪽 대응

      // ✅ 200 OK이지만 본문으로 에러를 줄 때 처리
      if (data?.error === 'USER_EMAIL_MISMATCH') {
        setError('아이디와 이메일이 일치하지 않습니다.');
        setSendMsg('');
        setIsResend(false);
        return;
      }

      // 성공 처리 (204 또는 200 정상)
      startTimer(300);
      setIsResend(wasResend);
      setSendMsg(
        wasResend
          ? '인증번호를 다시 보냈습니다. (스팸함도 확인해주세요)'
          : '인증번호를 보냈습니다. (스팸함도 확인해주세요)'
      );
    } catch (e) {
      const status = e?.response?.status;
      const errKey = e?.response?.data?.error;

      if (status === 404 && errKey === 'USER_EMAIL_MISMATCH') {
        setError('아이디와 이메일이 일치하지 않습니다.');
      } else {
        console.error('pw-send error:', status, e?.response?.data);
        setError('인증번호 발송에 실패했습니다. 잠시 후 다시 시도해주세요.');
      }
      setSendMsg('');
      setIsResend(false);
    }
  };

  // 2) 코드 검증 (발송/재발송 메시지는 유지)
  const handleVerify = async () => {
    setError('');
    setUErr(false); setEErr(false); setCErr(false);

    let hasErr = false;
    if (!userId.trim()) { setUErr(true); hasErr = true; }
    if (!email.trim())  { setEErr(true); hasErr = true; }
    if (!code.trim())   { setCErr(true); hasErr = true; }
    if (hasErr) return;

    try {
      const resp = await verifyPwdCodeApi(userId.trim(), email.trim(), code.trim());
      const data = resp?.data ?? resp;

      // 백엔드가 200 OK로 실패를 줄 수도 있으니 체크
      if (!data?.verified) {
        setIsVerified(false);
        setError('인증코드가 일치하지 않거나 만료되었습니다.');
        return;
      }
      setIsVerified(true);
      // ✅ 발송/재발송 메시지는 유지
    } catch (e) {
      console.error('pw-verify error:', e?.response?.status, e?.response?.data);
      setError('확인 중 오류가 발생했습니다.');
    }
  };


  // 3) 비밀번호 변경 (길이 제한 제거, 동일 여부만 체크)
  const handleResetPassword = async () => {
    setError('');
    setPErr(false); setP2Err(false);

    let hasErr = false;
    if (!newPw.trim())  { setPErr(true); hasErr = true; }
    if (!newPw2.trim()) { setP2Err(true); hasErr = true; }
    if (hasErr) return;

    if (newPw !== newPw2) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    try {
      const resp = await resetPasswordApi(userId.trim(), email.trim(), code.trim(), newPw);
      const data = resp?.data;

      if (data?.error === 'VERIFY_FAILED') {
        setError('인증코드가 일치하지 않거나 만료되었습니다.');
        return;
      }
      if (data?.error === 'USER_EMAIL_MISMATCH') {
        setError('아이디와 이메일이 일치하지 않습니다.');
        return;
      }

      // 정상 성공
      if (data?.reset) {
        navigate('/login', { replace: true });
        return;
      }

      // 그 외 200인데 reset=false
      setError('비밀번호 변경에 실패했습니다.');
    } catch (e) {
      const status = e?.response?.status;
      const errKey = e?.response?.data?.error;

      if (status === 400 && errKey === 'VERIFY_FAILED') {
        setError('인증코드가 일치하지 않거나 만료되었습니다.');
      } else if (status === 404 && errKey === 'USER_EMAIL_MISMATCH') {
        setError('아이디와 이메일이 일치하지 않습니다.');
      } else {
        console.error('pw-reset error:', status, e?.response?.data);
        setError('비밀번호 변경 중 오류가 발생했습니다.');
      }
    }
  };



  const resetForm = () => {
    setUserId('');
    setEmail('');
    setCode('');
    setNewPw('');
    setNewPw2('');
    setIsVerified(false);
    setError('');
    setUErr(false); setEErr(false); setCErr(false); setPErr(false); setP2Err(false);
    setSendMsg('');
    setIsResend(false);
    setLeft(0);
    clearTimeout(timerRef.current);
  };

  // placeholder 동적
  const phUser = uErr ? '*아이디를 입력해주세요' : '아이디를 입력해주세요.';
  const phMail = eErr ? '*이메일을 입력해주세요' : '이메일을 입력해주세요.';
  const phCode = cErr ? '*인증번호를 입력해주세요' : '인증번호를 입력해주세요.';
  const phPw   = pErr ? '*비밀번호를 새로 입력해주세요' : '비밀번호를 새로 입력해주세요.';
  const phPw2  = p2Err ? '*비밀번호를 다시 입력해주세요' : '비밀번호를 다시 입력해주세요.';

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
                <Nav.Link as={Link} to="/finduserpw" eventKey="/finduserpw">비밀번호 변경</Nav.Link>
              </Nav.Item>
            </Nav>

            {!isVerified ? (
              <>
                <Form>
                  <Form.Group className="mb-2">
                    <Form.Control
                      type="text"
                      placeholder={phUser}
                      className={`bg-light rounded-0 ${uErr ? 'is-invalid-ph' : ''}`}
                      value={userId}
                      onChange={(e) => { setUserId(e.target.value); if (uErr && e.target.value.trim()) setUErr(false); }}
                      autoComplete="username"
                    />
                  </Form.Group>

                  <Form.Group className="mb-2 d-flex align-items-center">
                    <Form.Control
                      type="email"
                      placeholder={phMail}
                      className={`bg-light rounded-0 ${eErr ? 'is-invalid-ph' : ''}`}
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); if (eErr && e.target.value.trim()) setEErr(false); }}
                      autoComplete="email"
                    />
                    <Button
                      className="ms-2 fw-bold btn-main-blue"
                      style={{ fontSize: '14px', height: '40px', width: '76px' }}
                      onClick={handleSend}
                    >
                      {left > 0 ? mmss(left) : '발송'}
                    </Button>
                  </Form.Group>

                  <Form.Group className="mb-2 d-flex align-items-center">
                    <Form.Control
                      type="text"
                      placeholder={phCode}
                      className={`bg-light rounded-0 ${cErr ? 'is-invalid-ph' : ''}`}
                      value={code}
                      onChange={(e) => { setCode(e.target.value); if (cErr && e.target.value.trim()) setCErr(false); }}
                      maxLength={6}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      autoComplete="one-time-code"
                    />
                    <Button
                      className="ms-2 fw-bold btn-outline-blue"
                      style={{ fontSize: '14px', height: '40px', width: '76px' }}
                      onClick={handleVerify}
                    >
                      확인
                    </Button>
                  </Form.Group>

                  {/* 인라인 메시지 */}
                  {error && <div className="text-danger small mb-2">* {error}</div>}
                  {!error && sendMsg && (
                    <div
                      className={isResend ? 'text-success mb-2 fw-bold' : 'text-success small mb-2'}
                      style={isResend ? { fontSize: '16px' } : undefined}
                      aria-live="polite"
                    >
                      {sendMsg}
                    </div>
                  )}

                  <div className="mb-3">
                    <button
                      type="button"
                      className="btn p-0 border-0 bg-transparent"
                      style={{ fontSize: '14px', color: 'black' }}
                      onClick={handleSend}
                      title={left > 0 ? `재발송까지 ${mmss(left)}` : '재발송'}
                    >
                      인증번호가 오지 않으신가요? 재발송
                    </button>
                  </div>

                  <div className="d-grid gap-2">
                    <Button className="w-100 fw-bold btn-main-blue" onClick={handleVerify}>
                      다음
                    </Button>
                    <Button className="w-100 fw-bold btn-outline-blue" onClick={resetForm}>
                      취소
                    </Button>
                  </div>
                </Form>
              </>
            ) : (
              <>
                <Form>
                  <Form.Group className="mb-2">
                    <Form.Control
                      type="password"
                      placeholder={phPw}
                      className={`bg-light rounded-0 ${pErr ? 'is-invalid-ph' : ''}`}
                      value={newPw}
                      onChange={(e) => { setNewPw(e.target.value); if (pErr && e.target.value.trim()) setPErr(false); }}
                      autoComplete="new-password"
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Control
                      type="password"
                      placeholder={phPw2}
                      className={`bg-light rounded-0 ${p2Err ? 'is-invalid-ph' : ''}`}
                      value={newPw2}
                      onChange={(e) => { setNewPw2(e.target.value); if (p2Err && e.target.value.trim()) setP2Err(false); }}
                      autoComplete="new-password"
                    />
                  </Form.Group>

                  {error && <div className="text-danger small mb-2">* {error}</div>}

                  {/* PC/태블릿 */}
                  <div className="d-none d-md-grid gap-2">
                    <Button className="w-100 fw-bold btn-main-blue" onClick={handleResetPassword}>
                      비밀번호 변경
                    </Button>
                    <Button className="w-100 fw-bold btn-outline-blue" onClick={resetForm}>
                      취소
                    </Button>
                  </div>

                  {/* 모바일 */}
                  <div className="d-flex d-md-none gap-2">
                    <Button
                      className="flex-fill fw-bold btn-main-blue"
                      style={{ height: '48px', fontSize: '16px' }}
                      onClick={handleResetPassword}
                    >
                      비밀번호 변경
                    </Button>
                    <Button
                      className="flex-fill fw-bold btn-outline-blue"
                      style={{ height: '48px', fontSize: '16px' }}
                      onClick={resetForm}
                    >
                      취소
                    </Button>
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
