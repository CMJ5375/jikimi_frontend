import React, { useEffect, useMemo, useState } from "react";
import "../../App.css";
import "../../css/Pharmacy.css";
import { Container, Row, Col, Table, Card } from "react-bootstrap";
import { useParams, Link } from "react-router-dom";
import { StarFill, Star, CheckCircleFill, XCircleFill } from "react-bootstrap-icons";
import { openUtil } from "../../util/openUtil";
import { DAY_KEYS, getTodayKey, getKoreanDayName, getHoursByDay } from "../../util/dayUtil";
import useFavorites from "../../hook/useFavorites";
import KakaoMapComponent from "../../component/common/KakaoMapComponent";
import { pharmacyItemToBusinessHours } from "../../util/pharmacyAdapter";
import publicAxios from "../../util/publicAxios"; 

/* ========================= 유틸 ========================= */
function extractQ0Q1(address) {
  const s = String(address || "").trim();
  const m = s.match(/^([^ ]+?(도|시))\s+([^ ]+?(군|구|시))/);
  if (!m) return { q0: "", q1: "" };
  const q0 = m[1];
  const q1 = m[3].replace(/\s+/g, "");
  return { q0, q1 };
}

function parsePharmXmlToItems(xmlText) {
  try {
    const doc = new DOMParser().parseFromString(xmlText, "text/xml");
    let nodes = Array.from(doc.getElementsByTagName("item"));
    if (nodes.length === 0) nodes = Array.from(doc.getElementsByTagName("row"));
    if (nodes.length === 0) nodes = Array.from(doc.getElementsByTagName("ROW"));
    return nodes.map((el) => {
      const obj = {};
      Array.from(el.children).forEach((c) => {
        obj[c.tagName.toUpperCase()] = (c.textContent || "").trim();
      });
      return obj;
    });
  } catch {
    return [];
  }
}

function pickBestItem(list, name, address) {
  if (!Array.isArray(list) || list.length === 0) return null;
  const norm = (s) => String(s || "").replace(/\s+/g, "").toLowerCase();
  const nName = norm(name);
  const nAddr = norm(address);

  let best = null;
  let bestScore = -1;
  for (const it of list) {
    const sName = it.DUTYNAME ? (norm(it.DUTYNAME).includes(nName) ? 10 : 0) : 0;
    const sAddr = it.DUTYADDR ? (norm(it.DUTYADDR).includes(nAddr.slice(0, 12)) ? 5 : 0) : 0;
    const sc = sName + sAddr;
    if (sc > bestScore) {
      best = it;
      bestScore = sc;
    }
  }
  return best || list[0];
}

function isUsableHours(list) {
  if (!Array.isArray(list) || list.length === 0) return false;
  return list.some((r) => {
    const s = String(r?.openTime ?? "").trim();
    const c = String(r?.closeTime ?? "").trim();
    const has = s && s !== "00:00" && c && c !== "00:00";
    return !r?.closed && has;
  });
}

/* ========================= 메인 컴포넌트 ========================= */
const PharmacyDetail = () => {
  const { id } = useParams();
  const [pharmacy, setPharmacy] = useState(null);
  const [dbHours, setDbHours] = useState([]);      // /pharmacy/{id}/business-hours
  const [rtHours, setRtHours] = useState([]);      // 실시간 변환
  const [loadingRt, setLoadingRt] = useState(false);
  const [open, setOpen] = useState(false);

  const { favorites, toggle, isLogin } = useFavorites("PHARMACY");
  const isFavorite = pharmacy && favorites.includes(String(id));

  // 1) 약국 기본정보
  useEffect(() => {
    (async () => {
      try {
        const { data } = await publicAxios.get(`/project/pharmacy/${id}`, {
          withCredentials: false,
        });
        setPharmacy(data);
      } catch {
        setPharmacy(null);
      }
    })();
  }, [id]);

  // 2) DB 영업시간
  useEffect(() => {
    (async () => {
      try {
        const { data } = await publicAxios.get(`/project/pharmacy/${id}/business-hours`, {
          withCredentials: false,
        });
        setDbHours(Array.isArray(data) ? data : []);
      } catch {
        setDbHours([]);
      }
    })();
  }, [id]);

  // 3) hoursSource: DB → (상세/목록 내) facility.businessHours → rtHours
  const fallbackHoursFromDetail =
    pharmacy?.facilityBusinessHours ||
    pharmacy?.facilityBusinessHourList ||
    pharmacy?.facility?.businessHours ||
    [];

  const hoursSource = useMemo(() => {
    if (isUsableHours(dbHours)) return dbHours;
    if (isUsableHours(fallbackHoursFromDetail)) return fallbackHoursFromDetail;
    if (isUsableHours(rtHours)) return rtHours;
    return [];
  }, [dbHours, fallbackHoursFromDetail, rtHours]);

  // 4) DB/상세 모두 없으면 실시간 RAW 조회
  useEffect(() => {
    if (!pharmacy) return;
    if (isUsableHours(dbHours) || isUsableHours(fallbackHoursFromDetail)) {
      setRtHours([]);
      return;
    }

    const addr = pharmacy?.facility?.address || "";
    const name = pharmacy?.pharmacyName || "";
    const { q0, q1 } = extractQ0Q1(addr);
    if (!q0 || !q1) {
      setRtHours([]);
      return;
    }

    (async () => {
      try {
        setLoadingRt(true);
        const { data: text, status } = await publicAxios.get(
          `/project/realtime/pharm/pharmacies/raw`,
          {
            params: { q0, q1, page: 1, size: 50 },
            responseType: "text",
            transformResponse: [(d) => d],  // 파싱 금지
            validateStatus: () => true,     // 4xx/5xx도 throw 안 함
            withCredentials: false,
          }
        );
        if (status < 0) {
          setRtHours([]);
          return;
        }
        const items = parsePharmXmlToItems(text ?? "");
        const picked = pickBestItem(items, name, addr);
        const hours = picked ? pharmacyItemToBusinessHours(picked) : [];
        setRtHours(Array.isArray(hours) ? hours : []);
      } catch {
        setRtHours([]);
      } finally {
        setLoadingRt(false);
      }
    })();
  }, [pharmacy, dbHours, fallbackHoursFromDetail]);

  // 5) 최종 hoursSource로 열림/닫힘 상태 계산
  useEffect(() => {
    setOpen(openUtil(hoursSource || []));
  }, [hoursSource]);

  if (!pharmacy) return <div>로딩 중...</div>;

  const todayKey = getTodayKey();

  return (
    <div className="bg-white">
      <Container className="py-4">
        {/* 경로 */}
        <Row>
          <Col>
            <div className="d-flex align-items-center gap-2 mb-3">
              <Link to="/" className="text-route">HOME</Link>
              <span>{">"}</span>
              <Link to="/pharmacy" className="text-route">약국찾기</Link>
              <span>{">"}</span>
              <span className="breadcrumb-current">{pharmacy?.pharmacyName || "약국상세"}</span>
            </div>
          </Col>
        </Row>

        {/* 안내 문구 */}
        <Row>
          <Col>
            <div className="border border-0 p-3 text-center text-primary mb-4" style={{ background: "#DBEFFF", fontSize: "0.9rem" }}>
              약국 사정에 따라 운영시간이 불규칙할 수 있으니 반드시 전화로 사전 확인 후 방문해주시기 바랍니다.
            </div>
          </Col>
        </Row>

        {/* 약국명 + 상태 */}
        <Row className="align-items-center mb-3">
          <Col>
            <h4 className="fw-bold mb-2 d-flex align-items-center justify-content-between">
              <span>{pharmacy.pharmacyName}</span>
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
            {pharmacy?.facility?.latitude && pharmacy?.facility?.longitude && (
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
                  <td>{pharmacy?.facility?.address || "-"}</td>
                </tr>
                <tr>
                  <th>대표전화</th>
                  <td>{pharmacy?.facility?.phone || "-"}</td>
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

        {/* 운영시간 (DB → 상세보유 → 실시간 RAW) */}
        <Row className="mb-4">
          <Col xs={12}>
            <Card className="shadow-sm border-0 h-100">
              <Card.Header className="pharmacy-card-header">운영시간</Card.Header>
              <Card.Body className="small text-secondary">
                <PharmacyHoursBlock todayKey={todayKey} hours={hoursSource} loadingRt={loadingRt} />
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* 오늘 요일 강조 */}
        <style>{`.today { color: #2563eb; font-weight: 700; text-decoration: underline; }`}</style>

        {/* 비고 */}
        <Row>
          <Col>
            <div className="p-3 small border border-0 remark-box" style={{ background: "#DBEFFF", fontSize: "0.9rem", borderRadius: "8px" }}>
              <p className="mb-0">
                <strong>법정공휴일:</strong> 신정, 설, 삼일절, 어린이날, 석가탄신일, 현충일, 광복절, 추석, 개천절, 한글날, 크리스마스
              </p>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default PharmacyDetail;

/* ========================= 운영시간 표시 블록 ========================= */
function PharmacyHoursBlock({ todayKey, hours, loadingRt }) {
  if (loadingRt) return <div>불러오는 중…</div>;
  if (!Array.isArray(hours) || hours.length === 0) {
    return <div className="text-muted">운영시간 정보 없음</div>;
  }

  return (
    <Row>
      {DAY_KEYS.map((dayKey, idx) => {
        const row = getHoursByDay(dayKey, hours);
        const isToday = dayKey === todayKey;
        return (
          <Col key={idx} xs={6} className={`mb-2 ${isToday ? "today" : ""}`}>
            <div className="fw-bold">{getKoreanDayName(dayKey)}</div>
            <div className={row.status === "휴무" ? "text-danger" : "text-dark"}>{row.status}</div>
          </Col>
        );
      })}
    </Row>
  );
}
