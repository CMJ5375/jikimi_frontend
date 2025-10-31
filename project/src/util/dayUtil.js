// src/util/dayUtil.js

/** 요일 키 매핑 */
export const DAY_KEYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

export const FULL = {
  MON: "MONDAY",
  TUE: "TUESDAY",
  WED: "WEDNESDAY",
  THU: "THURSDAY",
  FRI: "FRIDAY",
  SAT: "SATURDAY",
  SUN: "SUNDAY",
};

// 한글 요일 → 영문 키 매핑
const KOR_TO_ENG = {
  "월": "MON",
  "화": "TUE",
  "수": "WED",
  "목": "THU",
  "금": "FRI",
  "토": "SAT",
  "일": "SUN",
};

/** 입력 요일 문자열 표준화 */
function normalizeDaysString(raw) {
  let s = String(raw || "").trim();

  // 한글 요일을 영문 키로 변환 (예: "월-금" → "MON-금" → "MON-FRI")
  s = s.replace(/[월화수목금토일]/g, (m) => KOR_TO_ENG[m] || m);

  // 다양한 대시/물결 기호를 '-' 로 통일
  s = s.replace(/[~–—－~]/g, "-");

  // 대소문자 통일
  s = s.toUpperCase();

  // WEEKDAY(S)/WEEKEND(S) 변형 지원
  if (s === "WEEKDAY" || s === "WEEKDAYS") return "MON,TUE,WED,THU,FRI";
  if (s === "WEEKEND" || s === "WEEKENDS") return "SAT,SUN";

  return s;
}

/** "MON-FRI" 같은 범위를 확장 */
export const expandRange = (token) => {
  const t = String(token || "").trim();
  if (!t) return [];
  const [start, end] = t.split("-");
  if (!start || !end) return [t];

  const si = DAY_KEYS.indexOf(start);
  const ei = DAY_KEYS.indexOf(end);
  if (si === -1 || ei === -1) return [t];

  const out = [];
  for (let i = si; i <= ei; i++) out.push(DAY_KEYS[i]);
  return out;
};

/** 요일 문자열을 배열로 정규화 (콤마/슬래시/공백 분리 + 범위 확장) */
export const normalizeTokens = (raw) => {
  const s = normalizeDaysString(raw);
  if (!s) return [];

  // 하이픈은 범위를 위해 유지, 콤마/슬래시/공백으로 분리
  const tokens = s.split(/[,\s/]+/).map((t) => t.trim()).filter(Boolean);

  // 범위 확장
  const expanded = tokens.flatMap(expandRange);

  // FULL 이름 지원 및 3글자 키 보정
  const mapped = expanded.map((t) => (FULL[t] ? t : t.substring(0, 3)));

  // 유효한 요일만 남김
  return mapped.filter((t) => DAY_KEYS.includes(t));
};

/** 현재 요일 키 (MON~SUN) 반환 */
export const getTodayKey = () => {
  const todayIndex = new Date().getDay(); // 0=일
  return DAY_KEYS[(todayIndex + 6) % 7];  // 월=0 기준 보정
};

/** 영문 요일 키 → 한글 */
export const getKoreanDayName = (dayKey) => {
  const map = { MON: "월", TUE: "화", WED: "수", THU: "목", FRI: "금", SAT: "토", SUN: "일" };
  return map[dayKey] || dayKey;
};

/** 내부: HH:MM 정규화 */
const toHHMM = (val) => {
  if (val === null || val === undefined) return null;
  let s = String(val).trim();
  if (!s || s.toLowerCase() === "null") return null;

  const m = s.match(/^(\d{1,2}):(\d{1,2})(?::\d{1,2})?$/);
  if (m) {
    const hh = String(m[1]).padStart(2, "0");
    const mm = String(m[2]).padStart(2, "0");
    return `${hh}:${mm}`;
  }
  if (/^\d+$/.test(s)) {
    if (s.length === 3) s = "0" + s;                          // 930  -> 0930
    if (s.length === 4) return `${s.slice(0,2)}:${s.slice(2)}`; // 1700 -> 17:00
  }
  return s;
};

/** 표시용 포맷 */
const fmt = (v) => {
  const t = toHHMM(v);
  if (!t) return "--:--";
  const m = t.match(/^(\d{1,2}):(\d{2})$/);
  if (m) {
    const hh = String(m[1]).padStart(2, "0");
    const mm = String(m[2]).padStart(2, "0");
    return `${hh}:${mm}`;
  }
  return t;
};

/** 특정 요일의 원본 레코드 찾기 (배열/문자열 days 모두 대응) */
export const matchForDay = (dayKey, list) => {
  if (!Array.isArray(list)) return null;
  for (const item of list) {
    const raw = item?.days;
    if (!raw) continue;

    let daysArr = [];
    if (Array.isArray(raw)) {
      // 예: ["MON-FRI", "SUN"] → ["MON","TUE","WED","THU","FRI","SUN"]
      for (const t of raw) {
        daysArr.push(...normalizeTokens(t));
      }
      daysArr = [...new Set(daysArr)]; // 중복 제거
    } else {
      daysArr = normalizeTokens(raw);
    }

    if (daysArr.includes(dayKey)) return item;
  }
  return null;
};

/** 특정 요일의 진료시간 정리 — 점심/노트 무시, 레코드 없거나 비정상이면 '휴무' */
export const getHoursByDay = (dayKey, businessHours) => {
  const record = matchForDay(dayKey, businessHours);
  if (!record) return { status: "휴무", note: "" };
  if (record.closed) return { status: "휴무", note: "" };

  const open = fmt(record.openTime);
  const close = fmt(record.closeTime);

  const invalid =
    (!record.openTime && !record.closeTime) ||
    (open === "--:--" && close === "--:--") ||
    (open === "00:00" && close === "00:00");

  if (invalid) return { status: "휴무", note: "" };

  return { status: `${open} ~ ${close}`, note: "" };
};
