import React, { useEffect, useState } from "react";
import '../../App.css';
import "../../css/Pharmacy.css";
import { Container, Row, Col, Table, Card } from "react-bootstrap";
import { useParams, Link } from 'react-router-dom';
import { StarFill, Star, CheckCircleFill, XCircleFill } from "react-bootstrap-icons";
import { openUtil } from "../../util/openUtil";
import { DAY_KEYS, matchForDay, getTodayKey } from "../../util/dayUtil";
import useFavorites from "../../hook/useFavorites";
import KakaoMapComponent from "../../component/common/KakaoMapComponent";

const PharmacyDetail = () => {
  const { id } = useParams();
  const [pharmacy, setPharmacy] = useState(null);
  const [open, setOpen] = useState(false);
  const { check, toggle } = useFavorites("PHARMACY");

  // 약국 정보 불러오기
  useEffect(() => {
    const fetchPharmacy = async () => {
      try {
        const res = await fetch(`http://localhost:8080/project/pharmacy/${id}`);
        const data = await res.json();
        setPharmacy(data);
        setOpen(openUtil(data.facilityBusinessHours || data.facility?.businessHours || []));
      } catch (error) {
        console.error("약국 정보를 불러오지 못했습니다:", error);
      }
    };
    fetchPharmacy();
  }, [id]);

  if (!pharmacy) return <div>로딩 중...</div>;
  const bizHours = pharmacy.facilityBusinessHours || pharmacy.facility?.businessHours || [];
  const isFavorite = check(id);

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
                <span className="favorite-icon" onClick={() => toggle(id)}>
                  {isFavorite ? <StarFill size={30} color="#FFD43B" /> : <Star size={30} />}
                </span>
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
              <KakaoMapComponent
                id="map"
                lat={pharmacy.facility?.latitude}
                lng={pharmacy.facility?.longitude}
                name={pharmacy.pharmacyName}
                height={300}
              />
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
                      const matched = matchForDay(dayKey, bizHours);
                      const today = getTodayKey();
                      const isToday = dayKey === today;
                      const labelMap = {
                        MON: "월", TUE: "화", WED: "수", THU: "목",
                        FRI: "금", SAT: "토", SUN: "일",
                      };

                      return (
                        <Col key={idx} xs={6} md={6} className="mb-1">
                          <strong style={isToday ? { color: "#2563eb" } : {}}>
                            {labelMap[dayKey]}
                          </strong>{" "}
                          {matched
                            ? `${matched.openTime}~${matched.closeTime}`
                            : <strong style={{ color: "#eb2525ff" }}>휴무</strong>}
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