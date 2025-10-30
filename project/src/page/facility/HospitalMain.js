// src/page/facility/HospitalMain.js
import { useMemo, useState, useEffect, useRef } from "react";
import "../../App.css";
import "../../css/Hospital.css";
import { Container, Row, Col, Card, Button, Form, Dropdown } from "react-bootstrap";
import { GeoAltFill, StarFill, Star, TelephoneFill, HospitalFill, CheckCircleFill, XCircleFill } from "react-bootstrap-icons";
import { useNavigate } from "react-router-dom";

import { openUtil } from "../../util/openUtil";
import useFavorites from "../../hook/useFavorites";
import useFacilitySearch from "../../hook/useFacilitySearch";
import PageComponent from "../../component/common/PageComponent";
import useCustomLogin from "../../hook/useCustomLogin";
import jwtAxios from "../../util/jwtUtil";
import { getDefaultPosition, getAddressFromBackend } from "../../api/kakaoMapApi";

// ▼ HIRA 실시간 보충(네가 준 코드 그대로 사용)
import { getHospitals } from "../../api/hiraApi";
import { hiraItemToBusinessHours } from "../../util/hiraAdapter";

/* ===================== Helper (컴포넌트 바깥) ===================== */

// 주소 → HIRA q0/q1 후보 만들기 (Detail에서 쓰던 로직을 그대로 이식)
function buildQParamsFromAddress(addr = "") {
  const parts = String(addr).trim().split(/\s+/);
  const q0 = parts[0] || ""; // 시/도
  const t1 = parts[1] || ""; // 시
  const t2 = parts[2] || ""; // 구/군/읍/면
  const t12NoSpace = (t1 + t2).trim(); // "성남시분당구"

  const candidatesQ1 = [];
  if (t12NoSpace) candidatesQ1.push(t12NoSpace);
  if (t1) candidatesQ1.push(t1);
  if (t2) candidatesQ1.push(t2);
  const first3 = parts.slice(1, 3).join("").trim();
  if (first3 && !candidatesQ1.includes(first3)) candidatesQ1.push(first3);

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

// HIRA 응답에서 우리 병원과 가장 잘 맞는 한 건 고르기 (Detail과 동일)
function pickBest(items = [], hospitalLike) {
  if (!items.length || !hospitalLike) return null;
  const targetName = String(hospitalLike.hospitalName || hospitalLike.name || "").replace(/\s+/g, "");
  const facLat = hospitalLike.facility?.latitude ?? hospitalLike.latitude;
  const facLng = hospitalLike.facility?.longitude ?? hospitalLike.longitude;

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

// DB 시간이 "쓸 수 있는지" 판정 (Detail과 동일)
function isUsableHours(list) {
  if (!Array.isArray(list) || list.length === 0) return false;
  return list.some((r) => {
    const s = String(r?.openTime ?? "").trim();
    const c = String(r?.closeTime ?? "").trim();
    const has = (s && s !== "00:00") && (c && c !== "00:00");
    return !r?.closed && has;
  });
}

// 아이템에서 영업시간 배열 추출 (우선순위: facility.businessHours → businessHours → hours)
function pickHours(obj) {
  return (
    obj?.facility?.businessHours ??
    obj?.businessHours ??
    obj?.hours ??
    []
  );
}

/* ================================================================= */

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
  const { /* isLogin: 훅 내부에서 사용 중 */ } = useCustomLogin();

  // ▼ 오픈 상태/시간 캐시
  const [hoursMap, setHoursMap] = useState({}); // { [id]: hours[] } (DB/HIRA 최종)
  const [openMap, setOpenMap] = useState({});   // { [id]: boolean }
  const requestingRef = useRef(new Set());      // 동시 중복 호출 방지용

  // 드롭다운 진료과목/기관종류
  const deptList = useMemo(
    () => ["소아청소년과", "응급의학과", "이비인후과", "산부인과", "정형외과", "내과", "안과", "외과"],
    []
  );
  const orgList = useMemo(
    () => ["상급종합병원", "정신병원", "종합병원", "치과의원", "한방병원", "보건소", "한의원", "병원", "의원"],
    []
  );

  // 현재 주소(기본 위치 → 역지오)
  useEffect(() => {
    const fetchAddress = async () => {
      try {
        const pos = await getDefaultPosition();
        const address = await getAddressFromBackend(pos.lat, pos.lng);
        setCurrentAddress(address);
      } catch (e) {
        console.error("주소 불러오기 실패:", e);
        setCurrentAddress("(기본)경기도 성남시 중원구 광명로 4");
      }
    };
    fetchAddress();
  }, []);

  // 즐겨찾기 목록(표시 전용 데이터 로드)
  useEffect(() => {
    const fetchFavorites = async () => {
      if (!isLogin || !showFavoritesOnly) return;
      try {
        const allData = await Promise.all(
          favorites.map(async (id) => {
            const res = await jwtAxios.get(`/project/hospital/${id}`);
            const item = res.data;

            // 거리 계산
            if (currentPos?.lat && item?.facility?.latitude) {
              item.distance = calculateDistance(
                currentPos.lat,
                currentPos.lng,
                item.facility.latitude,
                item.facility.longitude
              );
            }

            // 목록에 시간이 있다면 미리 캐시에 싣기
            const hours = pickHours(item);
            if (Array.isArray(hours) && hours.length > 0) {
              const open = openUtil(hours);
              const itemId = item.hospitalId || item.id;
              setHoursMap((prev) => ({ ...prev, [itemId]: hours }));
              setOpenMap((prev) => ({ ...prev, [itemId]: open }));
              console.log("[HospitalMain] preload hours from list", { id: itemId, open, hoursLen: hours.length });
            }

            return item;
          })
        );
        setFavoriteResults(allData.filter(Boolean));
        setPageData((prev) => ({ ...prev, current: 0 }));
      } catch (e) {
        console.error("즐겨찾기 병원 불러오기 실패:", e);
      }
    };
    fetchFavorites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showFavoritesOnly, favorites, isLogin, currentPos, calculateDistance]);

  // 검색 submit
  const handleSubmit = (e) => {
    e.preventDefault();
    search(e, 0, { keyword, org, dept });
    setSearched(true);
  };

  // 즐겨찾기 필터 토글
  const handleToggleFavoritesOnly = () => {
    const next = !showFavoritesOnly;
    setShowFavoritesOnly(next);
    setFilters((prev) => ({ ...prev, onlyFavorites: next }));
  };

  // 표시 대상
  const displayedResults = showFavoritesOnly
    ? favoriteResults.slice(pageData.current * pageData.size, (pageData.current + 1) * pageData.size)
    : results;

  // 페이지네이션 데이터(기존 유지)
  const totalPages = showFavoritesOnly
    ? Math.ceil(favoriteResults.length / pageData.size)
    : (searchPageData?.pageNumList?.length || 1);

  const pagination = {
    current: (showFavoritesOnly ? pageData.current : searchPageData?.current || 0) + 1,
    pageNumList: Array.from({ length: totalPages }, (_, i) => i + 1),
    prev: (showFavoritesOnly ? pageData.current : searchPageData?.current || 0) > 0,
    next: (showFavoritesOnly ? pageData.current : searchPageData?.current || 0) < totalPages - 1,
  };

  // 페이지 변경(기존 유지)
  const handlePageChange = (n) => {
    if (showFavoritesOnly) {
      setPageData((prev) => ({ ...prev, current: n }));
    } else {
      search(null, n, { keyword, org, dept });
    }
  };

  /* =================== 핵심: 오픈 계산 로직 ===================

     1) 아이템에 영업시간이 있으면 그걸로 바로 openUtil
     2) 없거나 쓸모없으면(00:00 등) 백엔드에서 DB hours 조회
        - /project/facility/{facilityId}/business-hours  (우선)
        - /project/hospital/{id}/business-hours         (대체)
     3) 그래도 쓸모없으면 HIRA로 보충:
        - buildQParamsFromAddress(addr) → 여러 q1 후보 순차 시도
        - getHospitals → pickBest → hiraItemToBusinessHours
     4) 최종 hours 를 hoursMap[id]로 캐시, openUtil(hours) → openMap[id] 저장
  ============================================================= */

  useEffect(() => {
    if (!Array.isArray(displayedResults) || displayedResults.length === 0) return;

    (async () => {
      for (const it of displayedResults) {
        const id = it.hospitalId || it.id;
        if (!id) continue;

        // 이미 결과가 있으면 skip
        if (openMap[id] !== undefined || requestingRef.current.has(id)) continue;

        requestingRef.current.add(id);
        try {
          // A) 목록 내 시간
          let hours = pickHours(it);
          let usable = isUsableHours(hours);

          // B) DB business-hours (Facility 우선 → Hospital 대체)
          if (!usable) {
            try {
              const facilityId = it?.facility?.facilityId || it?.facilityId;
              if (facilityId) {
                const r1 = await jwtAxios.get(`/project/facility/${facilityId}/business-hours`);
                const h1 = r1?.data?.businessHours || r1?.data || [];
                if (isUsableHours(h1)) {
                  hours = h1;
                  usable = true;
                  console.log("[HospitalMain] got DB hours (facility)", { id, len: h1.length });
                }
              }
              if (!usable) {
                const r2 = await jwtAxios.get(`/project/hospital/${id}/business-hours`);
                const h2 = r2?.data?.businessHours || r2?.data || [];
                if (isUsableHours(h2)) {
                  hours = h2;
                  usable = true;
                  console.log("[HospitalMain] got DB hours (hospital)", { id, len: h2.length });
                }
              }
            } catch (e) {
              console.warn("[HospitalMain] business-hours fetch fail", { id, e });
            }
          }

          // C) HIRA 보충
          if (!usable) {
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
                } catch (e) {
                  console.warn("[HospitalMain] HIRA attempt failed", { id, q1, e });
                }
              }

              const h3 = picked ? hiraItemToBusinessHours(picked) : [];
              if (isUsableHours(h3)) {
                hours = h3;
                usable = true;
                console.log("[HospitalMain] got HIRA hours", { id, len: h3.length });
              }
            }
          }

          // 최종 open 계산
          const open = openUtil(hours);
          setHoursMap((prev) => ({ ...prev, [id]: hours }));
          setOpenMap((prev) => ({ ...prev, [id]: open }));
          console.log("[HospitalMain] final open", { id, open, hoursLen: hours?.length || 0 });
        } finally {
          requestingRef.current.delete(id);
        }
      }
    })();
  }, [displayedResults, openMap]);

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
            <img src="/image/map.png" alt="지도" height="150" />
          </Col>
        </Row>

        {/* 병원 / 약국 선택 버튼 */}
        <Row className="g-3 mb-4">
          <Col xs={6}>
            <Card className="card-hospital-blue text-white" onClick={() => navigate("/")}>
              <Card.Body>
                <img src="/image/hospitalBed.png" alt="병원" />
                <div className="fw-semibold">병원</div>
              </Card.Body>
            </Card>
          </Col>
          <Col xs={6}>
            <Card className="card-hospital-gray text-dark" onClick={() => navigate("/pharmacy")}>
              <Card.Body>
                <img src="/image/pharmacy.png" alt="약국" />
                <div className="fw-semibold">약국</div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* 검색 폼 */}
        <Form onSubmit={handleSubmit}>
          {/* 진료과목 선택 */}
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

          {/* 의료기관 */}
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

          {/* 검색창 */}
          <Form.Control
            type="text"
            placeholder="병원 이름을 입력하세요."
            className="search-input mb-3"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          <Button type="submit" className="btn-search w-100">내 주변 병원 검색</Button>
        </Form>

        {/* 즐겨찾기만 보기 */}
        {isLogin && searched && (
          <>
            <hr className="hr-line my-3" />
            <div className="d-flex justify-content-start align-items-center mt-4 mb-2">
              <Button
                variant="light"
                onClick={handleToggleFavoritesOnly}
                className="border-0 d-flex align-items-center gap-2"
              >
                {showFavoritesOnly ? <StarFill color="#FFD43B" size={20}/> : <Star color="#aaa" size={20}/>}
                <span className="small">{showFavoritesOnly ? "즐겨찾기만 보기" : "전체 보기"}</span>
              </Button>
            </div>
          </>
        )}

        {/* 검색 결과 */}
        {displayedResults.length > 0 ? (
          <>
            <div className="mt-4">
              {displayedResults.map((item) => {
                const id = item.hospitalId || item.id;
                const isOpen =
                  openMap[id] !== undefined
                    ? openMap[id]
                    : openUtil(pickHours(item)); // 초깃값(목록에 시간이 있는 경우)

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

        {/* 검색 결과 없음 */}
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
