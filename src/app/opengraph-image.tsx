import { ImageResponse } from "next/og";
import { APP_CONFIG } from "@/lib/config";
import { OgTemplate } from "@/lib/og-template";

// NOTE: On Windows/Node builds, @vercel/og can throw "Invalid URL" during prerender.
// Using Edge runtime avoids that and keeps OG generation reliable.
export const runtime = "edge";

export const alt = APP_CONFIG.name;
export const size = {
    width: 1200,
    height: 630,
};

export const contentType = "image/png";

export default async function Image() {
    return new ImageResponse(
        <OgTemplate />,
        {
            ...size,
        }
    );
}

