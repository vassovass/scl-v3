import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
    const { searchParams } = request.nextUrl;

    const leagueName = searchParams.get("name") || "Step Counter League";
    const members = searchParams.get("members") || "?";

    // Truncate long league names
    const displayName = leagueName.length > 30
        ? leagueName.substring(0, 30) + "..."
        : leagueName;

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
                        width: "80%",
                        textAlign: "center",
                    }}
                >
                    {/* Icon */}
                    <div style={{ fontSize: 80, marginBottom: 24 }}>✉️</div>

                    {/* Invite Text */}
                    <div
                        style={{
                            fontSize: 32,
                            color: "#94a3b8",
                            marginBottom: 16,
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            fontWeight: 600,
                        }}
                    >
                        You've been invited to join
                    </div>

                    {/* League Name */}
                    <div
                        style={{
                            fontSize: 64,
                            fontWeight: 800,
                            marginBottom: 32,
                            lineHeight: 1.1,
                            backgroundImage: "linear-gradient(to bottom right, #ffffff, #94a3b8)",
                            backgroundClip: "text",
                            color: "transparent",
                        }}
                    >
                        {displayName}
                    </div>

                    {/* Stats */}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            padding: "16px 32px",
                            borderRadius: "999px",
                            backgroundColor: "rgba(14, 165, 233, 0.1)",
                            border: "1px solid rgba(14, 165, 233, 0.3)",
                        }}
                    >
                        <div style={{ fontSize: 24, marginRight: 8 }}>👥</div>
                        <div
                            style={{
                                fontSize: 24,
                                color: "#38bdf8",
                                fontWeight: 700,
                            }}
                        >
                            {members} members
                        </div>
                    </div>
                </div>

                {/* Branding */}
                <div
                    style={{
                        display: "flex",
                        marginTop: 40,
                        fontSize: 28,
                        color: "#94a3b8",
                    }}
                >
                    <span style={{ color: "#cbd5e1" }}>Step</span>
                    <span style={{ color: "#38bdf8" }}>Count</span>
                    <span style={{ color: "#cbd5e1" }}>League</span>
                </div>
            </div>
        ),
        {
            width: 1200,
            height: 630,
        }
    );
}
