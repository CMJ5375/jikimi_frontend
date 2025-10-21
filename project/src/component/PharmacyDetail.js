import React from 'react'
import '../App.css';
import '../css/Pharmacy.css';
import { Container, Row, Col, Table, Card } from "react-bootstrap";
import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from "react";
import { renderKakaoMap } from "../api/kakaoMapApi";
import { StarFill, Star, CheckCircleFill, XCircleFill } from "react-bootstrap-icons";

const PharmacyDetail = () => {
  const { id } = useParams();
  const [pharmacy, setPharmacy] = useState(null);
  const [favorite, setFavorite] = useState(false);
  const [open, setOpen] = useState(false);

  // 약국 정보 불러오기
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

  //운영여부
  useEffect(() => {
    const now = new Date();
    const hour = now.getHours();
    setOpen(hour >= 9 && hour < 20);
  }, []);

  // 즐겨찾기 복원
  useEffect(() => {
    const stored = localStorage.getItem(`favorite_pharmacy_${id}`);
    if (stored === "true") setFavorite(true);
  }, [id]);

  // 즐겨찾기 토글
  const toggleFavorite = () => {
    const newState = !favorite;
    setFavorite(newState);
    localStorage.setItem(`favorite_pharmacy_${id}`, newState);
  };

  if (!pharmacy) return <div>로딩 중...</div>;

  return (
    <>
      <div className="bg-white">
        <Container className="py-4">
        {/* 경로 */}
          <Row>
            <Col>
              <div className="d-flex align-items-center gap-2 mb-3">
                <Link to="/" className="text-gray">HOME</Link>
                <span>{'>'}</span>
                <Link to="/pharmacy" className="text-gray">약국찾기</Link>
                <span>{'>'}</span>
                <span className="breadcrumb-current">{pharmacy?.name || "약국상세"}</span>
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

        {/* 약국명 + 상태 */}
          <Row className="align-items-center mb-3">
            <Col>
              <h4 className="fw-bold mb-2 d-flex align-items-center justify-content-between">
                <span>{pharmacy.name}</span>
                <span className={`favorite-icon ${favorite ? 'active' : ''}`} onClick={toggleFavorite}>
                  {favorite ? <StarFill size={30}/> : <Star size={30}/>}
                </span>
              </h4>
              <div className="d-flex gap-3 mt-2">
                {open ? (
                  <span><CheckCircleFill className="text-success me-2" />운영 중</span>
                ) : (
                  <span><XCircleFill className="text-danger me-2" />운영 종료</span>
                )}
              </div>
            </Col>
          </Row>

        {/* 지도 + 정보 */}
          <Row className="mb-4">
            <Col md={6}><div id="map" className="pharmacy-map"></div></Col>
            <Col md={6}>
              <Table className="mt-3 mt-md-0 small pharmacy-table">
                <tbody>
                  <tr><th className="w-25">주소</th><td>{pharmacy.address || "-"}</td></tr>
                  <tr><th>대표전화</th><td>{pharmacy.phone || "-"}</td></tr>
                  <tr><th>기관구분</th><td>약국</td></tr>
                  <tr><th>소개</th><td>-</td></tr>
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