import { ImageResponse } from "next/og";
import { APP_CONFIG } from "@/lib/config";

export const runtime = "edge";

export const alt = APP_CONFIG.name;
export const size = {
    width: 1200,
    height: 630,
};

export const contentType = "image/png";

export default async function Image() {
    return new ImageResponse(
        (
            <div
                style={{
                    height: "100%",
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#0f172a",
                    backgroundImage: "linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #1e293b 100%)",
                }}
            >
                {/* Main card */}
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        padding: "60px 80px",
                        borderRadius: "32px",
                        border: "2px solid #334155",
                        backgroundColor: "rgba(30, 41, 59, 0.8)",
                    }}
                >
                    {/* Icon */}
                    <div style={{ fontSize: 120, marginBottom: 24 }}>👟</div>

                    {/* Branding */}
                    <div
                        style={{
                            display: "flex",
                            fontSize: 80,
                            fontWeight: 700,
                            marginBottom: 16,
                        }}
                    >
                        <span style={{ color: "#cbd5e1" }}>Step</span>
                        <span style={{ color: "#38bdf8" }}>League</span>
                    </div>

                    {/* Tagline */}
                    <div
                        style={{
                            fontSize: 32,
                            color: "#94a3b8",
                            textAlign: "center",
                            maxWidth: 800,
                        }}
                    >
                        {APP_CONFIG.tagline}
                    </div>
                </div>

                {/* Footer */}
                <div
                    style={{
                        position: "absolute",
                        bottom: 40,
                        fontSize: 24,
                        color: "#64748b",
                    }}
                >
                    stepleague.app
                </div>
            </div>
        ),
        {
            ...size,
        }
    );
}
