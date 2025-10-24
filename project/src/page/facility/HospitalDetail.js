import React, { useEffect, useState } from 'react';
import '../../App.css';
import "../../css/Hospital.css";
import { Container, Row, Col, Table, Card } from "react-bootstrap";
import { useParams, Link } from 'react-router-dom';
import { StarFill, Star, CheckCircleFill, XCircleFill, HospitalFill } from "react-bootstrap-icons";
import { openUtil } from "../../util/openUtil";
import { DAY_KEYS, getTodayKey, getKoreanDayName, getHoursByDay } from "../../util/dayUtil";
import useFavorites from "../../hook/useFavorites";
import KakaoMapComponent from "../../component/common/KakaoMapComponent";

const HospitalDetail = () => {
  const { id } = useParams()
  const [hospital, setHospital] = useState(null)
  const [open, setOpen] = useState(false)
  const { check, toggle } = useFavorites("HOSPITAL");
  const [businessHours, setBusinessHours] = useState([]);

  //병원 정보 불러오기
  useEffect(() => {
    const fetchHospital = async () => {
      try {
        const res = await fetch(`http://localhost:8080/project/hospital/${id}`);
        const data = await res.json();
        setHospital(data);
        setOpen(openUtil(data.facilityBusinessHours || []));
      } catch (error) {
        console.error("병원 정보를 불러오지 못했습니다:", error);
      }
    };
    fetchHospital();
  }, [id]);

  // 진료시간 데이터 불러오기
   useEffect(() => {
    const fetchHours = async () => {
      try {
        const res = await fetch(`http://localhost:8080/project/hospital/${id}/business-hours`);
        const data = await res.json();
        setBusinessHours(data);
      } catch (err) {
        console.error("진료시간 로드 실패:", err);
      }
    };
    fetchHours();
  }, [id]);

  if (!hospital) return <div>로딩 중...</div>;

  const bizHours =
    hospital.facilityBusinessHours ||
    hospital.facilityBusinessHourList ||
    hospital.facility?.businessHours ||
    hospital.facility?.businessHourList ||
    businessHours;

  // 다양한 형태(departments가 배열/문자열 모두) 대응
  const departmentsSrc = hospital.departments ?? hospital.departmentList ?? [];
  const departmentsList = Array.isArray(departmentsSrc)
    ? departmentsSrc.map((d) => d?.deptName ?? d?.name ?? String(d))
    : (typeof departmentsSrc === 'string'
        ? departmentsSrc.split(',').map(s => s.trim()).filter(Boolean)
        : []);

  // 의료자원 키(resources | institutions) 모두 대응 + 배열/문자열 모두 처리
  const resourcesSrc = hospital.resources ?? hospital.institutions ?? [];
  const resourcesList = Array.isArray(resourcesSrc)
    ? resourcesSrc.map((r) => r?.institutionName ?? r?.name ?? String(r))
    : (typeof resourcesSrc === 'string'
        ? resourcesSrc.split(',').map(s => s.trim()).filter(Boolean)
        : []);

  const isFavorite = check(id);
  const todayKey = getTodayKey();

  return (
    <div className="bg-white">
      <Container className="py-4">
        {/* 경로 */}
        <Row>
          <Col>
            <div className="d-flex align-items-center gap-2 mb-3">
              <Link to="/" className="text-route">HOME</Link>
              <span>{'>'}</span>
              <Link to="/" className="text-route">병원찾기</Link>
              <span>{'>'}</span>
              <span className="breadcrumb-current">{hospital?.hospitalName || "병원상세"}</span>
            </div>
          </Col>
        </Row>

        {/* 안내 문구 */}
        <Row>
          <Col>
            <div className="hospital-notice mb-4">
              진료시간이 변동될 수 있으므로 기관에 전화 확인 후 방문해 주시길 바랍니다.
              (접수 마감 시간 확인 등)
            </div>
          </Col>
        </Row>

        {/* 병원명 + 상태 */}
        <Row className="align-items-center mb-3">
          <Col>
            <h4 className="fw-bold mb-2 d-flex align-items-center justify-content-between">
              {hospital.hospitalName}
              <span className="favorite-icon" onClick={() => toggle(id)}>
                {isFavorite ? <StarFill size={30} color="#FFD43B" /> : <Star size={30} />}
              </span>
            </h4>
            <div className="d-flex flex-wrap gap-3 mt-2">
              <span>{hospital.hasEmergency ? 
                <><HospitalFill className="text-danger me-2" />응급실 운영</> : 
                <><XCircleFill className="text-secondary me-2" />응급실 없음</>}</span>
              <span>{open ? 
                <><CheckCircleFill className="text-success me-2" />운영 중</> : 
                <><XCircleFill className="text-secondary me-2" />운영종료</>}</span>
            </div>
          </Col>
        </Row>

        {/* 지도 + 정보 테이블 */}
        <Row className="mb-4">
          <Col md={6}>
            <KakaoMapComponent
              id="map"
              lat={hospital.facility?.latitude}
              lng={hospital.facility?.longitude}
              name={hospital.hospitalName}
              height={300}
            />
          </Col>
          <Col md={6}>
            <Table className="mt-3 mt-md-0 small hospital-table">
              <tbody>
                <tr>
                  <th className="w-25">주소</th>
                  <td>{hospital.facility?.address || "-"}</td>
                </tr>
                <tr>
                  <th>대표전화</th>
                  <td>{hospital.facility?.phone || "-"}</td>
                </tr>
                <tr>
                  <th>기관구분</th>
                  <td>{hospital.orgType || "병원"}</td>
                </tr>
                <tr>
                  <th>소개</th>
                  <td>-</td>
                </tr>
              </tbody>
            </Table>
          </Col>
        </Row>

        {/* 카드 그룹 */}
        <Row className="g-4 mb-4">
          {/* 진료시간 */}
           <Col xs={12} md={6}>
            <Card className="shadow-sm border-0 h-100">
              <Card.Header className="hospital-card-header">진료시간</Card.Header>
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

                {/* 오늘 요일 강조 스타일 */}
                <style>
                  {`
                  .today {
                    color: #2563eb;
                    font-weight: 700;
                    text-decoration: underline;
                  }
                  `}
                </style>
              </Card.Body>
            </Card>
          </Col>

          {/* 진료과목 */}
          <Col xs={12} md={6}>
            <Card className="shadow-sm border-0 h-100">
              <Card.Header className="hospital-card-header">진료과목</Card.Header>
              <Card.Body className="small text-secondary">
                {departmentsList.length > 0 ? (
                  <Row>
                    {departmentsList.map((name, idx) => (
                      <Col key={idx} xs={6} md={6} className="mb-1">{name}</Col>
                    ))}
                  </Row>
                ) : (
                  <div className="text-muted">등록된 진료과목이 없습니다.</div>
                )}
              </Card.Body>
            </Card>
          </Col>

          {/* 의료자원 */}
          <Col xs={12} md={6}>
            <Card className="shadow-sm border-0 h-100">
              <Card.Header className="hospital-card-header">의료자원</Card.Header>
              <Card.Body className="small text-secondary">
                {resourcesList.length > 0 ? (
                  <Row>
                    {resourcesList.map((name, idx) => (
                      <Col key={idx} xs={6} md={6} className="mb-1">{name}</Col>
                    ))}
                  </Row>
                ) : (
                  <div className="text-muted">등록된 의료자원이 없습니다.</div>
                )}
              </Card.Body>
            </Card>
          </Col>

          {/* 병상정보 */}
          <Col xs={12} md={6}>
            <Card className="shadow-sm border-0 h-100">
              <Card.Header className="hospital-card-header">실시간 병상정보</Card.Header>
              <Card.Body className="small text-primary">
                응급의료기관 외 기관으로 실시간 병상정보 제공 대상이 아닙니다.
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
                {bizHours.find(bh => bh?.note)?.note
                  ? bizHours.find(bh => bh?.note).note.replace(/Lunch/gi, "점심시간")
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
  );
};

export default HospitalDetail;
