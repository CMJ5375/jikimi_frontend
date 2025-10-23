import { useEffect, useMemo, useState } from "react";
import '../App.css';
import '../css/Hospital.css';
import { Container, Row, Col, Card, Button, Form, Dropdown } from "react-bootstrap";
import { GeoAltFill, StarFill, Star, TelephoneFill, HospitalFill, CheckCircleFill, XCircleFill } from "react-bootstrap-icons";
import { useNavigate } from "react-router-dom";
import { getDefaultPosition, addDistanceAndSort } from "../api/geolocationApi";

// FacilityBusinessHourDTO 기반, 오늘 ‘운영중’ 계산 유틸
function isOpenNow(businessHours = []) {
  if (!Array.isArray(businessHours) || businessHours.length === 0) return false
  const now = new Date()
  const dayNames = ["SUNDAY","MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY"]
  const today = dayNames[now.getDay()]
  const todayEntry = businessHours.find(b => (b.dayOfWeek || "").toUpperCase() === today)
  if (!todayEntry) return false
  if (todayEntry.open24h) return true
  if (todayEntry.closed) return false
  if (!todayEntry.openTime || !todayEntry.closeTime) return false;
  const [oH,oM] = todayEntry.openTime.split(":").map(Number)
  const [cH,cM] = todayEntry.closeTime.split(":").map(Number)
  const openMins  = oH*60 + oM
  const closeMins = cH*60 + cM
  const nowMins   = now.getHours()*60 + now.getMinutes()
  return nowMins >= openMins && nowMins < closeMins
}

const HospitalMain = () => {
  const [dept, setDept] = useState("")
  const [org, setOrg] = useState("")
  const [keyword, setKeyword] = useState("")
  const [results, setResults] = useState([])
  const [favorites, setFavorites] = useState([])
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [currentPos, setCurrentPos] = useState({ lat: null, lng: null })

  const navigate = useNavigate()

  //드롭다운 진료과목/기관종류
  const deptList = useMemo(
    () => ["내과", "외과", "정형외과", "소아청소년과", "산부인과", "안과", "이비인후과", "응급의학과"], []
  )
  const orgList = useMemo(
    () => ["상급종합병원", "종합병원", "병원", "의원", "보건소", "한방병원", "치과의원"], []
  )

  // 페이지 최초 진입 시 localStorage에서 즐겨찾기 불러오기
  useEffect(() => {
    const stored = Object.keys(localStorage)
      .filter((key) => key.startsWith("favorite_hospital_"))
      .filter((key) => localStorage.getItem(key) === "true")
      .map((key) => key.replace("favorite_hospital_", ""))
    setFavorites(stored);
  }, [])

  // 즐겨찾기 토글 (localStorage 동기화)
  const toggleFavorite = (id) => {
    setFavorites((prev) => {
      const idStr = String(id)
      const newFavorites = prev.includes(idStr)
        ? prev.filter((fid) => fid !== idStr)
        : [...prev, idStr]

      // 로컬스토리지에 반영
      localStorage.setItem(`favorite_hospital_${idStr}`, newFavorites.includes(idStr))
      return newFavorites
    })
  }

  //기본으로 설정된 위치 가져오기
  useEffect(() => {
    getDefaultPosition().then(setCurrentPos)
  }, [])

  //검색 기능
  const onSearch = async (e) => {
    e.preventDefault()
    try {
      const url = `http://localhost:8080/project/hospital/search?keyword=${keyword}&org=${org}&dept=${dept}`
      const res = await fetch(url)
      if (!res.ok) throw new Error(`서버 오류: ${res.status}`)
      const page = await res.json()
      const data = Array.isArray(page.content) ? page.content : []

      //클라이언트 측 필터링 (이름/기관유형/진료과목)
      const filtered = data.filter((h) => {
        const nameMatch = keyword ? (h.hospitalName || "").includes(keyword) : true
        const orgMatch  = org ? (h.facility?.orgType || "").includes(org) : true
        const deptMatch = dept ? (h.departments || []).some(d => (d.deptName || "").includes(dept)) : true
        return nameMatch && orgMatch && deptMatch
      })

      //화면에서 쓰던 구조로 정규화 + ‘오늘 운영중’ 계산
      const normalized = filtered.map(h => ({
        hospitalId: h.hospitalId,                   
        name: h.hospitalName,                        
        address: h.facility?.address || "",        
        phone: h.facility?.phone || "",            
        latitude: h.facility?.latitude,             
        longitude: h.facility?.longitude,          
        orgType: h.facility?.orgType || "",        
        hasEmergency: false,                       
        open: isOpenNow(h.facilityBusinessHours || h.facility?.businessHours || []),
      }))

      const sortedData = addDistanceAndSort(normalized, currentPos)
      setResults(sortedData)
    } catch (error) {
      console.error("검색 실패:", error)
    }
  }

  // 즐겨찾기 필터 적용
  const displayedResults = showFavoritesOnly
    ? results.filter((r) => favorites.includes(String(r.hospitalId)))
    : results;

  return (
    <div className="bg-white">
      <Container className="py-4">
        {/* 상단 소개 영역 */}
        <Row className="g-3 mb-3 align-items-center">
          <Col xs={6}>
            <div className="d-flex align-items-center gap-2 text-secondary mb-2">
              <GeoAltFill size={18} />
              <small>경기도 성남시 중원구</small>
            </div>
            <h3 className="fw-bold lh-base mb-3 hospital-title">
              지금 나에게<br />
              딱 맞는 <span>병원</span>을 찾아보세요
            </h3>
          </Col>
          <Col xs={6} className="text-end">
            <img src="/image/map.png" alt="지도" height="150" />
          </Col>
        </Row>

        {/* 병원 / 약국 선택 버튼 */}
        <Row className="g-3 mb-4">
          <Col xs={6}>
            <Card
              className="card-hospital-blue text-white"
              onClick={() => navigate("/")}
            >
              <Card.Body>
                <img src="/image/hospitalBed.png" alt="병원 이미지" />
                <div className="fw-semibold">병원</div>
              </Card.Body>
            </Card>
          </Col>

          <Col xs={6}>
            <Card
              className="card-hospital-gray text-dark"
              onClick={() => navigate("/pharmacy")}
            >
              <Card.Body>
                <img src="/image/pharmacy.png" alt="약국 이미지" />
                <div className="fw-semibold">약국</div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* 검색 폼 */}
        <Form onSubmit={onSearch}>
          {/* 진료과목 */}
          <Dropdown className="mb-3 dropdown-custom">
            <Dropdown.Toggle
              variant="light"
              className="text-dark d-flex justify-content-between align-items-center"
            >
              <span className={dept ? "" : "text-secondary"}>{dept || "진료과목"}</span>
              <i className="bi bi-chevron-down"></i>
            </Dropdown.Toggle>
            <Dropdown.Menu>
              {deptList.map((d) => (
                <Dropdown.Item key={d} onClick={() => setDept(d)}>
                  {d}
                </Dropdown.Item>
              ))}
              <Dropdown.Divider />
              <Dropdown.Item onClick={() => setDept("")}>선택 해제</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>

          {/* 의료기관 */}
          <Dropdown className="mb-3 dropdown-custom">
            <Dropdown.Toggle
              variant="light"
              className="text-dark d-flex justify-content-between align-items-center"
            >
              <span className={org ? "" : "text-secondary"}>{org || "의료기관"}</span>
              <i className="bi bi-chevron-down"></i>
            </Dropdown.Toggle>
            <Dropdown.Menu>
              {orgList.map((o) => (
                <Dropdown.Item key={o} onClick={() => setOrg(o)}>
                  {o}
                </Dropdown.Item>
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

        {/* 즐겨찾기 보기 토글 버튼 */}
        {results.length > 0 && (
          <>
          <hr className="hr-line my-3" />
            <div className="d-flex justify-content-start align-items-center mt-4 mb-2">
              <Button
                variant="light"
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                className="border-0 d-flex align-items-center gap-2"
              >
                {showFavoritesOnly ? (
                  <StarFill color="#FFD43B" size={20} />
                ) : (
                  <Star color="#aaa" size={20} />
                )}
                <span className="small">{showFavoritesOnly ? "즐겨찾기만 보기" : "전체 보기"}</span>
              </Button>
            </div>
          </>
        )}

        {/* 검색 결과 */}
        {displayedResults.length > 0 && (
            <div className="mt-4">
              {displayedResults.map((item) => {
                const isFavorite = favorites.includes(String(item.hospitalId));
                return (
                  <Card
                    key={item.hospitalId}
                    className="result-card mb-3"
                    onClick={() => navigate(`/hospitaldetail/${item.hospitalId}`)}
                  >
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="text-gray">{item.orgType || "의료기관 미지정"}</span>

                        {/* 즐겨찾기 */}
                        <span
                          className={`favorite-icon ${isFavorite ? "active" : ""}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(item.hospitalId);
                          }}
                        >
                          {isFavorite ? <StarFill size={30} /> : <Star size={30} />}
                        </span>
                      </div>

                    <h5 className="fw-bold mb-2">
                      {item.hospitalName}
                      <span className="result-distance">({item.distance})</span>
                    </h5>

                    <div className="my-3 d-flex align-items-center" style={{ marginTop: "6px" }}>
                      <span className="badge-road">도로명</span>
                      <span className="text-gray">{item.address}</span>
                    </div>

                    <div className="d-flex align-items-center justify-content-between">
                      <div className="text-gray d-flex align-items-center gap-2">
                        <TelephoneFill className="me-1" /> {item.phone}
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        {item.hasEmergency && (
                          <div className="d-flex align-items-center gap-1 text-danger fw-semibold small">
                            <HospitalFill /> 응급실 운영
                          </div>
                        )}
                        <div
                          className={`small fw-semibold ms-2 d-flex align-items-center gap-1 ${
                            item.open ? "text-success" : "text-secondary"
                          }`}
                        >
                          {item.open ? (
                            <>
                              <CheckCircleFill size={18} /> 운영 중
                            </>
                          ) : (
                            <>
                              <XCircleFill size={18} /> 운영종료
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              )})}
            </div>
        )}
      </Container>
    </div>
    
  );
};

export default HospitalMain;
