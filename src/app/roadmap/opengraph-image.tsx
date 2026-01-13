import { ImageResponse } from "next/og";
import { OgTemplate } from "@/lib/og-template";

// NOTE: On Windows/Node builds, @vercel/og can throw "Invalid URL" during prerender.
// Using Edge runtime avoids that and keeps OG generation reliable.
export const runtime = "edge";

export const alt = "Roadmap | StepLeague";
export const size = {
    width: 1200,
    height: 630,
};

export const contentType = "image/png";

export default async function Image() {
    return new ImageResponse(
        <OgTemplate
            title="Roadmap"
            subtitle="Vote on features to help us prioritize!"
            showBrand={false}
        />,
        {
            ...size,
        }
    );
}
