// src/util/pharmacyAdapter.js

const DAY_MAP = { 1: "MON", 2: "TUE", 3: "WED", 4: "THU", 5: "FRI", 6: "SAT", 7: "SUN" };

function isNullishStr(v) {
  if (v === null || v === undefined) return true;
  const s = String(v).trim();
  return !s || s.toLowerCase() === "null" || s.toLowerCase() === "none";
}

function toHHMM(v) {
  if (isNullishStr(v)) return "";
  const s = String(v).trim();

  // "0900" → "09:00"
  if (/^\d{4}$/.test(s)) return s.slice(0, 2) + ":" + s.slice(2, 4);

  // "9:0", "09:00:00" → "09:00"
  if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(s)) {
    const [h, m] = s.split(":");
    return h.padStart(2, "0") + ":" + String(m).padStart(2, "0");
  }
  return s;
}

function pick(lowerObj, candidates) {
  for (const k of candidates) {
    const key = k.toLowerCase();
    const v = lowerObj[key];
    if (!isNullishStr(v)) return String(v).trim();
  }
  return "";
}

function dutySC(lowerObj, n) {
  // lowerObj는 키가 전부 소문자
  const sKey = `dutytime${n}s`; // 예: dutytime1s
  const cKey = `dutytime${n}c`; // 예: dutytime1c
  return {
    start: lowerObj[sKey] ?? "",
    close: lowerObj[cKey] ?? "",
  };
}

function fuzzyFindByDay(lowerObj, dayKey) {
  // 혹시 특이한 키가 있을 때(예: monday_open 등) 대비
  const aliases = {
    MON: ["mon", "monday"],
    TUE: ["tue", "tuesday"],
    WED: ["wed", "wednesday"],
    THU: ["thu", "thur", "thurs", "thursday"],
    FRI: ["fri", "friday"],
    SAT: ["sat", "saturday"],
    SUN: ["sun", "sunday"],
  }[dayKey];

  const startAliases = ["start", "s", "open", "begin", "from", "st", "opentime", "open_time"];
  const closeAliases = ["end", "c", "close", "until", "et", "closetime", "close_time"];

  const findVal = (aliasArr) => {
    for (const [k, v] of Object.entries(lowerObj)) {
      if (aliases.some((d) => k.includes(d)) && aliasArr.some((a) => k.includes(a))) {
        if (!isNullishStr(v)) return String(v).trim();
      }
    }
    return "";
  };

  return { start: findVal(startAliases), close: findVal(closeAliases) };
}

export function pharmacyItemToBusinessHours(item = {}) {
  // 1) 키를 전부 소문자로 만든 사전으로 변환
  const lower = {};
  for (const [k, v] of Object.entries(item)) {
    lower[String(k).toLowerCase()] = isNullishStr(v) ? "" : String(v).trim();
  }

  // 2) 메모/비고 추출 (대문자 DUTYETC도 커버)
  const note = pick(lower, ["dutyetc", "etc", "memo", "note", "remark"]);

  // 3) 요일별 구성
  const hours = [];
  for (let n = 1; n <= 7; n++) {
    const dayKey = DAY_MAP[n];

    // 우선 표준 키(dutytimeNs/dutytimeNc) 시도
    let { start, close } = dutySC(lower, n);

    // 없으면 퍼지 탐색
    if (!start && !close) {
      const fuzzy = fuzzyFindByDay(lower, dayKey);
      start = fuzzy.start;
      close = fuzzy.close;
    }

    // 평일 공통 키가 존재할 수 있음(예비)
    if (!start && !close) {
      start = pick(lower, ["weekdaystart", "weekdayopen", "weekstart", "weekday_open"]);
      close = pick(lower, ["weekdayend", "weekdayclose", "weekend", "weekday_close"]);
      if (start || close) {
        if (["SAT", "SUN"].includes(dayKey)) {
          start = "";
          close = "";
        }
      }
    }

    const openTime = toHHMM(start);
    const closeTime = toHHMM(close);
    const closed = (!openTime && !closeTime);

    hours.push({
      days: [dayKey],
      openTime: openTime || null,
      closeTime: closeTime || null,
      closed,
      note,
    });
  }

  return hours;
}
