import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Sprintify — The Hybrid Project Management Platform";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 40%, #312e81 70%, #1e1b4b 100%)",
          color: "#fff",
          fontFamily: "system-ui, sans-serif",
          padding: "60px 80px",
        }}
      >
        {/* Top accent line */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: "linear-gradient(90deg, #6366f1, #8b5cf6, #a78bfa, #6366f1)",
          }}
        />

        {/* Logo area */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 48,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 44,
              height: 44,
              borderRadius: 10,
              background: "#6366f1",
              fontSize: 24,
            }}
          >
            &#9889;
          </div>
          <span
            style={{
              fontSize: 28,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: "#c7d2fe",
            }}
          >
            Sprintify
          </span>
        </div>

        {/* Main headline */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          <h1
            style={{
              fontSize: 64,
              fontWeight: 800,
              lineHeight: 1.1,
              margin: 0,
              letterSpacing: "-0.03em",
              background: "linear-gradient(to right, #e0e7ff, #ffffff, #c7d2fe)",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            Agile Speed.
          </h1>
          <h1
            style={{
              fontSize: 64,
              fontWeight: 800,
              lineHeight: 1.1,
              margin: 0,
              letterSpacing: "-0.03em",
              background: "linear-gradient(to right, #a78bfa, #818cf8, #6366f1)",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            Waterfall Control.
          </h1>
        </div>

        {/* Subtext */}
        <p
          style={{
            fontSize: 24,
            color: "#94a3b8",
            marginTop: 28,
            fontWeight: 400,
            letterSpacing: "-0.01em",
          }}
        >
          The All-in-One Hybrid Project Management Platform
        </p>

        {/* Feature pills */}
        <div
          style={{
            display: "flex",
            gap: 16,
            marginTop: 40,
          }}
        >
          {["Gantt Charts", "Scrum Boards", "WSJF Scoring", "Planning Poker"].map(
            (label) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "8px 20px",
                  borderRadius: 99,
                  border: "1px solid rgba(99, 102, 241, 0.4)",
                  background: "rgba(99, 102, 241, 0.1)",
                  fontSize: 14,
                  fontWeight: 500,
                  color: "#c7d2fe",
                }}
              >
                {label}
              </div>
            ),
          )}
        </div>

        {/* Bottom domain */}
        <p
          style={{
            position: "absolute",
            bottom: 32,
            fontSize: 16,
            color: "#475569",
            fontWeight: 500,
          }}
        >
          sprintify.org
        </p>
      </div>
    ),
    { ...size },
  );
}
