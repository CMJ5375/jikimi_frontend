// src/page/pharmacy/PharmacyDetail.jsx
import React, { useEffect, useState, useMemo } from "react";
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

const PharmacyDetail = () => {
  const { id } = useParams();
  const [pharmacy, setPharmacy] = useState(null);
  const [businessHours, setBusinessHours] = useState([]);
  const [open, setOpen] = useState(false);
  const { favorites, toggle, isLogin } = useFavorites("PHARMACY");
  const isFavorite = pharmacy && favorites.includes(String(id));

  // 약국 기본정보
  useEffect(() => {
    const fetchPharmacy = async () => {
      try {
        const res = await fetch(`http://localhost:8080/project/pharmacy/${id}`);
        const data = await res.json();
        setPharmacy(data);
        setOpen(openUtil(data?.facilityBusinessHours || []));
      } catch (error) {
        console.error("[PharmacyDetail] 약국 정보를 불러오지 못했습니다:", error);
      }
    };
    fetchPharmacy();
  }, [id]);

  // DB 영업시간
  useEffect(() => {
    const fetchHours = async () => {
      try {
        const res = await fetch(`http://localhost:8080/project/pharmacy/${id}/business-hours`);
        const data = await res.json();
        setBusinessHours(Array.isArray(data) ? data : []);
        console.log("[PharmacyDetail] DB businessHours:", data);
      } catch (err) {
        console.error("[PharmacyDetail] 영업시간 로드 실패:", err);
      }
    };
    fetchHours();
  }, [id]);

  if (!pharmacy) return <div>로딩 중...</div>;

  const bizHours =
    pharmacy?.facilityBusinessHours ||
    pharmacy?.facilityBusinessHourList ||
    pharmacy?.facility?.businessHours ||
    businessHours ||
    [];

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

          {/* 운영시간 (DB → 없으면 실시간 RAW) */}
          <Row className="mb-4">
            <Col xs={12}>
              <Card className="shadow-sm border-0 h-100">
                <Card.Header className="pharmacy-card-header">운영시간</Card.Header>
                <Card.Body className="small text-secondary">
                  <PharmacyHoursBlock
                    name={pharmacy.pharmacyName}
                    facility={pharmacy.facility}
                    fallbackHours={bizHours}
                  />
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
                  {bizHours.find((bh) => bh?.note)?.note
                    ? bizHours.find((bh) => bh?.note).note.replace(/Lunch/gi, "점심시간")
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

export default PharmacyDetail;

/* =========================
   아래는 운영시간 전용 블록
   ========================= */

function PharmacyHoursBlock({ name, facility, fallbackHours }) {
  const [rtHours, setRtHours] = useState([]);  // 실시간 변환 결과
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const hasDb = Array.isArray(fallbackHours) && fallbackHours.length > 0;
  const todayKey = getTodayKey();

  // DB가 비어있을 때만 실시간 조회
  useEffect(() => {
    if (hasDb) {
      setRtHours([]);
      setErr("");
      return;
    }
    const addr = facility?.address || "";
    const { q0, q1 } = extractQ0Q1(addr);
    if (!q0 || !q1) {
      console.log("[PharmacyHoursBlock] Q0/Q1 추출 실패. addr=", addr);
      return;
    }

    (async () => {
      setLoading(true);
      setErr("");
      try {
        const url = `/project/realtime/pharm/pharmacies/raw?q0=${encodeURIComponent(q0)}&q1=${encodeURIComponent(q1)}&page=1&size=50`;
        const res = await fetch(url);
        const text = await res.text(); // RAW(XML or JSON-string)
        const items = parsePharmXmlToItems(text);
        console.log("[PharmacyHoursBlock] parsed items:", items?.length);
        const picked = pickBestItem(items, name, addr);
        console.log("[PharmacyHoursBlock] picked:", picked);
        const hours = picked ? pharmacyItemToBusinessHours(picked) : [];
        setRtHours(hours);
      } catch (e) {
        console.error("[PharmacyHoursBlock] RAW 조회/파싱 실패:", e);
        setErr("실시간 운영시간을 불러오지 못했습니다.");
        setRtHours([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [hasDb, facility, name]);

  const hoursSource = useMemo(
    () => (hasDb ? fallbackHours : rtHours),
    [hasDb, fallbackHours, rtHours]
  );

  if (loading) return <div>불러오는 중…</div>;
  if (err) return <div className="text-danger">{err}</div>;
  if (!Array.isArray(hoursSource) || hoursSource.length === 0) {
    return <div className="text-muted">운영시간 정보 없음</div>;
  }

  return (
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
            <div className="text-muted small">{row.note}</div>
          </Col>
        );
      })}
    </Row>
  );
}

/* ===== 유틸: 주소→Q0/Q1, RAW 파서, 매칭 ===== */

/** 주소에서 Q0=시/도, Q1=시군구(공백 제거) 추출 */
function extractQ0Q1(address) {
  const s = String(address || "").trim();
  // 예: "경기도 성남시 분당구 ..." 또는 "대전광역시 동구 ..."
  const m = s.match(/^([^ ]+?(도|시))\s+([^ ]+?(군|구|시))/);
  if (!m) return { q0: "", q1: "" };
  const q0 = m[1];                         // "경기도", "대전광역시"
  const q1 = m[3].replace(/\s+/g, "");     // "성남시분당구" / "동구" …
  return { q0, q1 };
}

/** 약국 RAW(XML or XML-String) → item 배열 (대문자 태그명) */
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
  } catch (e) {
    console.error("[parsePharmXmlToItems] XML 파싱 실패:", e);
    return [];
  }
}

/** 가장 그럴듯한 아이템 고르기 (이름/주소 간단 매칭) */
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
