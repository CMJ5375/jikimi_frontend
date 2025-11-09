import { API_SERVER_HOST } from "../../config/api";
const toAbs = (u) => (!u ? u : u.startsWith("http") ? u : `${API_SERVER_HOST}${u}`);

export default function Avatar({ src, size=32, className="" }) {
  const fallback = `${API_SERVER_HOST}/default-profile.png`;
  const real = src ? toAbs(src) : fallback;
  return (
    <img
      src={real}
      width={size}
      height={size}
      className={className}
      style={{ borderRadius: "50%", objectFit: "cover" }}
      onError={(e) => { e.currentTarget.src = fallback; }}
      alt="avatar"
    />
  );
}