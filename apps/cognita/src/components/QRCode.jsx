import React from "react";
import { getQrCodeUrl } from "@/lib/business-utils";

export default function QRCode({ data, size = 128, className = "" }) {
  if (!data) return null;
  const url = getQrCodeUrl(data, size);
  return (
    <img
      src={url}
      alt="QR Code"
      width={size}
      height={size}
      className={className}
      style={{ imageRendering: "pixelated" }}
    />
  );
}