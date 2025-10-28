import React, { useEffect, useState } from "react";
import '../../App.css';
import "../../css/Pharmacy.css";
import { Container, Row, Col, Table, Card } from "react-bootstrap";
import { useParams, Link } from 'react-router-dom';
import { StarFill, Star, CheckCircleFill, XCircleFill } from "react-bootstrap-icons";
import { openUtil } from "../../util/openUtil";
import { DAY_KEYS, getTodayKey, getKoreanDayName, getHoursByDay } from "../../util/dayUtil";
import useFavorites from "../../hook/useFavorites";
import KakaoMapComponent from "../../component/common/KakaoMapComponent";

const PharmacyDetail = () => {
  const { id } = useParams();
  const [pharmacy, setPharmacy] = useState(null);
  const [businessHours, setBusinessHours] = useState([]);
  const [open, setOpen] = useState(false);
  const { favorites, toggle, isLogin } = useFavorites("PHARMACY")
  const isFavorite = pharmacy && favorites.includes(String(id));

  // 약국 정보 불러오기
  useEffect(() => {
    const fetchPharmacy = async () => {
      try {
        const res = await fetch(`http://localhost:8080/project/pharmacy/${id}`);
        const data = await res.json();
        setPharmacy(data);
        setOpen(openUtil(data.facilityBusinessHours || []));
      } catch (error) {
        console.error("약국 정보를 불러오지 못했습니다:", error);
      }
    };
    fetchPharmacy();
  }, [id]);

  // 진료시간(영업시간) 불러오기
  useEffect(() => {
    const fetchHours = async () => {
      try {
        const res = await fetch(`http://localhost:8080/project/pharmacy/${id}/business-hours`);
        const data = await res.json();
        setBusinessHours(data);
      } catch (err) {
        console.error("영업시간 로드 실패:", err);
      }
    };
    fetchHours();
  }, [id]);

  if (!pharmacy) return <div>로딩 중...</div>;

  const bizHours =
    pharmacy.facilityBusinessHours ||
    pharmacy.facilityBusinessHourList ||
    pharmacy.facility?.businessHours ||
    businessHours;

  const todayKey = getTodayKey();

  return (
    <>
      <div className="bg-white">
        <Container className="py-4">
          {/* 경로 */}
          <Row>
            <Col>
              <div className="d-flex align-items-center gap-2 mb-3">
                <Link to="/" className="text-route">HOME</Link>
                <span>{'>'}</span>
                <Link to="/pharmacy" className="text-route">약국찾기</Link>
                <span>{'>'}</span>
                <span className="breadcrumb-current">{pharmacy?.pharmacyName || "약국상세"}</span>
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
                <span>{pharmacy.pharmacyName}</span>
                {/* ⭐ 로그인시에만 렌더 */}
                {isLogin && (
                  <span className="favorite-icon" onClick={() => toggle(id)}>
                    {isFavorite ? <StarFill size={30} color="#FFD43B" /> : <Star size={30} />}
                  </span>
                )}
              </h4>
              <div className="d-flex gap-3 mt-2">
                {open ? (
                  <span><CheckCircleFill className="text-success me-2" />운영 중</span>
                ) : (
                  <span><XCircleFill className="text-secondary me-2" />운영 종료</span>
                )}
              </div>
            </Col>
          </Row>

          {/* 지도 + 정보 */}
          <Row className="mb-4">
            <Col md={6}>
              {pharmacy.facility?.latitude && pharmacy.facility?.longitude && (
                <KakaoMapComponent
                  id={`pharmacy-map-${id}`}
                  lat={pharmacy.facility.latitude}
                  lng={pharmacy.facility.longitude}
                  name={pharmacy.pharmacyName}
                  height={300}
                  showCenterMarker={false}
                />
              )}
            </Col>
            <Col md={6}>
              <Table className="mt-3 mt-md-0 small pharmacy-table">
                <tbody>
                  <tr>
                    <th className="w-25">주소</th>
                    <td>{pharmacy.facility?.address || "-"}</td>
                  </tr>
                  <tr>
                    <th>대표전화</th>
                    <td>{pharmacy.facility?.phone || "-"}</td>
                  </tr>
                  <tr>
                    <th>기관구분</th>
                    <td>약국</td>
                  </tr>
                  <tr>
                    <th>소개</th>
                    <td>-</td>
                  </tr>
                </tbody>
              </Table>
            </Col>
          </Row>

          {/* 운영시간 */}
          <Row className="mb-4">
            <Col xs={12}>
              <Card className="shadow-sm border-0 h-100">
                <Card.Header className="pharmacy-card-header">운영시간</Card.Header>
                <Card.Body className="small text-secondary">
                  <Row>
                    {DAY_KEYS.map((dayKey, idx) => {
                    const row = getHoursByDay(dayKey, bizHours);
                    const isToday = dayKey === todayKey;
                    return (
                      <Col key={idx} xs={6} className={`mb-2 ${isToday ? "today" : ""}`}>
                        <div className="fw-bold">{getKoreanDayName(dayKey)}</div>
                        <div className={row.status === "휴무" ? "text-danger" : "text-dark"}>
                          {row.status}
                        </div>
                        <div className="text-muted small">{row.note}</div>
                      </Col>
                    );
                  })}
                  </Row>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* 비고 */}
          <Row>
            <Col>
              <div
                className="p-3 small border border-0 remark-box"
                style={{ background: "#DBEFFF", fontSize: "0.9rem", borderRadius: "8px" }}
              >
                <p className="mb-1">
                  <strong>비고:</strong>{" "}
                  {bizHours.find(bh => bh.note)?.note
                    ? bizHours.find(bh => bh.note).note.replace("Lunch", "점심시간")
                    : "점심시간 정보 없음"}
                </p>
                <p className="mb-0">
                  <strong>법정공휴일:</strong>{" "}
                  신정, 설, 삼일절, 어린이날, 석가탄신일, 현충일, 광복절, 추석, 개천절, 한글날, 크리스마스
                </p>
              </div>
            </Col>
          </Row>
        </Container>
      </div>
    </>
  );
};

export default PharmacyDetail