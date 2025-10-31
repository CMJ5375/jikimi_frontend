// src/page/facility/HospitalDetail.js
import React, { useEffect, useMemo, useState, useRef } from 'react';
import '../../App.css';
import "../../css/Hospital.css";
import { Container, Row, Col, Table, Card } from "react-bootstrap";
import { useParams, Link } from 'react-router-dom';
import { StarFill, Star, CheckCircleFill, XCircleFill, HospitalFill } from "react-bootstrap-icons";
import { DAY_KEYS, getTodayKey, getKoreanDayName, getHoursByDay, normalizeTokens } from "../../util/dayUtil";
import useFavorites from "../../hook/useFavorites";
import KakaoMapComponent from "../../component/common/KakaoMapComponent";
import publicAxios from "../../util/publicAxios";

// HIRA 실시간
import { getHospitals } from "../../api/hiraApi";
import { hiraItemToBusinessHours } from "../../util/hiraAdapter";

/* ── 오픈 계산(점심/노트 무시, 자정 넘김 고려) ── */
function toMinutesHHMM(v) {
  if (!v) return null;
  const m = String(v).match(/^(\d{1,2}):(\d{1,2})(?::\d{1,2})?$/);
  if (!m) return null;
  const hh = Number(m[1]), mm = Number(m[2]);
  if (Number.isNaN(hh) || Number.isNaN(mm)) return null;
  return hh * 60 + mm;
}
function computeOpenSimple(hoursList) {
  if (!Array.isArray(hoursList) || hoursList.length === 0) return false;
  const todayKey = getTodayKey();

  const candidates = hoursList.map((h) => {
    const raw = h?.days;
    if (!raw) return null;
    const daysArr = Array.isArray(raw)
      ? [...new Set(raw.flatMap((t) => normalizeTokens(t)))]
      : normalizeTokens(raw);
    if (!daysArr.includes(todayKey)) return null;
    if (h.closed) return null;

    const s = toMinutesHHMM(h.openTime);
    const e = toMinutesHHMM(h.closeTime);
    if (s == null || e == null) return null;
    return { s, e };
  }).filter(Boolean);

  if (candidates.length === 0) return false;

  const now = new Date();
  const cur = now.getHours() * 60 + now.getMinutes();
  return candidates.some(({ s, e }) => (e <= s ? (cur >= s || cur < e) : (cur >= s && cur < e)));
}

/* ── 공통 헬퍼 ── */
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
function cleanHours(arr) {
  return (arr || []).filter(r =>
    !r?.closed &&
    r?.openTime && r?.closeTime &&
    r.openTime !== "00:00" && r.closeTime !== "00:00"
  );
}
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
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
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

const HospitalDetail = () => {
  const { id } = useParams(); // hospitalId

  const [hospital, setHospital] = useState(null);
  const [open, setOpen] = useState(false);
  const [resources, setResources] = useState([]);     // ✅ 하나만 유지
  const [hoursResolved, setHoursResolved] = useState([]);
  const resolvingRef = useRef(false);

  const { favorites, toggle, isLogin } = useFavorites("HOSPITAL");
  const isFavorite = hospital && favorites.includes(String(id));

  /* 병원 상세 로드 */
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

  /* 시간 해석: HIRA → facility → hospital → 내장 */
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!hospital || resolvingRef.current) return;
      resolvingRef.current = true;
      try {
        // 1) HIRA (최우선)
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
            } catch { /* try next */ }
          }
          if (picked) {
            const h3 = cleanHours(hiraItemToBusinessHours(picked));
            if (h3.length) { if (alive) setHoursResolved(h3); return; }
          }
        }

        // 2) (백엔드) facility
        const facilityId = hospital?.facility?.facilityId ?? hospital?.facilityId ?? null;
        if (facilityId) {
          try {
            const r1 = await publicAxios.get(`/project/facility/${facilityId}/business-hours`);
            const h1 = cleanHours(Array.isArray(r1.data) ? r1.data : (r1.data?.businessHours ?? []));
            if (h1.length) { if (alive) setHoursResolved(h1); return; }
          } catch {}
        }

        // 3) (백엔드) hospital
        try {
          const r2 = await publicAxios.get(`/project/hospital/${id}/business-hours`);
          const h2 = cleanHours(Array.isArray(r2.data) ? r2.data : (r2.data?.businessHours ?? []));
          if (h2.length) { if (alive) setHoursResolved(h2); return; }
        } catch {}

        // 4) 내장(보험)
        const fromDetail = cleanHours(pickHours(hospital));
        if (fromDetail.length) { if (alive) setHoursResolved(fromDetail); return; }

        if (alive) setHoursResolved([]);
      } finally {
        resolvingRef.current = false;
      }
    })();
    return () => { alive = false; };
  }, [hospital, id]);

  /* 최종 시간 소스 */
  const hoursSource = useMemo(
    () => (Array.isArray(hoursResolved) ? hoursResolved : []),
    [hoursResolved]
  );

  /* 오픈 상태 계산 + 서버(true) 상향 */
  useEffect(() => {
    let alive = true;
    if (!hospital) return;

    const clientOpen = computeOpenSimple(hoursSource);
    if (alive) setOpen(clientOpen);

    const facilityId = hospital?.facility?.facilityId ?? hospital?.facilityId ?? null;
    (async () => {
      if (!facilityId) return;
      try {
        const r = await publicAxios.get(`/project/facility/${facilityId}/open`);
        if (alive && r?.data?.open === true && !clientOpen) setOpen(true);
      } catch {}
    })();

    return () => { alive = false; };
  }, [hospital, hoursSource]);


  const todayKey = getTodayKey();

  /* 진료과목 */
  const departmentsSrc = hospital?.departments ?? hospital?.departmentList ?? [];
  const departmentsList = useMemo(() => {
    return Array.isArray(departmentsSrc)
      ? departmentsSrc.map((d) => d?.deptName ?? d?.name ?? String(d))
      : (typeof departmentsSrc === 'string'
          ? departmentsSrc.split(',').map((s) => s.trim()).filter(Boolean)
          : []);
  }, [departmentsSrc]);

  /* 의료자원 */
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

  const resourcesList = useMemo(() => {
    const src = resources.length ? resources : (hospital?.institutions ?? hospital?.resources ?? []);
    return Array.isArray(src)
      ? src.map((r) => r?.institutionName ?? r?.name ?? String(r))
      : (typeof src === 'string' ? src.split(',').map((s) => s.trim()).filter(Boolean) : []);
  }, [resources, hospital]);

  return (
    <div className="bg-white">
      <Container className="py-4">
        {!hospital ? (
          <div>로딩 중...</div>
        ) : (
          <>
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

            <Row>
              <Col>
                <div className="hospital-notice mb-4">
                  진료시간이 변동될 수 있으므로 기관에 전화 확인 후 방문해 주시길 바랍니다.
                  (접수 마감 시간 확인 등)
                </div>
              </Col>
            </Row>

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

            <Row className="mb-4">
              <Col md={6}>
                {hospital?.facility?.latitude && hospital?.facility?.longitude && (
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

            <Row className="g-4 mb-4">
              <Col xs={12} md={6}>
                <Card className="shadow-sm border-0 h-100">
                  <Card.Header className="hospital-card-header">진료시간</Card.Header>
                  <Card.Body className="small text-secondary">
                    <Row>
                      {DAY_KEYS.map((dayKey, idx) => {
                        const row = getHoursByDay(dayKey, hoursSource);
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
                    <style>{`
                      .today { color: #2563eb; font-weight: 700; text-decoration: underline; }
                    `}</style>
                  </Card.Body>
                </Card>
              </Col>

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

              <Col xs={12} md={6}>
                <Card className="shadow-sm border-0 h-100">
                  <Card.Header className="hospital-card-header">실시간 병상정보</Card.Header>
                  <Card.Body className="small text-primary">
                    응급의료기관 외 기관으로 실시간 병상정보 제공 대상이 아닙니다.
                  </Card.Body>
                </Card>
              </Col>
            </Row>

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
