import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "agentdocs — fresh, verified docs for MCP servers & Claude agents";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: "#faf9f6",
          padding: "80px",
          fontFamily: "monospace",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: "#3f7a4f" }} />
          <div style={{ fontSize: 52, fontWeight: 700, color: "#1b1a16" }}>agentdocs</div>
        </div>
        <div style={{ marginTop: 36, fontSize: 40, lineHeight: 1.25, color: "#48463e", maxWidth: 920 }}>
          Fresh, source-verified docs for building MCP servers and Claude agents — served to your AI coding assistant.
        </div>
        <div style={{ marginTop: 40, fontSize: 24, color: "#8c897e" }}>Local · Free · No account</div>
      </div>
    ),
    size,
  );
}
