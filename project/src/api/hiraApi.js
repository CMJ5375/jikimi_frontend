import axios from "axios";
const BASE = "/project/realtime/hira"; 

export async function getHospitals({ q0, q1, page=1, size=10 }) {
  const res = await axios.get(`${BASE}/hospitals`, { params: { q0, q1, page, size } });
  return res.data;
}

// 필요시 RAW 확인용
export async function getHospitalsRaw({ q0, q1, page = 1, size = 10 }) {
  try {
    const res = await axios.get(`${BASE}/hospitals/raw`, {
      params: { q0, q1, page, size },
      responseType: "text",
      transformResponse: [d => d], // 파싱 금지
      validateStatus: () => true,  // 4xx/5xx도 예외 던지지 말고 res로 받기
    });
    // 항상 {status, text} 형태로 리턴
    return { status: res.status, text: res.data ?? "" };
  } catch (e) {
    // 네트워크 레벨 오류 (CORS, 연결 실패 등)
    return { status: -1, text: String(e) };
  }
}