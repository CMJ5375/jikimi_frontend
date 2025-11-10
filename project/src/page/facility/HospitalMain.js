// src/page/facility/HospitalMain.js
import { useMemo, useState, useEffect, useRef } from "react";
import "../../App.css";
import "../../css/Hospital.css";
import { Container, Row, Col, Card, Button, Form, Dropdown } from "react-bootstrap";
import { GeoAltFill, StarFill, Star, TelephoneFill, HospitalFill, CheckCircleFill, XCircleFill } from "react-bootstrap-icons";
import { useNavigate } from "react-router-dom";
import useFavorites from "../../hook/useFavorites";
import useFacilitySearch from "../../hook/useFacilitySearch";
import PageComponent from "../../component/common/PageComponent";
import useCustomLogin from "../../hook/useCustomLogin";
import jwtAxios from "../../util/jwtUtil";
import publicAxios from "../../util/publicAxios";
import { getDefaultPosition, getAddressFromBackend } from "../../api/kakaoMapApi";
import { getCurrentPosition } from "../../api/geolocationApi";
import { getTodayKey, normalizeTokens } from "../../util/dayUtil";

// HIRA 실시간
import { getHospitals } from "../../api/hiraApi";
import { hiraItemToBusinessHours } from "../../util/hiraAdapter";

const DEBUG_ID = null;

/* ======== 시간/영업 계산 유틸 ======== */
function toMinutesHHMM(v) {
  if (!v) return null;
  const s = String(v).trim();
  const m = s.match(/^(\d{1,2}):(\d{1,2})(?::\d{1,2})?$/);
  if (!m) return null;
  const hh = Number(m[1]), mm = Number(m[2]);
  if (Number.isNaN(hh) || Number.isNaN(mm)) return null;
  return hh * 60 + mm;
}
function dayIncludes(rec, dayKey) {
  const raw = rec?.days;
  if (!raw) return false;
  const arr = Array.isArray(raw) ? [...new Set(raw.flatMap((t)=>normalizeTokens(t)))] : normalizeTokens(raw);
  return Array.isArray(arr) && arr.includes(dayKey);
}
function isUsableRec(rec) {
  if (rec?.closed) return false;
  const s = toMinutesHHMM(rec?.openTime);
  const e = toMinutesHHMM(rec?.closeTime);
  if (s == null || e == null) return false;
  if (rec.openTime === "00:00" && rec.closeTime === "00:00") return false;
  return true;
}
function computeOpenSimple(hoursList) {
  if (!Array.isArray(hoursList) || hoursList.length === 0) return false;
  const today = getTodayKey();
  const candidates = hoursList.filter((r) => dayIncludes(r, today)).filter(isUsableRec);
  if (candidates.length === 0) return false;

  const now = new Date();
  const cur = now.getHours() * 60 + now.getMinutes();
  return candidates.some((rec) => {
    const s = toMinutesHHMM(rec.openTime);
    const e = toMinutesHHMM(rec.closeTime);
    if (s == null || e == null) return false;
    // 자정 넘김
    if (e <= s) return cur >= s || cur < e;
    return cur >= s && cur < e;
  });
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
function pickHours(obj) {
  return (
    obj?.facility?.businessHours ??
    obj?.businessHours ??
    obj?.hours ??
    []
  );
}

/* ======== HIRA 검색 보조 ======== */
function buildQParamsFromAddress(addr = "") {
  const parts = String(addr).trim().split(/\s+/);
  const q0 = parts[0] || "";     // 시/도
  const t1 = parts[1] || "";     // 시
  const t2 = parts[2] || "";     // 구/군/읍/면
  const t12NoSpace = (t1 + t2).trim();

  const candidatesQ1 = [];
  if (t12NoSpace) candidatesQ1.push(t12NoSpace);
  if (t1) candidatesQ1.push(t1);
  if (t2) candidatesQ1.push(t2);
  const first3 = parts.slice(1, 3).join("").trim();
  if (first3 && !candidatesQ1.includes(first3)) candidatesQ1.push(first3);

  const uniq = [...new Set(candidatesQ1.filter(Boolean))];
  return { q0, q1Candidates: uniq };
}
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
function pickBest(items = [], hospitalLike) {
  if (!items.length || !hospitalLike) return null;
  const targetName = String(hospitalLike.hospitalName || hospitalLike.name || "").replace(/\s+/g, "");
  const facLat = hospitalLike.facility?.latitude ?? hospitalLike.latitude;
  const facLng = hospitalLike.facility?.longitude ?? hospitalLike.longitude;

  const byName = items.find((it) =>
    String(it.dutyName || "").replace(/\s+/g, "").includes(targetName)
  );
  if (byName) return byName;

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
  return items[0];
}

/* ======== 공통 해상 로직: HIRA → facility → hospital → 내장 ======== */
async function resolveHoursForItem(it) {
  // 1) HIRA (최우선)
  try {
    const addr = it?.facility?.address || it?.address || "";
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
              hospitalName: it.hospitalName || it.name || "",
              facility: it.facility || { latitude: it.latitude, longitude: it.longitude },
            });
            if (picked) break;
          }
        } catch { /* try next */ }
      }
      const h3 = picked ? cleanHours(hiraItemToBusinessHours(picked)) : [];
      if (isUsableHours(h3)) return h3;
    }
  } catch { /* ignore */ }

  // 2) (백엔드) facility
  try {
    const facilityId = it?.facility?.facilityId || it?.facilityId;
    if (facilityId) {
      const r1 = await publicAxios.get(`/project/facility/${facilityId}/business-hours`);
      const h1 = cleanHours(Array.isArray(r1.data) ? r1.data : (r1?.data?.businessHours || []));
      if (isUsableHours(h1)) return h1;
    }
  } catch { /* ignore */ }

  // 3) (백엔드) hospital
  try {
    const id = it?.hospitalId || it?.id;
    if (id) {
      const r2 = await publicAxios.get(`/project/hospital/${id}/business-hours`);
      const h2 = cleanHours(Array.isArray(r2.data) ? r2.data : (r2?.data?.businessHours || []));
      if (isUsableHours(h2)) return h2;
    }
  } catch { /* ignore */ }

  // 4) 내장(보험)
  const h0 = cleanHours(pickHours(it));
  if (isUsableHours(h0)) return h0;

  return [];
}

const HospitalMain = () => {
  const [dept, setDept] = useState("");
  const [org, setOrg] = useState("");
  const [keyword, setKeyword] = useState("");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [favoriteResults, setFavoriteResults] = useState([]);
  const [pageData, setPageData] = useState({ current: 0, size: 10 });
  const [searched, setSearched] = useState(false);
  const [currentAddress, setCurrentAddress] = useState("위치 확인 중...");

  const { results, pageData: searchPageData, currentPos, search, setFilters, calculateDistance } =
    useFacilitySearch("hospital");
  const navigate = useNavigate();
  const { favorites, toggle, isLogin } = useFavorites("HOSPITAL");
  const { /* isLogin 내부 */ } = useCustomLogin();

  const [hoursMap, setHoursMap] = useState({});
  const [openMap, setOpenMap] = useState({});
  const requestingRef = useRef(new Set());

  const deptList = useMemo(
    () => ["소아청소년과", "응급의학과", "이비인후과", "산부인과", "정형외과", "내과", "안과", "외과"],
    []
  );
  const orgList = useMemo(
    () => ["상급종합병원", "정신병원", "종합병원", "치과의원", "한방병원", "보건소", "한의원", "병원", "의원"],
    []
  );

  /* 현재 위치 → 주소 */
  useEffect(() => {
    const fetchAddress = async () => {
      try {
        const pos = await getCurrentPosition();
        const address = await getAddressFromBackend(pos.lat, pos.lng);
        setCurrentAddress(address);
      } catch (e) {
        setCurrentAddress("(기본)경기도 성남시 중원구 광명로 4");
      }
    };
    fetchAddress();
  }, []);

  /* 즐겨찾기 모드: 카드 데이터 + 시간/오픈을 '동일 해상 로직'으로 즉시 계산 */
  useEffect(() => {
    const fetchFavorites = async () => {
      if (!isLogin || !showFavoritesOnly) return;
      try {
        const allData = await Promise.all(
          favorites.map(async (id) => {
            const res = await jwtAxios.get(`/project/hospital/${id}`);
            const item = res.data;

            if (currentPos?.lat && item?.facility?.latitude) {
              item.distance = calculateDistance(
                currentPos.lat,
                currentPos.lng,
                item.facility.latitude,
                item.facility.longitude
              );
            }

            // ★ 여기서 즉시 동일 해상 로직 적용 (플래시 방지)
            const hours = await resolveHoursForItem(item);
            const open = computeOpenSimple(hours);
            const itemId = item.hospitalId || item.id;

            setHoursMap((prev) => ({ ...prev, [itemId]: hours }));
            setOpenMap((prev) => ({ ...prev, [itemId]: open }));

            return item;
          })
        );
        setFavoriteResults(allData.filter(Boolean));
        setPageData((prev) => ({ ...prev, current: 0 }));
      } catch {
        setFavoriteResults([]);
      }
    };
    fetchFavorites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showFavoritesOnly, favorites, isLogin, currentPos, calculateDistance]);

  const handleSubmit = (e) => {
    e.preventDefault();
    search(e, 0, { keyword, org, dept });
    setSearched(true);
  };

  const handleToggleFavoritesOnly = () => {
    const next = !showFavoritesOnly;
    setShowFavoritesOnly(next);
    setFilters((prev) => ({ ...prev, onlyFavorites: next }));
  };

  const displayedResults = showFavoritesOnly
    ? favoriteResults.slice(pageData.current * pageData.size, (pageData.current + 1) * pageData.size)
    : results;

  const totalPages = showFavoritesOnly
    ? Math.ceil(favoriteResults.length / pageData.size)
    : (searchPageData?.pageNumList?.length || 1);

  const pagination = {
    current: (showFavoritesOnly ? pageData.current : searchPageData?.current || 0) + 1,
    pageNumList: Array.from({ length: totalPages }, (_, i) => i + 1),
    prev: (showFavoritesOnly ? pageData.current : searchPageData?.current || 0) > 0,
    next: (showFavoritesOnly ? pageData.current : searchPageData?.current || 0) < totalPages - 1,
  };

  const handlePageChange = (n) => {
    if (showFavoritesOnly) {
      setPageData((prev) => ({ ...prev, current: n }));
    } else {
      search(null, n, { keyword, org, dept });
    }
  };

 // DEBUG_ID 관련 상수/로그 전부 삭제해도 됩니다.

// 목록 카드별 시간/오픈 계산 (HIRA → facility → hospital → 내장)
useEffect(() => {
  if (!Array.isArray(displayedResults) || displayedResults.length === 0) return;

  let cancelled = false;

  (async () => {
    // 표시 중 카드들만 대상으로, 이미 계산된 항목/요청중 항목은 스킵
    const tasks = displayedResults.map(async (it) => {
      const id = it.hospitalId || it.id;
      if (!id) return null;
      if (requestingRef.current.has(id)) return null;         // 진행중
      if (openMap[id] !== undefined) return null;             // 이미 계산됨

      requestingRef.current.add(id);
      try {
        const hours = await resolveHoursForItem(it);
        const open = computeOpenSimple(hours);
        return [id, hours, open];
      } catch {
        return null;
      } finally {
        requestingRef.current.delete(id);
      }
    });

    const rows = (await Promise.all(tasks)).filter(Boolean);
    if (cancelled || rows.length === 0) return;

    // 배치로 한 번에 setState → 렌더 최소화
    setHoursMap((prev) => {
      const next = { ...prev };
      rows.forEach(([id, hours]) => { next[id] = hours; });
      return next;
    });
    setOpenMap((prev) => {
      const next = { ...prev };
      rows.forEach(([id, , open]) => { next[id] = open; });
      return next;
    });
  })();
  return () => { cancelled = true; };
}, [displayedResults]); 


  return (
    <div className="bg-white">
      <Container className="py-4">
         {/* 상단 안내 */}
        <Row className="g-3 mb-3 align-items-center">
          <Col xs={6}>
            <div className="d-flex align-items-center gap-2 text-secondary mb-2">
              <GeoAltFill size={15} />
              <small>{currentAddress}</small>
            </div>
            <h3 className="fw-bold lh-base mb-3 hospital-title">
              지금 나에게<br />딱 맞는 <span>병원</span>을 찾아보세요
            </h3>
          </Col>
          <Col xs={6} className="text-end">
            <img src="/image/map.png" alt="지도" className="img-fluid limited-img map-img" />
          </Col>
        </Row>

        {/* 병원 / 약국 선택 버튼 */}
        <Row className="g-3 mb-4">
          <Col xs={6}>
            <Card className="card-hospital-blue text-white" onClick={() => navigate("/")}>
              <Card.Body>
                <img src="/image/hospitalBed.png" alt="병원" className="img-fluid d-block mx-auto h-auto limited-img" />
                <div className="fw-semibold">병원</div>
              </Card.Body>
            </Card>
          </Col>
          <Col xs={6}>
            <Card className="card-hospital-gray text-dark" onClick={() => navigate("/pharmacy")}>
              <Card.Body>
                <img src="/image/pharmacy.png" alt="약국" className="img-fluid d-block mx-auto h-auto limited-img" />
                <div className="fw-semibold">약국</div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Form onSubmit={handleSubmit}>
          <Dropdown className="mb-3 dropdown-custom">
            <Dropdown.Toggle variant="light" className="text-dark d-flex justify-content-between align-items-center">
              <span className={dept ? "" : "text-secondary"}>{dept || "진료과목"}</span>
              <i className="bi bi-chevron-down"></i>
            </Dropdown.Toggle>
            <Dropdown.Menu>
              {deptList.map((d) => (
                <Dropdown.Item key={d} onClick={() => setDept(d)}>{d}</Dropdown.Item>
              ))}
              <Dropdown.Divider />
              <Dropdown.Item onClick={() => setDept("")}>선택 해제</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>

          <Dropdown className="mb-3 dropdown-custom">
            <Dropdown.Toggle variant="light" className="text-dark d-flex justify-content-between align-items-center">
              <span className={org ? "" : "text-secondary"}>{org || "의료기관"}</span>
              <i className="bi bi-chevron-down"></i>
            </Dropdown.Toggle>
            <Dropdown.Menu>
              {orgList.map((o) => (
                <Dropdown.Item key={o} onClick={() => setOrg(o)}>{o}</Dropdown.Item>
              ))}
              <Dropdown.Divider />
              <Dropdown.Item onClick={() => setOrg("")}>선택 해제</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>

          <Form.Control
            type="text"
            placeholder="병원 이름을 입력하세요."
            className="search-input mb-3"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          <Button type="submit" className="btn-search w-100">내 주변 병원 검색</Button>
        </Form>

        {searched && (
          <>
            <hr className="hr-line my-3" />
            {isLogin && (
              <div className="d-flex justify-content-start align-items-center mt-4 mb-2">
              <Button
                variant="light"
                onClick={handleToggleFavoritesOnly}
                className="border-0 d-flex align-items-center gap-2"
              >
                {showFavoritesOnly ? <StarFill color="#FFD43B" size={20} /> : <Star color="#aaa" size={20} />}
                <span className="small">{showFavoritesOnly ? "즐겨찾기만 보기" : "전체 보기"}</span>
              </Button>
            </div>
            )}
          </>
        )}

        {displayedResults.length > 0 ? (
          <>
            <div className="mt-4">
              {displayedResults.map((item) => {
                const id = item.hospitalId || item.id;
                const isOpen =
                  openMap[id] !== undefined
                    ? openMap[id]
                    : computeOpenSimple(pickHours(item));

                return (
                  <Card
                    key={id}
                    className="result-card mb-3"
                    onClick={() => navigate(`/hospitaldetail/${id}`)}
                  >
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="text-gray">{item.orgType || item.facility?.orgType || "의료기관"}</span>
                        {isLogin && (
                          <span
                            className="favorite-icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggle(id);
                            }}
                          >
                            {favorites.includes(String(id)) ? (
                              <StarFill size={30} color="#FFD43B" />
                            ) : (
                              <Star size={30} />
                            )}
                          </span>
                        )}
                      </div>
                      <h5 className="fw-bold mb-2">
                        {item.hospitalName || item.name}
                        <span className="result-distance">({item.distance || "거리정보 없음"})</span>
                      </h5>
                      <div className="my-3 d-flex align-items-center">
                        <span className="badge-road">도로명</span>
                        <span className="text-gray">{item.facility?.address || item.address || "주소 정보 없음"}</span>
                      </div>
                      <div className="d-flex align-items-center justify-content-between">
                        <div className="text-gray d-flex align-items-center gap-2">
                          <TelephoneFill className="me-1" /> {item.facility?.phone || item.phone || "전화 정보 없음"}
                        </div>
                        <div className="d-flex align-items-center gap-3">
                          {item.hasEmergency && (
                            <div className="d-flex align-items-center text-danger small fw-semibold">
                              <HospitalFill size={18} className="me-1" />
                              응급실 운영
                            </div>
                          )}

                          <div className={`small fw-semibold ${isOpen ? "text-success" : "text-secondary"}`}>
                            {isOpen ? (
                              <>
                                <CheckCircleFill size={18} /> 운영 중
                              </>
                            ) : (
                              <>
                                <XCircleFill size={18} /> 운영 종료
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                );
              })}
            </div>
            <PageComponent pageData={pagination} onPageChange={handlePageChange} />
          </>
        ) : (
          showFavoritesOnly && (
            <div className="text-center text-secondary mt-4">
              즐겨찾기한 병원이 없습니다.
            </div>
          )
        )}

        {results.length === 0 && keyword && (
          <div className="text-center text-secondary mt-4">
            검색 결과가 없습니다.
          </div>
        )}
      </Container>
    </div>
  );
};

export default HospitalMain;
