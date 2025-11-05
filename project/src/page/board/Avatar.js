// src/components/Avatar.js
import { useEffect, useState, memo } from "react";
import { API_SERVER_HOST } from "../../api/userApi";

const toAbs = (u) => (!u ? u : u.startsWith("http") ? u : `${API_SERVER_HOST}${u}`);

function Avatar({ src, size = 32, alt = "avatar", className = "" }) {
  const [imgSrc, setImgSrc] = useState("/default-profile.png");

  useEffect(() => {
    // src가 바뀔 때만 원본 시도
    const next = toAbs(src) || "/default-profile.png";
    setImgSrc(next);
  }, [src]);

  return (
    <img
      src={imgSrc}
      alt={alt}
      width={size}
      height={size}
      className={className}
      style={{ borderRadius: "50%", objectFit: "cover" }}
      onError={() => setImgSrc("/default-profile.png")} // 한 번 떨어지면 state가 유지됨
      loading="lazy"
    />
  );
}

export default memo(Avatar);