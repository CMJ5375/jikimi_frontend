import { useEffect, useState } from "react";
import '../App.css';
import '../css/Pharmacy.css';
import { Container, Row, Col, Card, Button, Form, Dropdown } from "react-bootstrap";
import { GeoAltFill, StarFill, Star, TelephoneFill, CheckCircleFill, XCircleFill } from "react-bootstrap-icons";
import { useNavigate } from "react-router-dom";
import { getDefaultPosition } from "../api/geolocationApi";
import { renderKakaoMap } from "../api/kakaoMapApi";

//FacilityBusinessHourDTO 기반, 오늘 ‘운영중’ 계산
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

const PharmacyMain = () => {
  const [distance, setDistance] = useState("")
  const [keyword, setKeyword] = useState("")
  const [results, setResults] = useState([])
  const [favorites, setFavorites] = useState([])
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [currentPos, setCurrentPos] = useState({ lat: null, lng: null })

  const navigate = useNavigate()

  //드롭다운 거리
  const distanceList = ["500m", "1km", "5km", "10km"]

  //즐겨찾기 불러오기
  useEffect(() => {
    const stored = Object.keys(localStorage)
      .filter(k => k.startsWith("favorite_pharmacy_") && localStorage.getItem(k) === "true")
      .map(k => k.replace("favorite_pharmacy_", ""));
    setFavorites(stored);
  }, []);

  //즐겨찾기 토글
  const toggleFavorite = (id) => {
    const idStr = String(id);
    setFavorites(prev => {
      const updated = prev.includes(idStr) ? prev.filter(f => f !== idStr) : [...prev, idStr];
      localStorage.setItem(`favorite_pharmacy_${idStr}`, updated.includes(idStr));
      return updated;
    });
  };

  //기본으로 설정된 위치 가져오기
  useEffect(() => {
    getDefaultPosition().then(setCurrentPos);
  }, []);

  //검색 기능
  const onSearch = async (e) => {
    e.preventDefault();
    try {
      const url = `http://localhost:8080/project/pharmacy/search?keyword=${keyword}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`서버 오류: ${res.status}`);
      const page = await res.json();
      const data = Array.isArray(page.content) ? page.content : [];
      const normalized = data.map(p => ({
        pharmacyId: p.pharmacyId,
        pharmacyName: p.pharmacyName,
        address: p.facility?.address || "",
        phone: p.facility?.phone || "",
        latitude: p.facility?.latitude,
        longitude: p.facility?.longitude,
        open: isOpenNow(p.facilityBusinessHours || p.facility?.businessHours || []),
        distance: p.distance
          ? (p.distance < 1
              ? `${Math.round(p.distance * 1000)}m`
              : `${p.distance.toFixed(1)}km`)
          : "",
      }));
      setResults(normalized);
    } catch (error) {
      console.error("검색 실패:", error);
    }
  };

  // 즐겨찾기 필터 적용
  const displayedResults = showFavoritesOnly
    ? results.filter(r => favorites.includes(String(r.pharmacyId)))
    : results;

    
  // 지도 표시 (검색 결과 있을 때만)
  useEffect(() => {
    if (results.length === 0 || !currentPos.lat) return;
    renderKakaoMap("map", currentPos, results);
  }, [results, currentPos]);

  return (
    <>
      <div className="bg-white">
        <Container className="py-4">
          {/* 상단 소개 */}
          <Row className="g-3 mb-3 align-items-center">
            <Col xs={6}>
              <div className="d-flex align-items-center gap-2 text-secondary mb-2">
                <GeoAltFill size={18}/>
                <small>경기도 성남시 중원구</small>
              </div>
              <h3 className="fw-bold lh-base mb-3 pharmacy-title">
                지금 나에게<br/>딱 맞는 <span>약국</span>을 찾아보세요
              </h3>
            </Col>
            <Col xs={6} className="text-end">
              <img src="/image/map.png" alt="지도" height="150"/>
            </Col>
          </Row>

          {/* 병원 / 약국 선택 카드 */}
          <Row className="g-3 mb-4">
          <Col xs={6}>
            <Card className="card-pharmacy-gray text-dark" onClick={() => navigate("/")}>
              <Card.Body>
                <img src="/image/hospitalBed.png" alt="병원" />
                <div className="fw-semibold">병원</div>
              </Card.Body>
            </Card>
          </Col>
          <Col xs={6}>
            <Card className="card-pharmacy-blue text-white" onClick={() => navigate("/pharmacy")}>
              <Card.Body>
                <img src="/image/pharmacy.png" alt="약국" />
                <div className="fw-semibold">약국</div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

          {/* 검색 폼 */}
          <Form onSubmit={onSearch}>
            <Dropdown className="mb-3 dropdown-custom">
              <Dropdown.Toggle variant="light" className="text-dark d-flex justify-content-between align-items-center">
                <span className={distance ? "" : "text-secondary"}>{distance || "거리 선택"}</span>
                <i className="bi bi-chevron-down"></i>
              </Dropdown.Toggle>
              <Dropdown.Menu>
                {distanceList.map(d => <Dropdown.Item key={d} onClick={() => setDistance(d)}>{d}</Dropdown.Item>)}
                <Dropdown.Divider/>
                <Dropdown.Item onClick={() => setDistance("")}>선택 해제</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>

            {/* 검색창 */}
            <Form.Control
              type="text"
              placeholder="약국 이름을 입력하세요."
              className="search-input mb-3"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
            <Button type="submit" className="btn-search w-100">내 주변 약국 검색</Button>
          </Form>

          {/* 즐겨찾기만 보기 토글 버튼 */}
          {results.length > 0 && (
            <>
              <hr className="hr-line my-3"/>
              <div className="d-flex justify-content-start align-items-center mt-4 mb-3">
                <Button variant="light" onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                        className="border-0 d-flex align-items-center gap-2">
                  {showFavoritesOnly ? <StarFill color="#FFD43B" size={20}/> : <Star color="#aaa" size={20}/>}
                  <span className="small">{showFavoritesOnly ? "즐겨찾기만 보기" : "전체 보기"}</span>
                </Button>
              </div>
            </>
          )}

          {/* 검색 결과 */}
          {displayedResults.length > 0 && (
            <>
              <div id="map" style={{ width: "100%", height: "400px" }}></div>
              <div className="mt-4">
                {displayedResults.map(item => {
                  const isFavorite = favorites.includes(String(item.pharmacyId));
                  return (
                    <Card key={item.pharmacyId} className="result-card mb-3"
                          onClick={() => navigate(`/pharmacydetail/${item.pharmacyId}`)}>
                      <Card.Body>
                        <h5 className="fw-bold my-2 d-flex justify-content-between align-items-center">
                          <span>{item.pharmacyName}<span className="result-distance">({item.distance})</span></span>
                          <span className={`favorite-icon ${isFavorite ? "active" : ""}`}
                                onClick={(e) => { e.stopPropagation(); toggleFavorite(item.pharmacyId); }}>
                            {isFavorite ? <StarFill size={30}/> : <Star size={30}/>}
                          </span>
                        </h5>
                        <div className="my-3 d-flex align-items-center">
                          <span className="badge-road">도로명</span>
                          <span className="text-gray">{item.address}</span>
                        </div>
                        <div className="d-flex align-items-center justify-content-between">
                          <div className="text-gray d-flex align-items-center gap-2">
                            <TelephoneFill className="me-1"/> {item.phone}
                          </div>
                          <div className={`small fw-semibold ${item.open ? "text-success" : "text-secondary"}`}>
                            {item.open ? (<><CheckCircleFill size={18}/> 운영 중</>) : (<><XCircleFill size={18}/> 운영종료</>)}
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  );
                })}
              </div>
            </>
          )}

          {results.length === 0 && keyword && (
            <div className="text-center text-secondary mt-4">검색 결과가 없습니다.</div>
          )}
        </Container>
      </div>
    </>
  );
};

export default PharmacyMain
