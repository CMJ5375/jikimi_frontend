// src/page/user/LoginMain.js
import { Container, Row, Col, Form, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import useCustomLogin from '../../hook/useCustomLogin';
import { getKakaoLoginLink } from '../../api/kakaoApi';
import { setCookie, removeCookie } from '../../util/cookieUtil';
import '../../css/btn.css';

const initState = { username: '', password: '' };

const LoginMain = () => {
  const [loginParam, setLoginParam] = useState({ ...initState });
  const { doLogin, moveToPath } = useCustomLogin();

  const handleChange = (e) => {
    loginParam[e.target.name] = e.target.value;
    setLoginParam({ ...loginParam });
  };

  const handClickLogin = async (e) => {
    e?.preventDefault?.();

    const { username, password } = loginParam;
    if (!username?.trim() || !password?.trim()) {
      alert('아이디와 비밀번호를 모두 입력해 주세요.');
      return;
    }

    try {
      // ✅ 실패 시 throw, 성공 시 data 반환
      const data = await doLogin({ username: username.trim(), password });

      // 성공 시에만 진행
      const profileImage = data?.profileImage ?? data?.user?.profileImage ?? null;
      setCookie('member', { ...data, profileImage }, 1); // 1일
      alert('로그인 성공');
      moveToPath('/');
    } catch (err) {
      // 실패 시: 페이지 그대로 + 이전 로그인 흔적 제거
      removeCookie('member');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');

      const msg =
        err?.payload?.message || // rejectWithValue로 내려온 에러
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        '아이디/비밀번호를 다시 확인해주세요.';
      alert(msg);
    }
  };

  const goKakao = () => {
    window.location.href = getKakaoLoginLink();
  };

  return (
    <>
      <Container className="py-5">
        <Row className="justify-content-center align-items-center">
          {/* PC 전용 - 왼쪽 설명 영역 (lg 이상부터만 보여줌) */}
          <Col lg={6} className="d-none d-lg-block text-center order-lg-1">
            <img src="/image/loginLogo.png" alt="로고" style={{ width: '480px' }} className="mb-4" />
          </Col>

          {/* 로그인 폼 영역 */}
          <Col xs={12} md={8} lg={6} className="order-lg-2">
            <h3 className="mb-4 fw-bold text-center text-lg-center">로그인</h3>

            <Form>
              <Form.Group className="mb-3">
                <Form.Control
                  type="text"
                  name="username"
                  placeholder="아이디를 입력해주세요."
                  className="bg-light rounded-0"
                  onChange={handleChange}
                  autoComplete="username"
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Control
                  type="password"
                  name="password"
                  placeholder="비밀번호를 입력해주세요."
                  className="bg-light rounded-0"
                  onChange={handleChange}
                  autoComplete="current-password"
                />
              </Form.Group>

              <div className="mb-3">
                <Link to="/finduser" style={{ fontSize: '14px', color: 'black' }}>
                  계정을 잊으셨나요?
                </Link>
              </div>

              {/* 모바일 */}
              <div className="d-block d-md-none mb-3">
                <Row className="g-2 ">
                  <Col xs={6}>
                    <Button
                      className="w-100 fw-bold mb-3 btn-main-blue"
                      style={{ fontSize: '16px', height: '48px' }}
                      onClick={handClickLogin}
                    >
                      로그인
                    </Button>
                  </Col>
                  <Col xs={6}>
                    <Button
                      className="w-100 fw-bold btn-outline-blue"
                      style={{ fontSize: '16px', height: '48px' }}
                      as={Link}
                      to="/register"
                    >
                      회원가입
                    </Button>
                  </Col>
                </Row>
              </div>

              {/* 태블릿 */}
              <div className="d-none d-md-block d-lg-none d-grid gap-2 mb-3">
                <Button
                  className="w-100 fw-bold mb-3 btn-main-blue"
                  style={{ fontSize: '18px', height: '50px' }}
                  onClick={handClickLogin}
                >
                  로그인
                </Button>
                <Button
                  className="w-100 fw-bold btn-outline-blue"
                  style={{ fontSize: '18px', height: '50px' }}
                  as={Link}
                  to="/register"
                >
                  회원가입
                </Button>
              </div>

              {/* PC */}
              <div className="d-none d-lg-block d-grid gap-2">
                <Button
                  className="w-100 fw-bold mb-3 btn-main-blue"
                  style={{ fontSize: '18px', height: '50px' }}
                  onClick={handClickLogin}
                >
                  로그인
                </Button>
                <Button
                  className="w-100 fw-bold btn-outline-blue"
                  style={{ fontSize: '18px', height: '50px' }}
                  as={Link}
                  to="/register"
                >
                  회원가입
                </Button>
              </div>

              <div className="d-flex align-items-center my-3 divider">
                <div className="flex-grow-1 border-bottom fw-bold"></div>
                <span className="mx-3">또는</span>
                <div className="flex-grow-1 border-bottom"></div>
              </div>

              {/* 소셜 로그인 버튼들 */}
              <div className="d-grid gap-2">
                <Button
                  className="text-dark fw-bold d-flex align-items-center justify-content-center shadow"
                  style={{ backgroundColor: '#fef01b', border: 'none', height: '50px' }}
                  onClick={goKakao}
                >
                  <img src="/image/kakao.png" alt="Kakao" style={{ width: '28px' }} className="me-2" />
                  카카오로 시작하기
                </Button>
              </div>
            </Form>
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default LoginMain;
