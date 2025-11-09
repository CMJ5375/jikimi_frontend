import publicAxios from "../util/publicAxios"; 
const BASE = "/project/realtime/hira";

export async function getHospitals({ q0, q1, page = 1, size = 10 }) {
  const res = await publicAxios.get(`${BASE}/hospitals`, {
    params: { q0, q1, page, size },
    withCredentials: false, // 공개 엔드포인트면 false 유지
  });
  return res.data;
}

// RAW 확인용
export async function getHospitalsRaw({ q0, q1, page = 1, size = 10 }) {
  try {
    const res = await publicAxios.get(`${BASE}/hospitals/raw`, {
      params: { q0, q1, page, size },
      responseType: "text",
      transformResponse: [(d) => d],  // 파싱 금지
      validateStatus: () => true,     // 4xx/5xx도 throw 안 함
      withCredentials: false,
    });
    return { status: res.status, text: res.data ?? "" };
  } catch (e) {
    return { status: -1, text: String(e) };
  }
}