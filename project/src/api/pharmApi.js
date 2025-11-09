import publicAxios from "../util/publicAxios"; 
const BASE = "/project/realtime/pharm";

export async function getPharmacies({ q0, q1, page = 1, size = 10 }) {
  const res = await publicAxios.get(`${BASE}/pharmacies`, {
    params: { q0, q1, page, size },
    withCredentials: false,
  });
  return res.data;
}

export async function getPharmaciesRaw({ q0, q1, page = 1, size = 10 }) {
  try {
    const res = await publicAxios.get(`${BASE}/pharmacies/raw`, {
      params: { q0, q1, page, size },
      responseType: "text",
      transformResponse: [(d) => d],
      validateStatus: () => true,
      withCredentials: false,
    });
    return { status: res.status, text: res.data ?? "" };
  } catch (e) {
    return { status: -1, text: String(e) };
  }
}
