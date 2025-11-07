// src/util/hiraAdapter.js
import { DAY_KEYS } from "./dayUtil"; // 요일 유효성 체크에 사용 (["MON","TUE","WED","THU","FRI","SAT","SUN"])

// HIRA 요일 인덱스 → 요일키 매핑
// 1=MON, 2=TUE, 3=WED, 4=THU, 5=FRI, 6=SAT, 7=SUN
const DAY_KEY_BY_INDEX = {
  1: "MON",
  2: "TUE",
  3: "WED",
  4: "THU",
  5: "FRI",
  6: "SAT",
  7: "SUN",
};

// ───────────────────────── helpers ─────────────────────────

// '0900' → '09:00', '900' → '09:00', '09:00' → '09:00', 'null'/'', undefined → null
function toHHMM(v) {
  if (v === null || v === undefined) return null;
  let s = String(v).trim();
  if (!s || s.toLowerCase() === "null") return null;

  // 이미 HH:MM 인 경우
  const mm = s.match(/^(\d{1,2}):(\d{1,2})(?::\d{1,2})?$/);
  if (mm) {
    const hh = String(mm[1]).padStart(2, "0");
    const mi = String(mm[2]).padStart(2, "0");
    return `${hh}:${mi}`;
  }

  // 숫자만 있는 경우 처리
  if (/^\d+$/.test(s)) {
    if (s.length === 3) s = "0" + s; // 900 → 0900
    if (s.length === 4) return `${s.slice(0, 2)}:${s.slice(2)}`; // 0900 → 09:00
  }

  return null; // 그 외 형식은 무시
}

// 시간쌍을 검증하고 레코드로 만들기
function mk(open, close, days, extra = {}) {
  const o = toHHMM(open);
  const c = toHHMM(close);
  if (!o || !c) return null;
  if (o === "00:00" && c === "00:00") return null;
  return { days, openTime: o, closeTime: c, closed: false, ...extra };
}

// etc(비고)에서 점심시간을 추출 (있으면)
function parseLunchFromEtc(dutyEtc) {
  if (!dutyEtc) return { lunchStartTime: null, lunchEndTime: null, etcNote: "" };
  const etc = String(dutyEtc);
  // 예: "점심시간 12:30~13:30" / "점심 시간: 12:00 - 13:00" 등
  const m = etc.match(/점심\s*시간?[:\s]*([0-2]?\d:\d{2})\s*[-~]\s*([0-2]?\d:\d{2})/);
  const lunchStartTime = m ? toHHMM(m[1]) : null;
  const lunchEndTime   = m ? toHHMM(m[2]) : null;
  return { lunchStartTime, lunchEndTime, etcNote: etc.trim() };
}

// 안전하게 키 꺼내기 (대문자/카멜/소문자까지 대응)
function pickItemKey(item, baseUpper, baseCamel, baseLower) {
  return (
    item?.[baseUpper] ??
    item?.[baseCamel] ??
    item?.[baseLower]
  );
}

// ─────────────────────── main converter ───────────────────────

/**
 * HIRA item → businessHours[]
 *
 * 지원 키:
 *  - 대문자: DUTYTIME{n}S / DUTYTIME{n}C  (1=MON..7=SUN, 8=HOLIDAY)
 *  - 카멜:   dutyTime{n}s / dutyTime{n}c
 *  - 소문자: dutytime{n}s / dutytime{n}c
 *
 * HOLIDAY(8)는 정책상 일요일(SUN)로 흡수한다. (필요시 별도 처리 가능)
 *
 * 반환 형태 예:
 * [
 *   { days: "MON", openTime: "09:00", closeTime: "18:00", closed: false, note, lunchStartTime, lunchEndTime },
 *   ...
 * ]
 */
export function hiraItemToBusinessHours(item) {
  if (!item) return [];

  const { lunchStartTime, lunchEndTime, etcNote } = parseLunchFromEtc(
    item?.DUTYETC ?? item?.dutyEtc ?? item?.dutyetc
  );

  const out = [];

  // 1..7: 월~일
  for (let i = 1; i <= 7; i++) {
    const dayKey = DAY_KEY_BY_INDEX[i];
    if (!dayKey || !DAY_KEYS.includes(dayKey)) continue;

    const s =
      pickItemKey(item, `DUTYTIME${i}S`, `dutyTime${i}s`, `dutytime${i}s`);
    const c =
      pickItemKey(item, `DUTYTIME${i}C`, `dutyTime${i}c`, `dutytime${i}c`);

    const rec = mk(s, c, dayKey, {
      note: etcNote || "",
      lunchStartTime: lunchStartTime || null,
      lunchEndTime: lunchEndTime || null,
    });
    if (rec) out.push(rec);
  }

  // 8: 공휴일 → 일요일로 흡수
  {
    const s = pickItemKey(item, `DUTYTIME8S`, `dutyTime8s`, `dutytime8s`);
    const c = pickItemKey(item, `DUTYTIME8C`, `dutyTime8c`, `dutytime8c`);
    const rec = mk(s, c, "SUN", {
      note: etcNote || "",
      lunchStartTime: lunchStartTime || null,
      lunchEndTime: lunchEndTime || null,
    });
    if (rec) out.push(rec);
  }

  // 중복 제거 (동일 day/open/close 조합은 하나만)
  const seen = new Set();
  return out.filter((r) => {
    const key = `${r.days}-${r.openTime}-${r.closeTime}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
