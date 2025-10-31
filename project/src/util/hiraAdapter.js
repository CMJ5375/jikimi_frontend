// src/util/hiraAdapter.js
import { DAY_KEYS } from "./dayUtil"; // 같은 util 폴더

const DAY_KEY_BY_INDEX = {
  1: "MON", 2: "TUE", 3: "WED", 4: "THU", 5: "FRI", 6: "SAT", 7: "SUN",
};

function toHHMM(val) {
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
    if (s.length === 3) s = "0" + s;        // 930 -> 0930
    if (s.length === 4) return s.slice(0, 2) + ":" + s.slice(2); // 1700 -> 17:00
  }
  return s;
}

function parseLunchFromEtc(dutyEtc) {
  if (!dutyEtc) return { lunchStartTime: null, lunchEndTime: null, etcNote: "" };
  const etc = String(dutyEtc);
  const m = etc.match(/점심\s*시간?[:\s]*([0-2]?\d:\d{2})\s*[-~]\s*([0-2]?\d:\d{2})/);
  const lunchStartTime = m ? toHHMM(m[1]) : null;
  const lunchEndTime   = m ? toHHMM(m[2]) : null;
  return { lunchStartTime, lunchEndTime, etcNote: etc.trim() };
}

/** HIRA item → businessHours[] (dayUtil의 getHoursByDay에서 그대로 사용 가능) */
export function hiraItemToBusinessHours(item) {
  const { lunchStartTime, lunchEndTime, etcNote } = parseLunchFromEtc(item?.dutyEtc);

  const list = [];
  for (let i = 1; i <= 7; i++) {
    const dayKey = DAY_KEY_BY_INDEX[i];
    if (!dayKey || !DAY_KEYS.includes(dayKey)) continue;

    const openTime = toHHMM(item?.[`dutyTime${i}s`]);
    const closeTime = toHHMM(item?.[`dutyTime${i}c`]);

    const closed = !openTime || !closeTime || (openTime === "00:00" && closeTime === "00:00");

    list.push({
      days: [dayKey],
      openTime: openTime || null,
      closeTime: closeTime || null,
      closed,
      note: etcNote || "",
      lunchStartTime: lunchStartTime || null,
      lunchEndTime: lunchEndTime || null,
    });
  }
  return list;
}