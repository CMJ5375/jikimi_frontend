// src/page/facility/HospitalDetail.js
import React, { useEffect, useMemo, useState, useRef } from 'react';
import '../../App.css';
import "../../css/Hospital.css";
import { Container, Row, Col, Table, Card } from "react-bootstrap";
import { useParams, Link } from 'react-router-dom';
import { StarFill, Star, CheckCircleFill, XCircleFill, HospitalFill } from "react-bootstrap-icons";
import { openUtil } from "../../util/openUtil";
import { DAY_KEYS, getTodayKey, getKoreanDayName, getHoursByDay } from "../../util/dayUtil";
import useFavorites from "../../hook/useFavorites";
import KakaoMapComponent from "../../component/common/KakaoMapComponent";
import publicAxios from "../../util/publicAxios";

// HIRA 실시간 보충 (Main과 동일 유틸)
import { getHospitals } from "../../api/hiraApi";
import { hiraItemToBusinessHours } from "../../util/hiraAdapter";

/* =============== Helpers (Main과 동일) =============== */
function pickHours(obj) {
  return (
    obj?.facility?.businessHours ??
    obj?.businessHours ??
    obj?.hours ??
    []
  );
}
function isUsableHours(list) {
  if (!Array.isArray(list) || list.length === 0) return false;
  return list.some((r) => {
    const s = String(r?.openTime ?? "").trim();
    const c = String(r?.closeTime ?? "").trim();
    const has = (s && s !== "00:00") && (c && c !== "00:00");
    return !r?.closed && has;
  });
}
// 주소 → HIRA q0/q1 후보
function buildQParamsFromAddress(addr = "") {
  const parts = String(addr).trim().split(/\s+/);
  const q0 = parts[0] || "";
  const t1 = parts[1] || "";
  const t2 = parts[2] || "";
  const t12NoSpace = (t1 + t2).trim();
  const candidates = [];
  if (t12NoSpace) candidates.push(t12NoSpace);
  if (t1) candidates.push(t1);
  if (t2) candidates.push(t2);
  const first3 = parts.slice(1,3).join("").trim();
  if (first3 && !candidates.includes(first3)) candidates.push(first3);
  return { q0, q1Candidates: [...new Set(candidates.filter(Boolean))] };
}
// 거리
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
// HIRA 매칭
function pickBest(items = [], hospitalLike) {
  if (!items.length || !hospitalLike) return null;
  const targetName = String(hospitalLike.hospitalName || hospitalLike.name || "").replace(/\s+/g, "");
  const facLat = hospitalLike.facility?.latitude ?? hospitalLike.latitude;
  const facLng = hospitalLike.facility?.longitude ?? hospitalLike.longitude;
  const byName = items.find((it) => String(it.dutyName || "").replace(/\s+/g, "").includes(targetName));
  if (byName) return byName;
  if (facLat && facLng) {
    let best = null, bestDist = Infinity;
    for (const it of items) {
      const lat = Number(it.wgs84Lat), lng = Number(it.wgs84Lon);
      if (!lat || !lng) continue;
      const d = haversine(facLat, facLng, lat, lng);
      if (d < bestDist) { bestDist = d; best = it; }
    }
    if (best && bestDist <= 500) return best;
  }
  return items[0];
}
/* ====================================== */

const HospitalDetail = () => {
  const { id } = useParams(); // hospitalId

  const [hospital, setHospital] = useState(null);
  const [open, setOpen] = useState(false);
  const [businessHours, setBusinessHours] = useState([]);
  const [resources, setResources] = useState([]);
  const [hoursResolved, setHoursResolved] = useState([]); // 최종 hours 캐시(오픈 계산용)
  const resolvingRef = useRef(false); // 중복 방지

  const { favorites, toggle, isLogin } = useFavorites("HOSPITAL");
  const isFavorite = hospital && favorites.includes(String(id));

  // 병원 본문 (공개 호출)
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await publicAxios.get(`/project/hospital/${id}`);
        if (alive) setHospital(res.data);
      } catch {
        if (alive) setHospital(null);
      }
    })();
    return () => { alive = false; };
  }, [id]);

  // 진료시간: facility → hospital → HIRA (Main과 동일한 우선순위)
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!hospital || resolvingRef.current) { if (alive) setBusinessHours([]); return; }
      resolvingRef.current = true;

      try {
        const fromDetail = pickHours(hospital);
        if (isUsableHours(fromDetail)) {
          if (alive) { setBusinessHours(fromDetail); setHoursResolved(fromDetail); }
          return;
        }

        const facilityId = hospital?.facility?.facilityId ?? hospital?.facilityId ?? null;

        // a) facility 기준 공개 호출
        if (facilityId) {
          try {
            const r1 = await publicAxios.get(`/project/facility/${facilityId}/business-hours`);
            const h1 = Array.isArray(r1.data) ? r1.data : (r1.data?.businessHours ?? []);
            if (isUsableHours(h1)) {
              if (alive) { setBusinessHours(h1); setHoursResolved(h1); }
              return;
            }
          } catch {}
        }

        // b) hospital 기준 공개 호출
        try {
          const r2 = await publicAxios.get(`/project/hospital/${id}/business-hours`);
          const h2 = Array.isArray(r2.data) ? r2.data : (r2.data?.businessHours ?? []);
          if (isUsableHours(h2)) {
            if (alive) { setBusinessHours(h2); setHoursResolved(h2); }
            return;
          }
        } catch {}

        // c) HIRA 보충
        const addr = hospital?.facility?.address || hospital?.address || "";
        const { q0, q1Candidates } = buildQParamsFromAddress(addr);
        if (q0 && q1Candidates.length > 0) {
          let picked = null;
          for (const q1 of q1Candidates) {
            try {
              const json = await getHospitals({ q0, q1, page: 1, size: 50 });
              const raw = json?.response?.body?.items?.item;
              const list = Array.isArray(raw) ? raw : raw ? [raw] : [];
              if (list.length > 0) {
                picked = pickBest(list, {
                  hospitalName: hospital.hospitalName || hospital.name || "",
                  facility: hospital.facility || { latitude: hospital.latitude, longitude: hospital.longitude },
                });
                if (picked) break;
              }
            } catch {}
          }
          const h3 = picked ? hiraItemToBusinessHours(picked) : [];
          if (isUsableHours(h3)) {
            if (alive) { setBusinessHours(h3); setHoursResolved(h3); }
            return;
          }
        }

        // 다 실패하면 빈배열
        if (alive) { setBusinessHours([]); setHoursResolved([]); }
      } finally {
        resolvingRef.current = false;
      }
    })();
    return () => { alive = false; };
  }, [hospital, id]);

  // 의료자원 (공개 호출)
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await publicAxios.get(`/project/hospital/${id}/institutions`);
        const list = Array.isArray(res.data) ? res.data : [];
        if (alive) setResources(list);
      } catch {
        if (alive) setResources([]);
      }
    })();
    return () => { alive = false; };
  }, [id]);

  // 최종 시간 소스: 위에서 해결된 hoursResolved → 없으면 hospital 내장값
  const hoursSource = useMemo(() => {
    if (isUsableHours(hoursResolved)) return hoursResolved;
    const fromHospital = pickHours(hospital || {});
    if (isUsableHours(fromHospital)) return fromHospital;
    return [];
  }, [hoursResolved, hospital]);

  // 오픈 상태: 서버(/facility/{fid}/open) 우선 → 실패 시 openUtil(hoursSource)
  useEffect(() => {
    let alive = true;
    if (!hospital) return;

    const facilityId = hospital?.facility?.facilityId ?? hospital?.facilityId ?? null;

    const tryServer = async () => {
      if (!facilityId) return false;
      try {
        const r = await publicAxios.get(`/project/facility/${facilityId}/open`);
        const data = r?.data || {};
        if (typeof data.open === "boolean") {
          if (alive) setOpen(data.open);
          return true;
        }
      } catch {}
      return false;
    };

    const fallbackClient = () => {
      if (alive) setOpen(openUtil(hoursSource));
    };

    (async () => {
      const ok = await tryServer();
      if (!ok) fallbackClient();
    })();

    return () => { alive = false; };
  }, [hospital, hoursSource]);

  const todayKey = getTodayKey();

  // 파생 데이터
  const departmentsSrc = hospital?.departments ?? hospital?.departmentList ?? [];
  const departmentsList = useMemo(() => {
    return Array.isArray(departmentsSrc)
      ? departmentsSrc.map((d) => d?.deptName ?? d?.name ?? String(d))
      : (typeof departmentsSrc === 'string'
          ? departmentsSrc.split(',').map(s => s.trim()).filter(Boolean)
          : []);
  }, [departmentsSrc]);

  const resourcesSrc = (resources && resources.length ? resources : (hospital?.institutions ?? hospital?.resources ?? []));
  const resourcesList = useMemo(() => {
    return Array.isArray(resourcesSrc)
      ? resourcesSrc.map((r) => r?.institutionName ?? r?.name ?? String(r))
      : (typeof resourcesSrc === 'string'
          ? resourcesSrc.split(',').map(s => s.trim()).filter(Boolean)
          : []);
  }, [resourcesSrc]);

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
                  <span>
                    {hospital.hasEmergency
                      ? <><HospitalFill className="text-danger me-2" />응급실 운영</>
                      : <><XCircleFill className="text-secondary me-2" />응급실 없음</>}
                  </span>
                  <span>
                    {open
                      ? <><CheckCircleFill className="text-success me-2" />운영 중</>
                      : <><XCircleFill className="text-secondary me-2" />운영종료</>}
                  </span>
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
                        const row = getHoursByDay(dayKey, hoursSource);
                        const isToday = dayKey === getTodayKey();
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
                    <style>{`
                      .today { color: #2563eb; font-weight: 700; text-decoration: underline; }
                    `}</style>
                  </Card.Body>
                </Card>
              </Col>

              {/* 진료과목 */}
              <Col xs={12} md={6}>
                <Card className="shadow-sm border-0 h-100">
                  <Card.Header className="hospital-card-header">진료과목</Card.Header>
                  <Card.Body className="small text-secondary">
                    {Array.isArray(departmentsList) && departmentsList.length > 0 ? (
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
                    {Array.isArray(resourcesList) && resourcesList.length > 0 ? (
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
                  className="p-3 small border-0 remark-box"
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
