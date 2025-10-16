import React, { useEffect, useState } from "react";

const HospitalList = () => {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHospitals = async () => {
      try {
        const serviceKey = "U418797P-U418-U418-U418-U418797PVF"; 
        // 예: 성남시 주소 포함 데이터 조회 (실제 파라미터는 API 명세 확인 필요)
        const url = `http://www.safemap.go.kr/legend/legendApiXml.do?apikey=${serviceKey}&layer=A2SM_GENERAL_HOSPITAL`;
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error("네트워크 응답 오류");
        }

        const data = await response.json();
        console.log("응답 데이터:", data);

        if (data?.response?.body?.items) {
          setHospitals(data.response.body.items);
        } else {
          throw new Error("병원 데이터를 찾을 수 없습니다.");
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchHospitals();
  }, []);

  if (loading) return <p>로딩 중...</p>;
  if (error) return <p>에러 발생: {error}</p>;

  return (
    <>
    <div>
      <h2>성남시 병원 목록</h2>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {hospitals.map((h, idx) => (
          <li 
            key={idx} 
            style={{ marginBottom: "16px", padding: "12px", border: "1px solid #ddd", borderRadius: "8px" }}
          >
            <h3>{h.instt_nm}</h3>
            <p><strong>주소:</strong> {h.addr}</p>
            <p><strong>분류:</strong> {h.clsfNm}</p>
            <p><strong>응급의료기관:</strong> {h.emgncMedcareInsttYn}</p>
            <p><strong>대표전화:</strong> {h.telno}</p>
            <p><strong>진료시간:</strong> {h.trtmntTime}</p>
            <p><strong>비고:</strong> {h.rm}</p>
          </li>
        ))}
      </ul>
    </div>
    </>
  );
};

export default HospitalList;
