// 운영시간 배열 예시 지원:
// 1) [{ dayOfWeek: 'MON', openTime:'09:00', closeTime:'18:00', open24h:false, closed:false }, ...]
// 2) [{ days: 'MON,TUE,WED,THU,FRI', openTime:'09:00', closeTime:'18:00', open24h:false, closed:false }, ...]
export function openUtil(businessHours = []) {
  if (!Array.isArray(businessHours) || businessHours.length === 0) return false;

  // 항상 한국시간(KST) 기준으로 판단
  const nowKST = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
  const nowMins = nowKST.getHours() * 60 + nowKST.getMinutes();

  // JS: 0=Sun..6=Sat → 단축형 요일
  const shortDays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const longDays  = ['SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY'];
  const todayShort = shortDays[nowKST.getDay()];
  const todayLong  = longDays[nowKST.getDay()];

  const toMin = (hhmm) => {
    if (!hhmm || typeof hhmm !== 'string' || !hhmm.includes(':')) return null;
    const [h, m] = hhmm.split(':').map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) return null;
    return h * 60 + m;
  };

  const isNowBetween = (startMin, endMin) => {
    if (startMin == null || endMin == null) return false;
    if (startMin === endMin) return false; // 0분 영업은 미운영으로 간주
    // 일반 구간
    if (endMin > startMin) return nowMins >= startMin && nowMins < endMin;
    // 자정 넘김(예: 22:00~02:00)
    return nowMins >= startMin || nowMins < endMin;
  };

  // 오늘 요일에 해당하는 행 선별 (dayOfWeek 단일 or days 콤마 집약형 모두 지원)
  const todays = businessHours.filter((b) => {
    const d = String(b.dayOfWeek || '').toUpperCase();
    const ds = String(b.days || '').toUpperCase();
    const list = ds ? ds.split(',').map(s => s.trim()) : [];
    return (
      d === todayShort || d === todayLong ||
      list.includes(todayShort) || list.includes(todayLong)
    );
  });

  if (todays.length === 0) return false; // 오늘 정보 없으면 미운영 처리(원래 시그니처 유지)

  // 오늘 중 하나라도 24시간 영업이면 운영 중
  if (todays.some(b => b.open24h && !b.closed)) return true;

  // 오늘 전부 휴무면 운영 종료
  if (todays.every(b => b.closed)) return false;

  // 하나라도 지금 시간에 걸리면 운영 중
  for (const b of todays) {
    if (b.closed) continue;
    const s = toMin(b.openTime);
    const e = toMin(b.closeTime);
    if (isNowBetween(s, e)) return true;
  }

  return false;
}
