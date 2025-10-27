import React, { useEffect, useRef, useState } from 'react';
import { Container, Row, Col, Form, Button, Nav, Card } from 'react-bootstrap';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { sendCodeApi, verifyCodeApi, getUsernameApi } from "../../api/userApi";
import '../../css/btn.css';

const FindUser = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");

  // 발송/재발송 안내 메시지(지속 유지)
  const [sendMsg, setSendMsg] = useState(""); // "", "인증번호를 보냈습니다...", "인증번호를 다시 보냈습니다..."
  const [isResend, setIsResend] = useState(false); // 재발송 여부(스타일 다르게)

  const [isVerified, setIsVerified] = useState(false);
  const [result, setResult] = useState({ userId: "", joinDate: "" }); // userId = 서버 username

  // 서버/네트워크 오류 메시지(공통)
  const [error, setError] = useState("");

  // 각 필드별 입력 검증 오류 → placeholder로 표시
  const [emailError, setEmailError] = useState(false);
  const [codeError, setCodeError] = useState(false);

  // 재발송 타이머(sec) — 버튼은 항상 클릭 가능
  const [left, setLeft] = useState(0);
  const timerRef = useRef(null);

  // 타이머
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

  // 발송/재발송 공통 처리 (메시지는 유지)
  const handleSend = async () => {
    setError("");
    setIsVerified(false);
    setResult({ userId: "", joinDate: "" });
    setEmailError(false);

    if (!email.trim()) {
      setEmailError(true);
      return;
    }

    try {
      await sendCodeApi(email);
      // 항상 5분으로 리셋
      startTimer(300);

      // 메시지 지속 유지 + 재발송 시 크게/볼드
      const isRe = left > 0; // 남은 시간이 있었다면 재발송
      setIsResend(isRe);
      setSendMsg(
        isRe
          ? "인증번호를 다시 보냈습니다. (스팸함도 확인해주세요)"
          : "인증번호를 보냈습니다. (스팸함도 확인해주세요)"
      );
    } catch (e) {
      console.error("send-code error:", e?.response?.status, e?.response?.data);
      setError("인증번호 발송에 실패했습니다. 잠시 후 다시 시도해주세요.");
      setSendMsg("");
      setIsResend(false);
    }
  };

  const handleVerify = async () => {
    setError("");
    setEmailError(false);
    setCodeError(false);

    let hasErr = false;
    if (!email.trim()) {
      setEmailError(true);
      hasErr = true;
    }
    if (!code.trim()) {
      setCodeError(true);
      hasErr = true;
    }
    if (hasErr) return;

    try {
      // 1) 코드 검증
      const { data: v } = await verifyCodeApi(email, code);
      if (!v?.verified) {
        setIsVerified(false);
        setResult({ userId: "", joinDate: "" });
        setError("인증코드가 일치하지 않거나 만료되었습니다.");
        return;
      }

      // 2) 이메일로 username 조회
      const { data: u } = await getUsernameApi(email);
      setIsVerified(true);
      setResult({
        userId: u?.username ?? "",
        joinDate: ""
      });

      // ✅ 검증 성공 후에도 발송/재발송 메시지는 유지
    } catch (e) {
      if (e?.response?.status === 404) {
        setError("해당 이메일로 가입된 계정이 없습니다.");
      } else {
        console.error("verify/username error:", e?.response?.status, e?.response?.data);
        setError("확인 중 오류가 발생했습니다.");
      }
    }
  };

  const resetForm = () => {
    setIsVerified(false);
    setEmail("");
    setCode("");
    setError("");
    setSendMsg("");      // 리셋 때만 메시지 초기화
    setIsResend(false);
    setEmailError(false);
    setCodeError(false);
    setResult({ userId: "", joinDate: "" });
    setLeft(0);
    clearTimeout(timerRef.current);
  };

  // placeholder 문구 동적 생성
  const emailPlaceholder = emailError ? "*이메일을 입력해주세요" : "이메일을 입력해주세요.";
  const codePlaceholder  = codeError  ? "*인증번호를 입력해주세요" : "인증번호를 입력해주세요.";

  return (
    <>
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
                <Form>
                  {/* 이메일 + 발송 */}
                  <Form.Group className="mb-2 d-flex align-items-center">
                    <Form.Control
                      type="email"
                      placeholder={emailPlaceholder}
                      className={`bg-light rounded-0 ${emailError ? 'is-invalid-ph' : ''}`}
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (emailError && e.target.value.trim()) setEmailError(false);
                      }}
                      autoComplete="email"
                    />
                    <Button
                      variant="light"
                      className="ms-2 fw-bold btn-main-blue"
                      style={{ fontSize: "14px", height: "40px", width: "76px" }}
                      onClick={handleSend}
                    >
                      {left > 0 ? mmss(left) : "발송"}
                    </Button>
                  </Form.Group>

                  {/* 코드 + 확인 */}
                  <Form.Group className="mb-2 d-flex align-items-center">
                    <Form.Control
                      type="text"
                      placeholder={codePlaceholder}
                      className={`bg-light rounded-0 ${codeError ? 'is-invalid-ph' : ''}`}
                      value={code}
                      onChange={(e) => {
                        setCode(e.target.value);
                        if (codeError && e.target.value.trim()) setCodeError(false);
                      }}
                      maxLength={6}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      autoComplete="one-time-code"
                    />
                    <Button
                      variant="light"
                      className="ms-2 fw-bold btn-outline-blue"
                      style={{ fontSize: "14px", height: "40px", width: "76px" }}
                      onClick={handleVerify}
                    >
                      확인
                    </Button>
                  </Form.Group>

                  {/* 인라인 메시지 영역 */}
                  {error && (
                    <div className="text-danger small mb-2">* {error}</div>
                  )}
                  {!error && sendMsg && (
                    <div
                      className={isResend ? "text-success mb-2 fw-bold" : "text-success small mb-2"}
                      style={isResend ? { fontSize: "16px" } : undefined}
                      aria-live="polite"
                    >
                      {sendMsg}
                    </div>
                  )}

                  <div className="mb-3">
                    <button
                      type="button"
                      className="btn p-0 border-0 bg-transparent"
                      style={{ fontSize: "14px", color: "black" }}
                      onClick={handleSend}
                      title={left > 0 ? `재발송까지 ${mmss(left)}` : "재발송"}
                    >
                      인증번호가 오지 않으신가요? 재발송
                    </button>
                  </div>

                  {/* CTA 버튼 — 항상 클릭 가능, 스타일 유지 */}
                  <div className="d-grid gap-2">
                    <Button
                      className="w-100 fw-bold btn-main-blue"
                      onClick={handleVerify}
                    >
                      아이디 찾기
                    </Button>
                    <Button className="w-100 fw-bold btn-outline-blue" onClick={resetForm}>
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
                    <div className="mb-2" style={{ fontSize: 14 }}>
                      <div className="mb-2 color-dark">
                        아이디 : <b>{result.userId}</b>
                      </div>
                      {result.joinDate && <div>가입일 : {result.joinDate}</div>}
                    </div>
                  </Card.Body>
                </Card>

                {/* PC & 태블릿 */}
                <div className="d-none d-md-grid gap-2">
                  <Button className="w-100 fw-bold btn-main-blue" onClick={() => navigate("/login")}>
                    확인
                  </Button>
                  <Button as={Link} to="/finduserpw" className="w-100 fw-bold btn-outline-blue">
                    비밀번호 재설정
                  </Button>
                </div>

                {/* 모바일 */}
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
    </>
  );
};

export default FindUser;
