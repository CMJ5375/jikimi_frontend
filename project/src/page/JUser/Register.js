import React, { useState } from "react";
import { Container, Row, Col, Form, Button, Alert, Spinner } from "react-bootstrap";
import "../../css/btn.css";
import { API_SERVER_HOST } from "../../api/userApi";
import axios from "axios";
import useCustomLogin from "../../hook/useCustomLogin";
import { getKakaoLoginLink } from "../../api/kakaoApi";
import { useNavigate } from "react-router-dom";

const initState = {
  username: "",
  email: "",
  name: "",
  password: "",
  confirmPassword: "",
};

const Register = () => {
  const navigate = useNavigate();
  const { moveToPath } = useCustomLogin();

  const [form, setForm] = useState(initState);
  const [submitting, setSubmitting] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const [okMsg, setOkMsg] = useState("");

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrMsg("");
    setOkMsg("");
  };

  const handleClickRegister = async (e) => {
    e?.preventDefault?.();
    if (submitting) return;

    const username = form.username?.trim();
    const password = form.password;
    const confirmPassword = form.confirmPassword;
    const name = form.name?.trim();
    const email = form.email?.trim();

    if (!username || !password) {
      setErrMsg("아이디/비밀번호를 입력해주세요.");
      return;
    }
    if (password !== confirmPassword) {
      setErrMsg("비밀번호가 일치하지 않습니다.");
      return;
    }

    // ✅ 서버가 기대하는 필드만 전송 (confirmPassword 제외)
    const payload = {
      username,
      password,
      name: name || "",
      email: email || "",
      address: "",          // 백엔드 필드만 맞춰 보냄 (없으면 빈문자)
      profileImage: null,   // 필요시만 사용
      roleNames: ["USER"],  // 기본 권한
    };

    try {
      setSubmitting(true);
      setErrMsg("");
      setOkMsg("");

      // 반드시 JSON으로 보냄
      const res = await axios.post(`${API_SERVER_HOST}/project/register`, payload, {
        headers: { "Content-Type": "application/json" },
      });

      const msg = typeof res.data === "string" ? res.data : "회원가입 성공";
      setOkMsg(msg);
      setForm(initState);

      // 살짝 딜레이 후 이동
      setTimeout(() => moveToPath("/login"), 500);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        (typeof err.response?.data === "string" ? err.response.data : "") ||
        err.message ||
        "알 수 없는 오류가 발생했습니다.";
      setErrMsg(msg);
      console.error("REGISTER error:", err.response?.data || err);
    } finally {
      setSubmitting(false);
    }
  };

  const goKakao = () => {
    window.location.href = getKakaoLoginLink();
  };

  return (
    <Container className="py-5">
      <Row className="justify-content-center align-items-center">
        <Col lg={6} className="d-none d-lg-block text-center order-lg-1">
          <img src="/image/loginLogo.png" alt="로고" style={{ width: "480px" }} className="mb-4" />
        </Col>

        <Col xs={12} md={8} lg={6} className="order-lg-2">
          <h3 className="mb-4 fw-bold text-center text-lg-center">회원가입</h3>

          {errMsg && <Alert variant="danger">{errMsg}</Alert>}
          {okMsg && <Alert variant="success">{okMsg}</Alert>}

          <Form onSubmit={handleClickRegister}>
            <Form.Group className="mb-2">
              <Form.Control
                type="text"
                name="username"
                placeholder="아이디를 입력해주세요."
                className="bg-light rounded-0"
                value={form.username}
                onChange={onChange}
                disabled={submitting}
              />
            </Form.Group>

            <Form.Group className="mb-2">
              <Form.Control
                type="email"
                name="email"
                placeholder="이메일을 입력해주세요."
                className="bg-light rounded-0"
                value={form.email}
                onChange={onChange}
                disabled={submitting}
              />
            </Form.Group>

            <Form.Group className="mb-2">
              <Form.Control
                type="text"
                name="name"
                placeholder="이름을 입력해주세요."
                className="bg-light rounded-0"
                value={form.name}
                onChange={onChange}
                disabled={submitting}
              />
            </Form.Group>

            <Form.Group className="mb-2">
              <Form.Control
                type="password"
                name="password"
                placeholder="비밀번호를 입력해주세요."
                className="bg-light rounded-0"
                value={form.password}
                onChange={onChange}
                disabled={submitting}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Control
                type="password"
                name="confirmPassword"
                placeholder="비밀번호를 다시 입력해주세요."
                className="bg-light rounded-0"
                value={form.confirmPassword}
                onChange={onChange}
                disabled={submitting}
              />
            </Form.Group>

            <div className="mb-3">
              <a href="/login" style={{ fontSize: "14px", color: "black" }}>
                이미 아이디가 있으신가요?
              </a>
            </div>

            {/* 모바일 */}
            <div className="d-block d-md-none mb-3">
              <Row className="g-2">
                <Col xs={6}>
                  <Button
                    type="button"
                    className="w-100 fw-bold mb-3 btn-main-blue"
                    style={{ fontSize: "16px", height: "48px" }}
                    onClick={handleClickRegister}
                    disabled={submitting}
                  >
                    {submitting ? <Spinner size="sm" /> : "회원가입"}
                  </Button>
                </Col>
                <Col xs={6}>
                  <Button type="button" className="w-100 fw-bold btn-outline-blue" disabled={submitting}>
                    취소
                  </Button>
                </Col>
              </Row>
            </div>

            {/* 태블릿 */}
            <div className="d-none d-md-block d-lg-none d-grid gap-2 mb-3">
              <Button
                type="button"
                className="w-100 fw-bold mb-3 shadow btn-main-blue"
                style={{ fontSize: "18px", height: "50px" }}
                onClick={handleClickRegister}
                disabled={submitting}
              >
                {submitting ? <Spinner size="sm" /> : "회원가입"}
              </Button>
              <Button type="button" className="w-100 fw-bold btn-outline-blue" disabled={submitting}>
                취소
              </Button>
            </div>

            {/* PC */}
            <div className="d-none d-lg-block d-grid gap-2">
              <Button
                className="w-100 fw-bold shadow mb-3 btn-main-blue"
                style={{ fontSize: "18px", height: "50px" }}
                type="submit"
                disabled={submitting}
              >
                {submitting ? <Spinner size="sm" /> : "회원가입"}
              </Button>
              <Button
                type="button"
                className="w-100 fw-bold btn-outline-blue"
                onClick={() => navigate("/login")}
                disabled={submitting}
              >
                취소
              </Button>
            </div>

            <div className="d-flex align-items-center my-3 divider">
              <div className="flex-grow-1 border-bottom fw-bold"></div>
              <span className="mx-3">또는</span>
              <div className="flex-grow-1 border-bottom"></div>
            </div>

            {/* 카카오 */}
            <div className="d-grid gap-2">
              <Button
                type="button"
                className="text-dark fw-bold d-flex align-items-center justify-content-center shadow"
                style={{ backgroundColor: "#fef01b", border: "none", height: "50px" }}
                onClick={goKakao}
                disabled={submitting}
              >
                <img src="/image/kakao.png" alt="Kakao" style={{ width: "28px" }} className="me-2" />
                카카오로 시작하기
              </Button>
            </div>
          </Form>
        </Col>
      </Row>
    </Container>
  );
};

export default Register;
