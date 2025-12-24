import { APP_CONFIG } from "@/lib/config";

interface OgTemplateProps {
    title?: string;
    subtitle?: string;
    showBrand?: boolean;
}

export function OgTemplate({
    title = APP_CONFIG.name,
    subtitle = APP_CONFIG.tagline,
    showBrand = true,
}: OgTemplateProps) {
    return (
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
                    justifyContent: "center", // Center vertically if less content
                    padding: "60px 80px",
                    borderRadius: "32px",
                    border: "2px solid #334155",
                    backgroundColor: "rgba(30, 41, 59, 0.8)",
                    minWidth: "800px", // Ensure consistent width
                    minHeight: "400px",
                }}
            >
                {/* Icon if it's the main brand or if we want it */}
                {/* We can make icon configurable but keeping it simple for now */}
                {showBrand && <div style={{ fontSize: 120, marginBottom: 24 }}>👟</div>}

                {/* Title */}
                <div
                    style={{
                        display: "flex",
                        fontSize: showBrand ? 80 : 96, // Larger title if not brand
                        fontWeight: 700,
                        marginBottom: 16,
                        textAlign: "center",
                        color: "#f8fafc",
                    }}
                >
                    {title === APP_CONFIG.name ? (
                        <>
                            <span style={{ color: "#cbd5e1" }}>Step</span>
                            <span style={{ color: "#38bdf8" }}>League</span>
                        </>
                    ) : (
                        title
                    )}
                </div>

                {/* Subtitle / Tagline */}
                {subtitle && (
                    <div
                        style={{
                            fontSize: 32,
                            color: "#94a3b8",
                            textAlign: "center",
                            maxWidth: 800,
                        }}
                    >
                        {subtitle}
                    </div>
                )}
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
    );
}
