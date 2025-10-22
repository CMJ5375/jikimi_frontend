import React, { useEffect, useState } from 'react';
import '../App.css';
import '../css/Hospital.css';
import { Container, Row, Col, Table, Card } from "react-bootstrap";
import { useParams, Link } from 'react-router-dom';
import { renderKakaoMap } from "../api/kakaoMapApi";
import { StarFill, Star, CheckCircleFill, XCircleFill, HospitalFill } from "react-bootstrap-icons";

//오늘 ‘운영중’ 계산 유틸 (병원 상세)
function isOpenNow(businessHours = []) { 
  if (!Array.isArray(businessHours) || businessHours.length === 0) return false
  const now = new Date()
  const dayNames = ["SUNDAY","MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY"]
  const today = dayNames[now.getDay()]
  const todayEntry = businessHours.find(b => (b.dayOfWeek || "").toUpperCase() === today)
  if (!todayEntry) return false
  if (todayEntry.open24h) return true
  if (todayEntry.closed) return false
  if (!todayEntry.openTime || !todayEntry.closeTime) return false
  const [oH,oM] = todayEntry.openTime.split(":").map(Number)
  const [cH,cM] = todayEntry.closeTime.split(":").map(Number)
  const openMins  = oH*60 + oM
  const closeMins = cH*60 + cM
  const nowMins   = now.getHours()*60 + now.getMinutes()
  return nowMins >= openMins && nowMins < closeMins
}

//요일 한글 표기
const dayLabel = {
  MONDAY: "월요일",
  TUESDAY: "화요일",
  WEDNESDAY: "수요일",
  THURSDAY: "목요일",
  FRIDAY: "금요일",
  SATURDAY: "토요일",
  SUNDAY: "일요일",
}

const HospitalDetail = () => {
  const { id } = useParams()
  const [hospital, setHospital] = useState(null)
  const [favorite, setFavorite] = useState(false)
  const [open, setOpen] = useState(false)
  const hasEmergency = false

  //병원 정보 불러오기
  useEffect(() => {
    const fetchHospital = async () => {
      try {
        const res = await fetch(`http://localhost:8080/project/hospital/${id}`)
        const data = await res.json()
        setHospital(data)
        setOpen(isOpenNow(data.facilityBusinessHours || data.facility?.businessHours || []))
      } catch (error) {
        console.error("병원 정보를 불러오지 못했습니다:", error)
      }
    }
    fetchHospital()
  }, [id])

  //지도 표시
  useEffect(() => {
    if (!hospital || !hospital.facility?.latitude || !hospital.facility?.longitude) return
    renderKakaoMap(
      "map",
      { lat: hospital.facility.latitude, lng: hospital.facility.longitude },
      [
        {
          name: hospital.hospitalName,
          latitude: hospital.facility.latitude,
          longitude: hospital.facility.longitude,
        },
      ]
    )
  }, [hospital])

  // 즐겨찾기 복원
  useEffect(() => {
    const stored = localStorage.getItem(`favorite_hospital_${id}`)
    if (stored === "true") setFavorite(true)
  }, [id])

  // 즐겨찾기 토글
  const toggleFavorite = () => {
    const newState = !favorite
    setFavorite(newState)
    localStorage.setItem(`favorite_hospital_${id}`, newState)
  }

  if (!hospital) return <div>로딩 중...</div>
  const bizHours = hospital.facilityBusinessHours || hospital.facility?.businessHours || [];

  return (
    <div className="bg-white">
      <Container className="py-4">
        {/* 경로 */}
        <Row>
          <Col>
            <div className="d-flex align-items-center gap-2 mb-3">
              <Link to="/" className="text-gray">HOME</Link>
              <span>{'>'}</span>
              <Link to="/" className="text-gray">병원찾기</Link>
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
              <span className={`favorite-icon ${favorite ? 'active' : ''}`} onClick={toggleFavorite}>
                {favorite ? <StarFill size={30}/> : <Star size={30}/>}
              </span>
            </h4>
            <div className="d-flex flex-wrap gap-3 mt-2">
              <span>{hasEmergency ? 
                <><HospitalFill className="text-danger me-2" />응급실 운영</> : 
                <><XCircleFill className="text-secondary me-2" />응급실 없음</>}</span>
              <span>{open ? 
                <><CheckCircleFill className="text-success me-2" />운영 중</> : 
                <><XCircleFill className="text-danger me-2" />운영종료</>}</span>
            </div>
          </Col>
        </Row>

        {/* 지도 + 정보 테이블 */}
        <Row className="mb-4">
          <Col md={6}>
            <div id="map" className="hospital-map"></div>
          </Col>
          <Col md={6}>
            <Table className="mt-3 mt-md-0 small hospital-table">
              <tbody>
                <tr><th className="w-25">주소</th><td>{hospital.facility?.address || "-"}</td></tr>
                <tr><th>대표전화</th><td>{hospital.facility?.phone || "-"}</td></tr>
                <tr><th>기관구분</th><td>{hospital.facility?.orgType || "병원"}</td></tr>
                <tr><th>소개</th><td>-</td></tr>
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
                  {bizHours.map((bh, idx) => (
                    <Col
                      key={idx}
                      xs={6}
                      md={6}
                      className={`mb-1 ${
                        bh.dayOfWeek &&
                        (bh.dayOfWeek.toUpperCase() === (["SUNDAY","MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY"][new Date().getDay()]))
                          ? "hospital-time-col active" : ""
                      }`}
                    >
                      <span className="fw-bold">{dayLabel[bh.dayOfWeek] || bh.dayOfWeek}</span>{" "}
                      {bh.open24h ? "24시간" : (bh.closed ? "휴무" : `${bh.openTime?.slice(0,5) ?? "--:--"}~${bh.closeTime?.slice(0,5) ?? "--:--"}`)}
                    </Col>
                  ))}
                </Row>
              </Card.Body>
            </Card>
          </Col>

          {/* 진료과목 */}
          <Col xs={12} md={6}>
            <Card className="shadow-sm border-0 h-100">
              <Card.Header className="hospital-card-header">진료과목</Card.Header>
              <Card.Body className="small text-secondary">
                <Row>
                  {(hospital.departments || []).map((d, idx) => (
                    <Col key={idx} xs={6} md={6} className="mb-1">{d.deptName}</Col>
                  ))}
                </Row>
              </Card.Body>
            </Card>
          </Col>

          {/* 의료자원 */}
          <Col xs={12} md={6}>
            <Card className="shadow-sm border-0 h-100">
              <Card.Header className="hospital-card-header">의료자원</Card.Header>
              <Card.Body className="small text-secondary">
                <Row>
                  {(hospital.institutions || []).map((i, idx) => (
                    <Col key={idx} xs={6} md={6} className="mb-1">{i.institutionName}</Col>
                  ))}
                </Row>
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
            <div className="hospital-remark">
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
  );
};

export default HospitalDetail;
