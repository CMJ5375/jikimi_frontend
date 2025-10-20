import React, { useEffect, useState } from 'react'
import { Container, Row, Col, Table, Card } from "react-bootstrap";
import { useParams } from 'react-router-dom';
import { renderKakaoMap } from "../api/kakaoMapApi";

const HospitalDetail = () => {
  const { id } = useParams();
  const [hospital, setHospital] = useState(null);

  //병원 정보 가져오기
  useEffect(() => {
    const fetchHospital = async () => {
      try {
        const res = await fetch(`http://localhost:8080/api/facilities/${id}`);
        const data = await res.json();
        setHospital(data);
      } catch (error) {
        console.error("병원 정보를 불러오지 못했습니다:", error);
      }
    };
    fetchHospital();
  }, [id]);

  //지도 표시
  useEffect(() => {
    if (!hospital || !hospital.latitude || !hospital.longitude) return;

    renderKakaoMap(
      "map",
      { lat: hospital.latitude, lng: hospital.longitude },
      [
        {
          name: hospital.name,
          latitude: hospital.latitude,
          longitude: hospital.longitude,
        },
      ]
    );
  }, [hospital]);

  if (!hospital) return <div>로딩 중...</div>;

  return (
    <>
    <div className="bg-white">
        <Container className="py-4">
            {/* 경로 */}
            <Row>
            <Col>
                <div className="d-flex align-items-center gap-2 text-secondary mb-3 small">
                <span>HOME</span>
                <span>{'>'}</span>
                <span>병원찾기</span>
                </div>
            </Col>
            </Row>

            {/* 안내 문구 */}
            <Row>
            <Col>
                <div
                className="border border-0 p-3 text-center text-primary mb-4"
                style={{ background: "#DBEFFF", fontSize: "0.9rem" }}
                >
                진료시간이 변동될 수 있으므로 기관에 전화 확인 후 방문해 주시길 바랍니다.
                (접수 마감 시간 확인 등)
                </div>
            </Col>
            </Row>

            {/* 병원명 + 즐겨찾기 + 응급실 운영 및 진료 여부 */}
            <Row className="align-items-center mb-3">
            <Col>
                <h5 className="fw-bold mb-2">
                {hospital.name} <span className="text-warning">★</span>  {/* 즐겨찾기 표시는 로그인하면 보이게 */}
                </h5>
                <div className="d-flex gap-3">
                <span className="text-danger fw-semibold">응급실 운영</span>
                <span className="text-success fw-semibold">진료 가능</span>
                </div>
            </Col>
            </Row>

            {/* 지도 + 정보 테이블 */}
            <Row className="mb-4">
            <Col md={6}>
                <div id="map"
                    style={{
                        backgroundColor: "#f4f4f4",
                        height: "280px",
                        border: "0px solid #ddd",
                    }}
                ></div>
            </Col>
            <Col md={6}>
                <Table className="mt-3 mt-md-0 small">
                    <tbody>
                        <tr>
                            <th className="bg-light w-25 text-center">주소</th>
                            <td>{hospital.address || "-"}</td>
                        </tr>
                        <tr>
                            <th className="bg-light text-center">대표전화</th>
                            <td>{hospital.phone || "-"}</td>
                        </tr>
                        <tr>
                            <th className="bg-light text-center">기관구분</th>
                            <td>병원</td>
                        </tr>
                        <tr>
                            <th className="bg-light text-center">소개</th>
                            <td>-</td>
                        </tr>
                    </tbody>
                </Table>
            </Col>
            </Row>

            {/* 카드 4개 (진료시간 / 진료과목 / 의료자원 / 실시간 병상정보) */}
            <Row className="g-4 mb-4">
            {/* 진료시간 */}
            <Col xs={12} md={6}>
                <Card className="shadow-sm border-0 h-100">
                <Card.Header
                    className="fw-bold"
                    style={{
                        backgroundColor: "#f4f4f4",
                        color: "#414141ff",
                        height: "50px",
                        display: "flex",
                        alignItems: "center",
                        paddingLeft: "15px",
                    }}
                >
                    진료시간
                </Card.Header>
                <Card.Body className="small text-secondary">
                    <Row>
                    <Col xs={6} md={6} className='mb-1'><span className='fw-bold'>월요일</span> 09:00~21:00</Col>
                    <Col xs={6} md={6} className='mb-1 fw-bold'
                            style={{
                                color: 'red',
                                textDecoration: 'underline',
                                textDecorationColor: 'red',
                                textDecorationThickness: '2px',
                            }}>
                        <span>화요일</span>{' '}09:00~21:00
                    </Col>
                    <Col xs={6} md={6}  className='mb-1'><span className='fw-bold'>수요일</span> 09:00~21:00</Col>
                    <Col xs={6} md={6}  className='mb-1'><span className='fw-bold'>목요일</span> 09:00~21:00</Col>
                    <Col xs={6} md={6}  className='mb-1'><span className='fw-bold'>금요일</span> 09:00~21:00</Col>
                    <Col xs={6} md={6}  className='mb-1'><span className='fw-bold'>토요일</span> 09:00~13:00</Col>
                    <Col xs={6} md={6}  className='mb-1'><span className='fw-bold'>일요일</span><span className='text-danger'> 정기휴무</span></Col>
                    </Row>
                </Card.Body>
                </Card>
            </Col>

            {/* 진료과목 */}
            <Col xs={12} md={6}>
                <Card className="shadow-sm border-0 h-100">
                <Card.Header
                    className="fw-bold"
                    style={{
                        backgroundColor: "#f4f4f4",
                        color: "#414141ff",
                        height: "50px",
                        display: "flex",
                        alignItems: "center",
                        paddingLeft: "15px",
                        }}
                >
                    진료과목
                </Card.Header>
                <Card.Body className="small text-secondary">
                    <Row>
                    {[
                        "가정의학과", "내과", "마취통증의학과", "병리과",
                        "신경과", "신경외과", "영상의학과", "응급의학과",
                        "재활의학과", "정형외과", "피부과"
                    ].map((item, idx) => (
                        <Col key={idx} xs={6} md={6} className="mb-1">
                        {item}
                        </Col>
                    ))}
                    </Row>
                </Card.Body>
                </Card>
            </Col>

            {/* 의료자원 */}
            <Col xs={12} md={6}>
                <Card className="shadow-sm border-0 h-100">
                <Card.Header
                    className="fw-bold"
                    style={{
                    backgroundColor: "#f4f4f4",
                    color: "#414141ff",
                    height: "50px",
                    display: "flex",
                    alignItems: "center",
                    paddingLeft: "15px",
                    }}
                >
                    의료자원
                </Card.Header>
                <Card.Body className="small text-secondary">
                    <Row>
                    {["CT", "MRI", "X-RAY", "심전도", "근전도"].map((item, idx) => (
                        <Col key={idx} xs={6} md={6} className="mb-1">
                        {item}
                        </Col>
                    ))}
                    </Row>
                </Card.Body>
                </Card>
            </Col>

            {/* 실시간 병상정보 */}
            <Col xs={12} md={6}>
                <Card className="shadow-sm border-0 h-100">
                <Card.Header
                    className="fw-bold"
                    style={{
                        backgroundColor: "#f4f4f4",
                        color: "#414141ff",
                        height: "50px",
                        display: "flex",
                        alignItems: "center",
                        paddingLeft: "15px",
                    }}
                >
                    실시간 병상정보
                </Card.Header>
                <Card.Body className="small text-primary">
                    응급의료기관 외 기관으로 실시간 병상정보 제공 대상이 아닙니다.
                </Card.Body>
                </Card>
            </Col>
            </Row>

            {/* 비고 (맨 아래) */}
            <Row>
            <Col>
                <div
                className="p-3 small border border-0"
                style={{ background: "#DBEFFF", fontSize: "0.9rem" }}
                >
                <p className="mb-1">
                    <strong>비고:</strong> 점심 12:30~13:30 (접수는 12:10 마감) / 24시간 응급실 진료
                </p>
                <p className="mb-0">
                    <strong>법정공휴일:</strong> 신정, 설, 삼일절, 어린이날, 석가탄신일,
                    현충일, 광복절, 추석, 개천절, 한글날, 크리스마스
                </p>
                </div>
            </Col>
            </Row>

        </Container>
    </div>
    </>
    )
}

export default HospitalDetail