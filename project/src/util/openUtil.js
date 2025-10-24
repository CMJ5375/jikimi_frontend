export function openUtil(businessHours = []) {
  if (!Array.isArray(businessHours) || businessHours.length === 0) return false;
  const now = new Date();
  const dayNames = ["SUNDAY","MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY"];
  const today = dayNames[now.getDay()];
  const todayEntry = businessHours.find(b => (b.dayOfWeek || "").toUpperCase() === today);
  if (!todayEntry) return false;
  if (todayEntry.open24h) return true;
  if (todayEntry.closed) return false;
  if (!todayEntry.openTime || !todayEntry.closeTime) return false;
  const [oH, oM] = todayEntry.openTime.split(":").map(Number);
  const [cH, cM] = todayEntry.closeTime.split(":").map(Number);
  const openMins  = oH * 60 + oM;
  const closeMins = cH * 60 + cM;
  const nowMins   = now.getHours() * 60 + now.getMinutes();
  return nowMins >= openMins && nowMins < closeMins;
}
