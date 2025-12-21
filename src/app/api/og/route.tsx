import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
    const { searchParams } = request.nextUrl;

    const rank = parseInt(searchParams.get("rank") || "1");
    const steps = parseInt(searchParams.get("steps") || "0");
    const name = searchParams.get("name") || "Player";
    const period = searchParams.get("period") || "this week";
    const emoji = searchParams.get("emoji") || "🏆";
    const improvement = searchParams.get("improvement");
    const customTitle = searchParams.get("title");

    // Rank display
    let rankText = customTitle || `#${rank}`;
    let rankColor = "#38bdf8"; // sky-400

    if (customTitle) {
        rankColor = "#38bdf8"; // sky-400 (default)
        if (customTitle.includes("Personal Best")) rankColor = "#c084fc"; // purple-400
    } else if (rank === 1) {
        rankText = "1st Place!";
        rankColor = "#facc15"; // yellow-400
    } else if (rank === 2) {
        rankText = "2nd Place!";
        rankColor = "#cbd5e1"; // slate-300
    } else if (rank === 3) {
        rankText = "3rd Place!";
        rankColor = "#d97706"; // amber-600
    }

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
                    {/* Emoji */}
                    <div style={{ fontSize: 100, marginBottom: 16 }}>{emoji}</div>

                    {/* Rank */}
                    <div
                        style={{
                            fontSize: 56,
                            fontWeight: 700,
                            color: rankColor,
                            marginBottom: 8,
                        }}
                    >
                        {rankText}
                    </div>

                    {/* Name */}
                    <div
                        style={{
                            fontSize: 32,
                            color: "#cbd5e1",
                            marginBottom: 32,
                        }}
                    >
                        {name}
                    </div>

                    {/* Steps box */}
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            padding: "32px 64px",
                            borderRadius: "16px",
                            backgroundImage: "linear-gradient(135deg, rgba(14, 165, 233, 0.2) 0%, rgba(16, 185, 129, 0.2) 100%)",
                            border: "1px solid rgba(14, 165, 233, 0.3)",
                        }}
                    >
                        <div
                            style={{
                                fontSize: 64,
                                fontWeight: 700,
                                color: "#ffffff",
                            }}
                        >
                            {steps.toLocaleString()}
                        </div>
                        <div
                            style={{
                                fontSize: 24,
                                color: "#94a3b8",
                                marginTop: 8,
                            }}
                        >
                            steps {period}
                        </div>
                    </div>

                    {/* Improvement badge */}
                    {improvement && (
                        <div
                            style={{
                                display: "flex",
                                marginTop: 24,
                                padding: "12px 24px",
                                borderRadius: "999px",
                                backgroundColor: "rgba(16, 185, 129, 0.2)",
                                color: "#34d399",
                                fontSize: 20,
                            }}
                        >
                            📈 +{improvement}% improvement!
                        </div>
                    )}
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
