import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

// PRD-56: Edge Runtime required for ImageResponse to properly render images.
// Without this, images return 0x0 dimensions on Node.js runtime.
export const runtime = "edge";

// ============================================================================
// Metric Configurations (inline to avoid edge runtime issues with imports)
// ============================================================================

type MetricType = 'steps' | 'calories' | 'slp' | 'distance' | 'swimming' | 'cycling' | 'running';
type CardType = 'daily' | 'weekly' | 'personal_best' | 'streak' | 'rank' | 'challenge' | 'rank_change' | 'custom_period';

interface MetricStyle {
    emoji: string;
    unit: string;
    gradientFrom: string;
    gradientTo: string;
    borderColor: string;
}

const METRIC_STYLES: Record<MetricType, MetricStyle> = {
    steps: {
        emoji: '🚶',
        unit: 'steps',
        gradientFrom: 'rgba(14, 165, 233, 0.2)',  // sky
        gradientTo: 'rgba(16, 185, 129, 0.2)',    // emerald
        borderColor: 'rgba(14, 165, 233, 0.3)',
    },
    calories: {
        emoji: '🔥',
        unit: 'kcal',
        gradientFrom: 'rgba(249, 115, 22, 0.2)',  // orange
        gradientTo: 'rgba(239, 68, 68, 0.2)',     // red
        borderColor: 'rgba(249, 115, 22, 0.3)',
    },
    slp: {
        emoji: '⚡',
        unit: 'SLP',
        gradientFrom: 'rgba(168, 85, 247, 0.2)',  // purple
        gradientTo: 'rgba(236, 72, 153, 0.2)',    // pink
        borderColor: 'rgba(168, 85, 247, 0.3)',
    },
    distance: {
        emoji: '📍',
        unit: 'km',
        gradientFrom: 'rgba(20, 184, 166, 0.2)',  // teal
        gradientTo: 'rgba(6, 182, 212, 0.2)',     // cyan
        borderColor: 'rgba(20, 184, 166, 0.3)',
    },
    swimming: {
        emoji: '🏊',
        unit: 'laps',
        gradientFrom: 'rgba(59, 130, 246, 0.2)',  // blue
        gradientTo: 'rgba(99, 102, 241, 0.2)',    // indigo
        borderColor: 'rgba(59, 130, 246, 0.3)',
    },
    cycling: {
        emoji: '🚴',
        unit: 'km',
        gradientFrom: 'rgba(132, 204, 22, 0.2)',  // lime
        gradientTo: 'rgba(34, 197, 94, 0.2)',     // green
        borderColor: 'rgba(132, 204, 22, 0.3)',
    },
    running: {
        emoji: '🏃',
        unit: 'km',
        gradientFrom: 'rgba(244, 63, 94, 0.2)',   // rose
        gradientTo: 'rgba(249, 115, 22, 0.2)',    // orange
        borderColor: 'rgba(244, 63, 94, 0.3)',
    },
};

// Card type specific configurations
const CARD_TYPE_STYLES: Record<CardType, { title: string; color: string }> = {
    daily: { title: "Today's Achievement", color: '#38bdf8' },
    weekly: { title: "Weekly Total", color: '#38bdf8' },
    personal_best: { title: "New Personal Best!", color: '#c084fc' },
    streak: { title: "Streak!", color: '#f97316' },
    rank: { title: "Ranked", color: '#38bdf8' },
    challenge: { title: "Challenge", color: '#10b981' },
    rank_change: { title: "Rank Up!", color: '#22c55e' },
    custom_period: { title: "Custom Period", color: '#a855f7' },
};

// Theme configurations
interface ThemeConfig {
    background: string;
    backgroundGradient: string;
    cardBg: string;
    cardBorder: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
}

const THEMES: Record<'light' | 'dark', ThemeConfig> = {
    dark: {
        background: '#0f172a',
        backgroundGradient: 'linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #1e293b 100%)',
        cardBg: 'rgba(30, 41, 59, 0.8)',
        cardBorder: '#334155',
        textPrimary: '#ffffff',
        textSecondary: '#cbd5e1',
        textMuted: '#94a3b8',
    },
    light: {
        background: '#f8fafc',
        backgroundGradient: 'linear-gradient(135deg, #e2e8f0 0%, #f8fafc 50%, #e2e8f0 100%)',
        cardBg: 'rgba(255, 255, 255, 0.9)',
        cardBorder: '#cbd5e1',
        textPrimary: '#0f172a',
        textSecondary: '#334155',
        textMuted: '#64748b',
    },
};

// ============================================================================
// Helper Functions
// ============================================================================

function getRankText(rank: number, customTitle?: string | null): { text: string; color: string } {
    if (customTitle) {
        let color = '#38bdf8'; // default sky-400
        if (customTitle.includes('Personal Best')) color = '#c084fc'; // purple
        if (customTitle.includes('Streak')) color = '#f97316'; // orange
        if (customTitle.includes('Challenge')) color = '#10b981'; // emerald
        return { text: customTitle, color };
    }

    switch (rank) {
        case 1:
            return { text: '1st Place!', color: '#facc15' }; // yellow
        case 2:
            return { text: '2nd Place!', color: '#cbd5e1' }; // slate
        case 3:
            return { text: '3rd Place!', color: '#d97706' }; // amber
        default:
            return { text: `#${rank}`, color: '#38bdf8' }; // sky
    }
}

function formatValue(value: number, metricType: MetricType): string {
    if (metricType === 'distance' || metricType === 'cycling' || metricType === 'running') {
        return value.toFixed(1);
    }
    return value.toLocaleString();
}

// ============================================================================
// Route Handler
// ============================================================================

export async function GET(request: NextRequest) {
    const startTime = Date.now();
    console.log('[OG Image] Request received:', request.nextUrl.toString());

    try {
        const { searchParams } = request.nextUrl;

        // Log all parameters for debugging
        console.log('[OG Image] Parameters:', {
            card_type: searchParams.get("card_type"),
            value: searchParams.get("value") || searchParams.get("steps"),
            metric_type: searchParams.get("metric_type"),
            name: searchParams.get("name"),
            theme: searchParams.get("theme"),
            rank: searchParams.get("rank"),
        });

        // Parse parameters with backwards compatibility
        const rank = parseInt(searchParams.get("rank") || "1");
        const value = parseInt(searchParams.get("steps") || searchParams.get("value") || "0");
        const name = searchParams.get("name") || "Player";
        const period = searchParams.get("period") || "this week";
        const customEmoji = searchParams.get("emoji");
        const improvement = searchParams.get("improvement");
        const customTitle = searchParams.get("title");
        const leagueName = searchParams.get("league");

        // New PRD-51 parameters
        const metricType = (searchParams.get("metric_type") || 'steps') as MetricType;
        const cardType = searchParams.get("card_type") as CardType | null;
        const theme = (searchParams.get("theme") || 'dark') as 'light' | 'dark';
        const oldRank = searchParams.get("old_rank");
        const streakDays = searchParams.get("streak_days");

        // PRD-54: Custom period parameters
        const periodStart = searchParams.get("period_start");
        const periodEnd = searchParams.get("period_end");

        // Get configurations
        const metricStyle = METRIC_STYLES[metricType] || METRIC_STYLES.steps;
        const themeConfig = THEMES[theme] || THEMES.dark;
        const emoji = customEmoji || metricStyle.emoji;

        // Determine title and color
        let titleText: string;
        let titleColor: string;

        if (cardType) {
            const cardStyle = CARD_TYPE_STYLES[cardType] || CARD_TYPE_STYLES.daily;

            // Build title based on card type
            if (cardType === 'rank' && rank) {
                const rankInfo = getRankText(rank, customTitle);
                titleText = rankInfo.text;
                titleColor = rankInfo.color;
            } else if (cardType === 'rank_change' && oldRank) {
                titleText = `#${oldRank} → #${rank}`;
                titleColor = '#22c55e'; // green
            } else if (cardType === 'streak' && streakDays) {
                titleText = `${streakDays} Day Streak!`;
                titleColor = '#f97316'; // orange
            } else if (cardType === 'challenge') {
                titleText = 'Can you beat this?';
                titleColor = '#10b981'; // emerald
            } else if (cardType === 'custom_period') {
                // PRD-54: Custom period card uses the period label as title
                titleText = customTitle || 'Custom Period';
                titleColor = '#a855f7'; // purple
            } else if (customTitle) {
                titleText = customTitle;
                titleColor = cardStyle.color;
            } else {
                titleText = cardStyle.title;
                titleColor = cardStyle.color;
            }
        } else {
            // Backwards compatibility: use rank-based logic
            const rankInfo = getRankText(rank, customTitle);
            titleText = rankInfo.text;
            titleColor = rankInfo.color;
        }

        // Format the value
        const formattedValue = formatValue(value, metricType);
        const unit = metricStyle.unit;

        console.log('[OG Image] Generating image with:', {
            titleText,
            titleColor,
            formattedValue,
            unit,
            emoji,
            theme,
        });

        const response = new ImageResponse(
            (
                <div
                    style={{
                        height: "100%",
                        width: "100%",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: themeConfig.background,
                        backgroundImage: themeConfig.backgroundGradient,
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
                            border: `2px solid ${themeConfig.cardBorder}`,
                            backgroundColor: themeConfig.cardBg,
                        }}
                    >
                        {/* Emoji */}
                        <div style={{ fontSize: 100, marginBottom: 16 }}>{emoji}</div>

                        {/* Title (rank/card type) */}
                        <div
                            style={{
                                fontSize: 56,
                                fontWeight: 700,
                                color: titleColor,
                                marginBottom: 8,
                            }}
                        >
                            {titleText}
                        </div>

                        {/* Name */}
                        <div
                            style={{
                                fontSize: 32,
                                color: themeConfig.textSecondary,
                                marginBottom: leagueName ? 8 : 32,
                            }}
                        >
                            {name}
                        </div>

                        {/* League name (if provided) */}
                        {leagueName && (
                            <div
                                style={{
                                    fontSize: 24,
                                    color: themeConfig.textMuted,
                                    marginBottom: 32,
                                }}
                            >
                                in {leagueName}
                            </div>
                        )}

                        {/* Value box */}
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                padding: "32px 64px",
                                borderRadius: "16px",
                                backgroundImage: `linear-gradient(135deg, ${metricStyle.gradientFrom} 0%, ${metricStyle.gradientTo} 100%)`,
                                border: `1px solid ${metricStyle.borderColor}`,
                            }}
                        >
                            <div
                                style={{
                                    fontSize: 64,
                                    fontWeight: 700,
                                    color: themeConfig.textPrimary,
                                }}
                            >
                                {formattedValue}
                            </div>
                            <div
                                style={{
                                    fontSize: 24,
                                    color: themeConfig.textMuted,
                                    marginTop: 8,
                                }}
                            >
                                {unit} {period}
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
                                📈 +{improvement}% vs last period
                            </div>
                        )}
                    </div>

                    {/* Branding */}
                    <div
                        style={{
                            display: "flex",
                            marginTop: 40,
                            fontSize: 28,
                            color: themeConfig.textMuted,
                        }}
                    >
                        <span style={{ color: themeConfig.textSecondary }}>Step</span>
                        <span style={{ color: "#38bdf8" }}>League</span>
                    </div>
                </div>
            ),
            {
                width: 1200,
                height: 630,
            }
        );

        console.log('[OG Image] Generated successfully in', Date.now() - startTime, 'ms');
        return response;
    } catch (error) {
        console.error('[OG Image] Error generating image:', error);
        console.error('[OG Image] Stack:', error instanceof Error ? error.stack : 'No stack');
        // Return a simple error image instead of failing silently
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
                        color: "#ef4444",
                        fontSize: 32,
                    }}
                >
                    <div>Failed to generate image</div>
                    <div style={{ fontSize: 18, color: "#94a3b8", marginTop: 10 }}>
                        Please try again
                    </div>
                </div>
            ),
            {
                width: 1200,
                height: 630,
            }
        );
    }
}
