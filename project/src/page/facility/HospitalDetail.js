// src/page/facility/HospitalDetail.js
import React, { useEffect, useMemo, useState } from 'react';
import '../../App.css';
import "../../css/Hospital.css";
import { Container, Row, Col, Table, Card } from "react-bootstrap";
import { useParams, Link } from 'react-router-dom';
import { StarFill, Star, CheckCircleFill, XCircleFill, HospitalFill } from "react-bootstrap-icons";
import { openUtil } from "../../util/openUtil";
import { DAY_KEYS, getTodayKey, getKoreanDayName, getHoursByDay } from "../../util/dayUtil";
import useFavorites from "../../hook/useFavorites";
import KakaoMapComponent from "../../component/common/KakaoMapComponent";
import { getHospitals } from "../../api/hiraApi";
import { hiraItemToBusinessHours } from "../../util/hiraAdapter";

/* ================= 유틸 (컴포넌트 바깥) ================ */
// 주소 → Q0/Q1 후보들 만들기 (HIRA는 Q1을 공백 없이 기대하는 경우가 많음)
function buildQParamsFromAddress(addr = "") {
  const parts = String(addr).trim().split(/\s+/);
  const q0 = parts[0] || ""; // 시/도
  const t1 = parts[1] || ""; // 시
  const t2 = parts[2] || ""; // 구/군/읍/면
  const t12NoSpace = (t1 + t2).trim(); // "성남시분당구"

  const candidatesQ1 = [];
  // 1) "성남시분당구"
  if (t12NoSpace) candidatesQ1.push(t12NoSpace);
  // 2) "성남시"
  if (t1) candidatesQ1.push(t1);
  // 3) "분당구"
  if (t2) candidatesQ1.push(t2);
  // 4) 공백 제거 풀주소에서 시군구까지만 추정 (보정용)
  const first3 = parts.slice(1, 3).join("").trim();
  if (first3 && !candidatesQ1.includes(first3)) candidatesQ1.push(first3);

  // 중복 제거
  const uniq = [...new Set(candidatesQ1.filter(Boolean))];
  return { q0, q1Candidates: uniq };
}

// 간단 거리(m)
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// HIRA 응답에서 우리 병원과 가장 잘 맞는 한 건 고르기
function pickBest(items = [], hospital) {
  if (!items.length || !hospital) return null;
  const targetName = String(hospital.hospitalName || "").replace(/\s+/g, "");
  const facLat = hospital.facility?.latitude;
  const facLng = hospital.facility?.longitude;

  // 1) 이름 유사
  const byName = items.find((it) =>
    String(it.dutyName || "").replace(/\s+/g, "").includes(targetName)
  );
  if (byName) return byName;

  // 2) 좌표 근접 (<= 500m)
  if (facLat && facLng) {
    let best = null;
    let bestDist = Infinity;
    for (const it of items) {
      const lat = Number(it.wgs84Lat);
      const lng = Number(it.wgs84Lon);
      if (!lat || !lng) continue;
      const d = haversine(facLat, facLng, lat, lng);
      if (d < bestDist) {
        bestDist = d;
        best = it;
      }
    }
    if (best && bestDist <= 500) return best;
  }

  // 3) fallback
  return items[0];
}

// DB 시간이 "실제로 쓸 수 있는지" 판정
function isUsableHours(list) {
  if (!Array.isArray(list) || list.length === 0) return false;
  return list.some((r) => {
    const s = String(r?.openTime ?? "").trim();
    const c = String(r?.closeTime ?? "").trim();
    const has = (s && s !== "00:00") && (c && c !== "00:00");
    return !r?.closed && has;
  });
}
/* ======================================================= */

const HospitalDetail = () => {
  const { id } = useParams();

  // 상태
  const [hospital, setHospital] = useState(null);
  const [open, setOpen] = useState(false);
  const [businessHours, setBusinessHours] = useState([]);
  const [resources, setResources] = useState([]);
  const [rtBizHours, setRtBizHours] = useState([]); // HIRA 실시간 보충 시간

  const { favorites, toggle, isLogin } = useFavorites("HOSPITAL");
  const isFavorite = hospital && favorites.includes(String(id));

  // 병원 본문
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`http://localhost:8080/project/hospital/${id}`);
        const data = await res.json();
        console.log("[HospitalDetail] hospital:", data);
        setHospital(data);
      } catch (error) {
        console.error("병원 정보를 불러오지 못했습니다:", error);
      }
    })();
  }, [id]);

  // 진료시간(DB)
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`http://localhost:8080/project/hospital/${id}/business-hours`);
        const data = await res.json();
        console.log("[HospitalDetail] DB businessHours:", data);
        setBusinessHours(data);
      } catch (err) {
        console.error("진료시간 로드 실패:", err);
      }
    })();
  }, [id]);

  // 의료자원
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`http://localhost:8080/project/hospital/${id}/institutions`);
        if (!res.ok) throw new Error('institutions fetch failed');
        const list = await res.json();
        console.log("[HospitalDetail] institutions:", list);
        setResources(Array.isArray(list) ? list : []);
      } catch (error) {
        console.error("의료자원 정보를 불러오지 못했습니다:", error);
        setResources([]);
      }
    })();
  }, [id]);

  // 병원 + DB시간 → bizHours 유추
  const bizHours = useMemo(() => {
    if (!hospital) return businessHours;
    const inferred =
      hospital.facilityBusinessHours ||
      hospital.facilityBusinessHourList ||
      hospital.facility?.businessHours ||
      hospital.facility?.businessHourList ||
      businessHours;
    console.log("[HospitalDetail] inferred bizHours(from hospital/DB):", inferred);
    return inferred;
  }, [hospital, businessHours]);

  // === 핵심: DB가 쓸모없으면 HIRA로 보충(여러 Q1 후보 순차 시도) ===
  useEffect(() => {
    if (!hospital) return;

    const dbUsable = isUsableHours(bizHours);
    console.log("[HospitalDetail] DB hours usable?", dbUsable, bizHours);

    if (dbUsable) {
      setRtBizHours([]); // DB가 정상이라면 보충 불필요
      return;
    }

    const addr = hospital.facility?.address || "";
    const { q0, q1Candidates } = buildQParamsFromAddress(addr);
    console.log("[HospitalDetail] HIRA query attempt start — Q0:", q0, "Q1 candidates:", q1Candidates);

    if (!q0 || q1Candidates.length === 0) return;

    (async () => {
      let picked = null;
      let lastList = [];
      for (const q1 of q1Candidates) {
        try {
          console.log(`[HospitalDetail] try HIRA with q1="${q1}"`);
          const json = await getHospitals({ q0, q1, page: 1, size: 50 });
          const raw = json?.response?.body?.items?.item;
          const list = Array.isArray(raw) ? raw : raw ? [raw] : [];
          console.log(`[HospitalDetail] HIRA list size with "${q1}":`, list.length, list);

          if (list.length > 0) {
            lastList = list;
            picked = pickBest(list, hospital);
            if (picked) {
              console.log("[HospitalDetail] picked HIRA item:", picked);
              break; // 성공
            }
          }
        } catch (e) {
          console.warn(`[HospitalDetail] HIRA attempt failed for q1="${q1}":`, e);
        }
      }

      const rt = picked ? hiraItemToBusinessHours(picked) : [];
      console.log("[HospitalDetail] rtBizHours(from HIRA fallback):", rt);
      setRtBizHours(rt);
    })();
  }, [hospital, bizHours]);

  // 최종 시간 소스(표시/계산 통일)
  const hoursSource = useMemo(() => {
    const dbUsable = isUsableHours(bizHours);
    const chosen = dbUsable ? bizHours : rtBizHours;
    console.log("[HospitalDetail] hoursSource chosen:", dbUsable ? "DB" : "HIRA", chosen);
    return chosen;
  }, [bizHours, rtBizHours]);

  // 운영중 배지 계산도 동일 소스 기준
  useEffect(() => {
    if (!Array.isArray(hoursSource)) return;
    const isOpen = openUtil(hoursSource);
    console.log("[HospitalDetail] openUtil(hoursSource):", isOpen, hoursSource);
    setOpen(isOpen);
  }, [hoursSource]);

  const todayKey = getTodayKey();

  // 파생 데이터
  const departmentsSrc = hospital?.departments ?? hospital?.departmentList ?? [];
  const departmentsList = useMemo(() => {
    const list = Array.isArray(departmentsSrc)
      ? departmentsSrc.map((d) => d?.deptName ?? d?.name ?? String(d))
      : (typeof departmentsSrc === 'string'
          ? departmentsSrc.split(',').map(s => s.trim()).filter(Boolean)
          : []);
    console.log("[HospitalDetail] departmentsList:", list);
    return list;
  }, [departmentsSrc]);

  const resourcesSrc = (resources && resources.length ? resources : (hospital?.institutions ?? hospital?.resources ?? []));
  const resourcesList = useMemo(() => {
    const list = Array.isArray(resourcesSrc)
      ? resourcesSrc.map((r) => r?.institutionName ?? r?.name ?? String(r))
      : (typeof resourcesSrc === 'string'
          ? resourcesSrc.split(',').map(s => s.trim()).filter(Boolean)
          : []);
    console.log("[HospitalDetail] resourcesList:", list);
    return list;
  }, [resourcesSrc]);

  // 렌더
  return (
    <div className="bg-white">
      <Container className="py-4">
        {!hospital ? (
          <div>로딩 중...</div>
        ) : (
          <>
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
                  {isLogin && (
                    <span className="favorite-icon" onClick={() => toggle(id)}>
                      {isFavorite ? <StarFill size={30} color="#FFD43B" /> : <Star size={30} />}
                    </span>
                  )}
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
                {hospital.facility?.latitude && hospital.facility?.longitude && (
                  <KakaoMapComponent
                    id={`hospital-map-${id}`}
                    lat={hospital.facility.latitude}
                    lng={hospital.facility.longitude}
                    name={hospital.hospitalName}
                    height={300}
                    showCenterMarker={false}
                  />
                )}
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
                          const row = getHoursByDay(dayKey, hoursSource); // ← hoursSource 사용
                          const isToday = dayKey === todayKey;
                          return (
                            <Col key={idx} xs={6} className={`mb-2 ${isToday ? "today" : ""}`}>
                              <div className="fw-bold">{getKoreanDayName(dayKey)}</div>
                              <div className={row.status === "휴무" ? "text-danger" : "text-dark"}>
                                {row.status}
                              </div>
                            </Col>
                          );
                        })}
                      </Row>

                      {/* 오늘 요일 강조 */}
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
                  
                  <p className="mb-0">
                    <strong>법정공휴일:</strong>{" "}
                    신정, 설, 삼일절, 어린이날, 석가탄신일, 현충일, 광복절, 추석, 개천절, 한글날, 크리스마스
                  </p>
                </div>
              </Col>
            </Row>
          </>
        )}
      </Container>
    </div>
  );
};

export default HospitalDetail;
