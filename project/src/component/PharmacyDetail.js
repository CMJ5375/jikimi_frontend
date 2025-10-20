import React from 'react'
import { Container, Row, Col, Table, Card } from "react-bootstrap";
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { renderKakaoMap } from "../api/kakaoMapApi";

const PharmacyDetail = () => {
  const { id } = useParams();
  const [pharmacy, setPharmacy] = useState(null);

  // 약국 정보 가져오기
  useEffect(() => {
    const fetchPharmacy = async () => {
      try {
        const res = await fetch(`http://localhost:8080/api/facilities/${id}`);
        const data = await res.json();
        setPharmacy(data);
      } catch (error) {
        console.error("약국 정보를 불러오지 못했습니다:", error);
      }
    };
    fetchPharmacy();
  }, [id]);

  // 지도 표시
  useEffect(() => {
    if (!pharmacy || !pharmacy.latitude || !pharmacy.longitude) return;

    renderKakaoMap(
      "map",
      { lat: pharmacy.latitude, lng: pharmacy.longitude },
      [
        {
          name: pharmacy.name,
          latitude: pharmacy.latitude,
          longitude: pharmacy.longitude,
        },
      ]
    );
  }, [pharmacy]);

  if (!pharmacy) return <div>로딩 중...</div>;

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
                <span>약국찾기</span>
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
                약국 사정에 따라 운영시간이 불규칙할 수 있으니 반드시 전화로 사전 확인 후 방문해주시기 바랍니다.
              </div>
            </Col>
          </Row>

          {/* 약국명 + 즐겨찾기 + 운영 여부 */}
          <Row className="align-items-center mb-3">
            <Col>
              <h5 className="fw-bold mb-2">
                {pharmacy.name} <span className="text-warning">★</span>  {/* 즐겨찾기 표시는 로그인하면 보이게 */}
              </h5>
              <div className="d-flex gap-3">
                <span className="text-success fw-semibold">영업 중</span>
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
                    <td>{pharmacy.address || "-"}</td>
                  </tr>
                  <tr>
                    <th className="bg-light text-center">대표전화</th>
                    <td>{pharmacy.phone || "-"}</td>
                  </tr>
                  <tr>
                    <th className="bg-light text-center">기관구분</th>
                    <td>약국</td>
                  </tr>
                  <tr>
                    <th className="bg-light text-center">소개</th>
                    <td>-</td>
                  </tr>
                </tbody>
              </Table>
            </Col>
          </Row>

        {/* 진료시간 */}
          <Row className="mb-4">
            <Col xs={12}>
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
                    <Col xs={6} md={3} className='mb-1'><span className='fw-bold'>월요일</span> 09:00~19:00</Col>
                    <Col xs={6} md={3} className='mb-1 fw-bold'
                            style={{
                            color: 'red',
                            textDecoration: 'underline',
                            textDecorationColor: 'red',
                            textDecorationThickness: '2px',
                            }}>
                        <span>화요일</span>{' '}09:00~19:00
                    </Col>
                    <Col xs={6} md={3} className='mb-1'><span className='fw-bold'>수요일</span> 09:00~19:00</Col>
                    <Col xs={6} md={3} className='mb-1'><span className='fw-bold'>목요일</span> 09:00~19:00</Col>
                    <Col xs={6} md={3} className='mb-1'><span className='fw-bold'>금요일</span> 09:00~19:00</Col>
                    <Col xs={6} md={3} className='mb-1'><span className='fw-bold'>토요일</span> 09:00~19:00</Col>
                    <Col xs={6} md={3} className='mb-1'><span className='fw-bold'>일요일</span> 09:00~13:00</Col>
                  </Row>
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

export default PharmacyDetail