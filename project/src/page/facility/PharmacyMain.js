// src/pages/PharmacyMain.js
import { useState, useEffect, useMemo } from "react";
import "../../App.css";
import "../../css/Pharmacy.css";
import { Container, Row, Col, Card, Button, Form, Dropdown } from "react-bootstrap";
import { GeoAltFill, StarFill, Star, TelephoneFill, CheckCircleFill, XCircleFill } from "react-bootstrap-icons";
import { useNavigate } from "react-router-dom";

import useFavorites from "../../hook/useFavorites";
import useFacilitySearch from "../../hook/useFacilitySearch";
import PageComponent from "../../component/common/PageComponent";
import KakaoMapComponent from "../../component/common/KakaoMapComponent";
import useCustomLogin from "../../hook/useCustomLogin";

import publicAxios from "../../util/publicAxios";
import jwtAxios from "../../util/jwtUtil";
import { getDefaultPosition, getAddressFromBackend } from "../../api/kakaoMapApi";
import { getCurrentPosition } from "../../api/geolocationApi";
import { openUtil } from "../../util/openUtil";
import { pharmacyItemToBusinessHours } from "../../util/pharmacyAdapter";

/* ===================== Switches ===================== */
const SKIP_DB_HOURS = true;

/* ===================== Helpers ===================== */
function pickHours(obj) {
  return obj?.facility?.businessHours ?? obj?.businessHours ?? obj?.hours ?? [];
}
function getFacilityIdFromItem(it) {
  if (it?.facility?.facilityId != null) return String(it.facility.facilityId);
  if (it?.facilityId != null) return String(it.facilityId);
  if (it?.pharmacyId != null && it?.facility == null) return String(it.pharmacyId);
  return null;
}
function isUsableHours(list) {
  if (!Array.isArray(list) || list.length === 0) return false;
  return list.some((r) => {
    const s = String(r?.openTime ?? "").trim();
    const c = String(r?.closeTime ?? "").trim();
    return !r?.closed && s && c && s !== "00:00" && c !== "00:00";
  });
}
function toOpenMap(respData) {
  if (respData && typeof respData === "object" && !Array.isArray(respData)) {
    if (respData.data && typeof respData.data === "object") return respData.data;
    return respData;
  }
  if (Array.isArray(respData)) {
    const map = {};
    for (const row of respData) {
      const k = row?.facilityId ?? row?.facility_id ?? row?.id;
      if (k != null) map[String(k)] = !!row?.open;
    }
    return map;
  }
  return {};
}
function extractQ0Q1(address) {
  const s = String(address || "").trim();
  const m = s.match(/^([^ ]+?(도|시))\s+([^ ]+?(군|구|시))/);
  if (!m) return { q0: "", q1: "" };
  return { q0: m[1], q1: m[3].replace(/\s+/g, "") };
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
  let best = null, bestScore = -1;
  for (const it of list) {
    const sName = it.DUTYNAME ? (norm(it.DUTYNAME).includes(nName) ? 10 : 0) : 0;
    const sAddr = it.DUTYADDR ? (norm(it.DUTYADDR).includes(nAddr.slice(0, 12)) ? 5 : 0) : 0;
    const sc = sName + sAddr;
    if (sc > bestScore) { best = it; bestScore = sc; }
  }
  return best || list[0];
}

/* ===== 동시성 제한 유틸 ===== */
async function mapWithConcurrency(items, limit, mapper) {
  const ret = new Array(items.length);
  let idx = 0;
  const workers = new Array(Math.min(limit, items.length)).fill(0).map(async () => {
    while (idx < items.length) {
      const i = idx++;
      ret[i] = await mapper(items[i], i);
    }
  });
  await Promise.all(workers);
  return ret;
}

const PharmacyMain = () => {
  const [distance, setDistance] = useState("");
  const [keyword, setKeyword] = useState("");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [favoriteResults, setFavoriteResults] = useState([]);
  const [pageData, setPageData] = useState({ current: 0, size: 10 });
  const [searched, setSearched] = useState(false);
  const [currentAddress, setCurrentAddress] = useState("위치 확인 중...");

  // 🔹 지도 중심(기본 좌표로 즉시 셋업 → currentPos 없어도 지도 뜸)
  const [center, setCenter] = useState({ lat: 37.432764, lng: 127.129637 });

  const [openBatchMap, setOpenBatchMap] = useState({});
  const [frontOpenMap, setFrontOpenMap] = useState({});

  const {
    results,
    pageData: searchPageData,
    currentPos,
    search,
    setFilters,
    calculateDistance,
  } = useFacilitySearch("pharmacy");

  const navigate = useNavigate();
  const { favorites, toggle, isLogin } = useFavorites("PHARMACY");
  const { /* isLogin 내부 사용 */ } = useCustomLogin();

  const distanceList = ["500m", "1km", "5km", "10km"];

  /* 현재 위치 → 주소 (기본 좌표로도 표시) */
  useEffect(() => {
    const fetchAddress = async () => {
      try {
        const pos = await getCurrentPosition();
        const address = await getAddressFromBackend(pos.lat, pos.lng);
        setCurrentAddress(address);
      } catch {
        setCurrentAddress("(기본)경기도 성남시 중원구 광명로 4");
      }
    };
    fetchAddress();
  }, []);

  /* currentPos가 들어오면 지도 중심 갱신 */
  useEffect(() => {
    if (currentPos?.lat && currentPos?.lng) {
      setCenter({ lat: currentPos.lat, lng: currentPos.lng });
    }
  }, [currentPos?.lat, currentPos?.lng]);

  /* 즐겨찾기 모드 데이터 로드 */
  useEffect(() => {
    let alive = true;
    const fetchFavorites = async () => {
      if (!isLogin || !showFavoritesOnly) return;
      try {
        const ids = [...new Set((favorites || []).map(String))];
        if (ids.length === 0) {
          if (alive) {
            setFavoriteResults([]);
            setPageData((prev) => ({ ...prev, current: 0 }));
          }
          return;
        }
        const CONCURRENCY = 4;
        const results = await mapWithConcurrency(ids, CONCURRENCY, async (pid) => {
          try {
            const res = await jwtAxios.get(`/project/pharmacy/${pid}`);
            const item = res.data;
            if (currentPos?.lat && item?.facility?.latitude) {
              item.distance = calculateDistance(
                currentPos.lat,
                currentPos.lng,
                item.facility.latitude,
                item.facility.longitude
              );
            }
            return item;
          } catch {
            return null;
          }
        });
        if (!alive) return;
        setFavoriteResults(results.filter(Boolean));
        setPageData((prev) => ({ ...prev, current: 0 }));
      } catch {
        if (alive) setFavoriteResults([]);
      }
    };
    fetchFavorites();
    return () => { alive = false; };
  }, [showFavoritesOnly, favorites, isLogin, currentPos]); // calculateDistance는 제외

  const handleSubmit = (e) => {
    e.preventDefault();
    search(e, 0, { keyword, distance });
    setSearched(true);
  };

  const handleToggleFavoritesOnly = () => {
    const next = !showFavoritesOnly;
    setShowFavoritesOnly(next);
    setFilters((prev) => ({ ...prev, onlyFavorites: next }));
  };

  /* ✅ displayedResults 고정 */
  const displayedResults = useMemo(() => {
    if (showFavoritesOnly) {
      const start = pageData.current * pageData.size;
      const end = (pageData.current + 1) * pageData.size;
      return favoriteResults.slice(start, end);
    }
    return results || [];
  }, [showFavoritesOnly, favoriteResults, pageData.current, pageData.size, results]);

  /* open-batch 의존성 키 */
  const ids = useMemo(
    () => displayedResults.map(getFacilityIdFromItem).filter(Boolean),
    [displayedResults]
  );
  const idsKey = useMemo(() => ids.join(","), [ids]);

  const totalPages = showFavoritesOnly
    ? Math.ceil(favoriteResults.length / pageData.size)
    : searchPageData?.pageNumList?.length || 1;

  const pagination = {
    current: (showFavoritesOnly ? pageData.current : searchPageData?.current || 0) + 1,
    pageNumList: Array.from({ length: totalPages }, (_, i) => i + 1),
    prev: (showFavoritesOnly ? pageData.current : searchPageData?.current || 0) > 0,
    next: (showFavoritesOnly ? pageData.current : searchPageData?.current || 0) < totalPages - 1,
  };

  const mapLocations = useMemo(
    () =>
      (displayedResults || [])
        .filter(
          (p) =>
            (p?.latitude || p?.facility?.latitude) &&
            (p?.longitude || p?.facility?.longitude)
        )
        .map((p) => ({
          name: p.name || p.pharmacyName || "약국",
          latitude: p.latitude || p?.facility?.latitude,
          longitude: p.longitude || p?.facility?.longitude,
        })),
    [displayedResults]
  );

  // 🔹 지도는 위치가 1개 이상이면 항상 표시 (currentPos 없어도 기본 중심으로 표시)
  const showMap = mapLocations.length > 0;

  // 🔹 중심좌표 기반으로 key 생성 (currentPos 의존 제거 → 초기에도 렌더됨)
  const mapKey = useMemo(() => {
    const cur = showFavoritesOnly ? pageData.current : (searchPageData?.current || 0);
    return `map-${showFavoritesOnly ? "fav" : "all"}-${cur}-${mapLocations.length}-${center.lat}-${center.lng}`;
  }, [showFavoritesOnly, pageData.current, searchPageData?.current, mapLocations.length, center.lat, center.lng]);

  /* 배치 오픈 상태 요청 */
  useEffect(() => {
    if (!ids.length) {
      setOpenBatchMap({});
      return;
    }
    (async () => {
      try {
        const res = await publicAxios.post("/project/facility/open-batch", { facilityIds: ids });
        const map = toOpenMap(res?.data);
        setOpenBatchMap(map || {});
      } catch {
        setOpenBatchMap({});
      }
    })();
  }, [idsKey]);

  /* 프론트 폴백 계산 */
  useEffect(() => {
    (async () => {
      if (!ids.length) {
        setFrontOpenMap({});
        return;
      }
      const needFallback = ids.filter((fid) => openBatchMap[fid] !== true);
      if (needFallback.length === 0) {
        setFrontOpenMap({});
        return;
      }

      const results = await Promise.all(
        displayedResults
          .map((it) => ({ it, fid: getFacilityIdFromItem(it) }))
          .filter(({ fid }) => fid && openBatchMap[fid] !== true)
          .map(async ({ it, fid }) => {
            try {
              let hours = [];

              if (!SKIP_DB_HOURS) {
                try {
                  const r = await publicAxios.get(`/project/facility/${fid}/business-hours`);
                  const raw = r?.data;
                  const list = raw?.businessHours ?? raw ?? [];
                  if (Array.isArray(list) && list.length > 0) hours = list;
                } catch {}
              }

              if (!isUsableHours(hours)) {
                const list2 = pickHours(it);
                if (Array.isArray(list2) && list2.length > 0) hours = list2;
              }

              let addr = it?.facility?.address || it?.address || "";
              let pharmName = it?.pharmacyName || it?.name || "";
              if ((!addr || !pharmName) && (it?.pharmacyId || it?.id)) {
                try {
                  const detailRes = await publicAxios.get(`/project/pharmacy/${it.pharmacyId || it.id}`);
                  const d = detailRes?.data;
                  addr = addr || d?.facility?.address || "";
                  pharmName = pharmName || d?.pharmacyName || "";
                } catch {}
              }

              if (!isUsableHours(hours)) {
                const { q0, q1 } = extractQ0Q1(addr);
                if (q0 && q1) {
                  try {
                    const res = await publicAxios.get("/project/realtime/pharm/pharmacies/raw", {
                      params: { q0, q1, page: 1, size: 50 },
                      responseType: "text",
                    });
                    const text = typeof res?.data === "string" ? res.data : JSON.stringify(res?.data);
                    const items = parsePharmXmlToItems(text);
                    const picked = pickBestItem(items, pharmName, addr);
                    const rtHours = picked ? pharmacyItemToBusinessHours(picked) : [];
                    if (Array.isArray(rtHours) && rtHours.length > 0) hours = rtHours;
                  } catch {}
                }
              }

              const open = isUsableHours(hours) ? openUtil(hours) : false;
              return [String(fid), open];
            } catch {
              return [String(fid), false];
            }
          })
      );

      const nextMap = Object.fromEntries(results);
      setFrontOpenMap(nextMap);
    })();
  }, [idsKey, openBatchMap]);

  const handlePageChange = (n) => {
    if (showFavoritesOnly) {
      setPageData((prev) => ({ ...prev, current: n }));
    } else {
      search(null, n, { keyword, distance });
    }
  };

  return (
    <div className="bg-white">
      <Container className="py-4">
        {/* 상단 소개 */}
        <Row className="g-3 mb-3 align-items-center">
          <Col xs={6}>
            <div className="d-flex align-items-center gap-2 text-secondary mb-2">
              <GeoAltFill size={15} />
              <small>{currentAddress}</small>
            </div>
            <h3 className="fw-bold lh-base mb-3 pharmacy-title">
              지금 나에게
              <br />
              딱 맞는 <span>약국</span>을 찾아보세요
            </h3>
          </Col>
          <Col xs={6} className="text-end">
            <img src="/image/map.png" alt="지도" className="img-fluid limited-img map-img" />
          </Col>
        </Row>

        {/* 병원 / 약국 선택 카드 */}
        <Row className="g-3 mb-4">
          <Col xs={6}>
            <Card className="card-pharmacy-gray text-dark" onClick={() => navigate("/")}>
              <Card.Body>
                <img src="/image/hospitalBed.png" alt="병원" className="img-fluid d-block mx-auto h-auto limited-img" />
                <div className="fw-semibold">병원</div>
              </Card.Body>
            </Card>
          </Col>
          <Col xs={6}>
            <Card className="card-pharmacy-blue text-white" onClick={() => navigate("/pharmacy")}>
              <Card.Body>
                <img src="/image/pharmacy.png" alt="약국" className="img-fluid d-block mx-auto h-auto limited-img" />
                <div className="fw-semibold">약국</div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* 검색 폼 */}
        <Form onSubmit={handleSubmit}>
          <Dropdown className="mb-3 dropdown-custom">
            <Dropdown.Toggle variant="light" className="text-dark d-flex justify-content-between align-items-center">
              <span className={distance ? "" : "text-secondary"}>{distance || "거리 선택"}</span>
              <i className="bi bi-chevron-down"></i>
            </Dropdown.Toggle>
            <Dropdown.Menu>
              {["500m", "1km", "5km", "10km"].map((d) => (
                <Dropdown.Item key={d} onClick={() => setDistance(d)}>
                  {d}
                </Dropdown.Item>
              ))}
              <Dropdown.Divider />
              <Dropdown.Item onClick={() => setDistance("")}>선택 해제</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>

          <Form.Control
            type="text"
            placeholder="약국 이름을 입력하세요."
            className="search-input mb-3"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          <Button type="submit" className="btn-search w-100">
            내 주변 약국 검색
          </Button>
        </Form>

        {/* 즐겨찾기만 보기 */}
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

        {/* 지도 */}
        {showMap && (
          <KakaoMapComponent
            key={mapKey}
            id="pharmacy-map-main"
            lat={center.lat} 
            lng={center.lng}
            name="내 위치"
            height={400}
            showCenterMarker
            locations={mapLocations}
          />
        )}

        {/* 검색 결과 */}
        {displayedResults.length > 0 ? (
          <>
            <div className="mt-4">
              {displayedResults.map((item) => {
                const id = item.pharmacyId || item.id;
                const facilityId = getFacilityIdFromItem(item);

                let isOpen;
                if (facilityId && openBatchMap && openBatchMap[facilityId] === true) {
                  isOpen = true;
                } else if (facilityId && (facilityId in frontOpenMap)) {
                  isOpen = !!frontOpenMap[facilityId];
                } else {
                  isOpen = openUtil(pickHours(item));
                }

                return (
                  <Card
                    key={id}
                    className="result-card mb-3"
                    onClick={() => navigate(`/pharmacydetail/${id}`)}
                  >
                    <Card.Body>
                      <h5 className="fw-bold my-2 d-flex justify-content-between align-items-center">
                        <span>
                          {item.pharmacyName || item.name}
                          <span className="result-distance">({item.distance || "거리정보 없음"})</span>
                        </span>
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
                      </h5>

                      <div className="my-3 d-flex align-items-center">
                        <span className="badge-road">도로명</span>
                        <span className="text-gray">
                          {item?.facility?.address || item?.address || "주소 정보 없음"}
                        </span>
                      </div>

                      <div className="d-flex align-items-center justify-content-between">
                        <div className="text-gray d-flex align-items-center gap-2">
                          <TelephoneFill className="me-1" />
                          {item?.facility?.phone || item?.phone || "전화 정보 없음"}
                        </div>
                        <div className={`small fw-semibold ${isOpen ? "text-success" : "text-secondary"}`}>
                          {isOpen ? (
                            <>
                              <CheckCircleFill size={18} /> 영업 중
                            </>
                          ) : (
                            <>
                              <XCircleFill size={18} /> 영업 종료
                            </>
                          )}
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
          showFavoritesOnly && <div className="text-center text-secondary mt-4">즐겨찾기한 약국이 없습니다.</div>
        )}

        {results.length === 0 && keyword && (
          <div className="text-center text-secondary mt-4">검색 결과가 없습니다.</div>
        )}
      </Container>
    </div>
  );
};

export default PharmacyMain;
