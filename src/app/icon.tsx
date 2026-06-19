import { ImageResponse } from "next/og";

// Favicon gerado dinamicamente (sem asset binário no repo). Next serve em /icon.
export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0b0f14",
          color: "#34d399",
          fontSize: 40,
          fontWeight: 800,
          fontFamily: "sans-serif",
          borderRadius: 12,
        }}
      >
        R
      </div>
    ),
    { ...size },
  );
}
