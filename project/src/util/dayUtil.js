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

/* "MON-FRI" 같은 범위를 확장해주는 함수 */
export const expandRange = (token) => {
  const [start, end] = token.split("-");
  const si = DAY_KEYS.indexOf(start);
  const ei = DAY_KEYS.indexOf(end);
  if (si === -1 || ei === -1) return [token];
  const out = [];
  for (let i = si; i <= ei; i++) out.push(DAY_KEYS[i]);
  return out;
};

/* 요일 문자열을 배열로 정규화 (대소문자, 콤마, 범위, FullName 등) */
export const normalizeTokens = (raw) => {
  const s = String(raw || "").toUpperCase().trim();
  if (!s) return [];

  if (s === "WEEKDAY" || s === "WEEKDAYS") return ["MON", "TUE", "WED", "THU", "FRI"];
  if (s === "WEEKEND" || s === "WEEKENDS") return ["SAT", "SUN"];

  const tokens = s.split(/[,/]/).map((t) => t.trim());
  const expanded = tokens.flatMap(expandRange);
  return expanded.map((t) => (FULL[t] ? t : t.substring(0, 3).toUpperCase())).filter(Boolean);
};

/* 현재 요일을 "MON" ~ "SUN" 형식으로 반환 */
export const getTodayKey = () => {
  const todayIndex = new Date().getDay(); // 0=일
  return DAY_KEYS[(todayIndex + 6) % 7]; // 월=0으로 맞춤
};

/* 영문 요일 키를 한글로 변환 */
export const getKoreanDayName = (dayKey) => {
  const map = {
    MON: "월",
    TUE: "화",
    WED: "수",
    THU: "목",
    FRI: "금",
    SAT: "토",
    SUN: "일",
  };
  return map[dayKey] || dayKey;
};

/* 시간 포맷 보정 (문자/Date/LocalTime 문자열을 "HH:MM"로 정규화) */
const fmt = (v) => { 
  if (!v) return "--:--";
  if (typeof v === "string") {
    // "09:00:00" → "09:00", "9:0" → "09:00"
    const m = v.match(/^(\d{1,2}):(\d{1,2})(?::\d{1,2})?$/);
    if (m) {
      const hh = String(m[1]).padStart(2, "0");
      const mm = String(m[2]).padStart(2, "0");
      return `${hh}:${mm}`;
    }
    return v;
  }
  try {
    const d = new Date(v);
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  } catch {
    return String(v);
  }
};

/* 특정 요일에 해당하는 원본 레코드 반환 (배열/문자열 days 모두 대응) */
export const matchForDay = (dayKey, list) => {
  if (!Array.isArray(list)) return null;
  for (const item of list) {
    const raw = item?.days;
    if (!raw) continue;
    const days = Array.isArray(raw) ? raw : normalizeTokens(raw);
    if (days.includes(dayKey)) return item;
  }
  return null;
};

/* 특정 요일의 진료시간 / 비고 정리 */
export const getHoursByDay = (dayKey, businessHours) => {
  const record = matchForDay(dayKey, businessHours);
  if (!record) return { status: "정보 없음", note: "" };
  if (record.closed) return { status: "휴무", note: "" };

  // 점심시간 우선순위: note 안의 Lunch/점심 → 별도 필드(lunchStartTime~lunchEndTime)
  let lunchNote = "";
  if (record.note) {
    lunchNote = String(record.note)
      .replace(/Lunch/gi, "점심")
      .replace(/Break/gi, "점심")
      .trim();
  }
  if (!lunchNote && (record.lunchStartTime || record.lunchEndTime)) {
    lunchNote = `점심 ${fmt(record.lunchStartTime)}~${fmt(record.lunchEndTime)}`;
  }
  if (!lunchNote) lunchNote = "점심시간 정보 없음";

  return {
    status: `${fmt(record.openTime)} ~ ${fmt(record.closeTime)}`,
    note: lunchNote,
  };
};
