/**
 * RSS Feed for Roadmap Updates
 * 
 * Generates an RSS 2.0 feed of recently shipped features.
 * Users can subscribe to get notified when features are completed.
 * 
 * GET /api/roadmap/rss
 * 
 * @module api/roadmap/rss
 */

import { createAdminClient } from "@/lib/supabase/server";
import { APP_CONFIG } from "@/lib/config";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://stepleague.app";

export async function GET() {
    const adminClient = createAdminClient();

    // Fetch recently completed roadmap items
    const { data: items, error } = await adminClient
        .from("feedback")
        .select(`
            id,
            type,
            subject,
            description,
            completed_at,
            created_at
        `)
        .eq("is_public", true)
        .eq("board_status", "done")
        .not("completed_at", "is", null)
        .order("completed_at", { ascending: false })
        .limit(50);

    if (error) {
        console.error("RSS feed error:", error);
        return new Response("Error generating RSS feed", { status: 500 });
    }

    const feedItems = (items || []).map((item: any) => {
        const pubDate = item.completed_at
            ? new Date(item.completed_at).toUTCString()
            : new Date(item.created_at).toUTCString();

        const typeEmojiMap: Record<string, string> = {
            bug: "🐛",
            feature: "✨",
            improvement: "📈",
            general: "💬",
        };
        const typeEmoji = typeEmojiMap[item.type] || "📋";

        return `
    <item>
      <title>${escapeXml(`${typeEmoji} ${item.subject}`)}</title>
      <link>${BASE_URL}/roadmap</link>
      <description><![CDATA[${item.description || "No description provided."}]]></description>
      <pubDate>${pubDate}</pubDate>
      <guid isPermaLink="false">${item.id}</guid>
      <category>${item.type}</category>
    </item>`;
    }).join("\n");

    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${APP_CONFIG.name} - Shipped Features</title>
    <link>${BASE_URL}/roadmap</link>
    <description>Recently shipped features and improvements from ${APP_CONFIG.name}. Subscribe to stay updated!</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${BASE_URL}/api/roadmap/rss" rel="self" type="application/rss+xml"/>
    <image>
      <url>${BASE_URL}/icon-192.png</url>
      <title>${APP_CONFIG.name}</title>
      <link>${BASE_URL}</link>
    </image>
${feedItems}
  </channel>
</rss>`;

    return new Response(rss, {
        headers: {
            "Content-Type": "application/rss+xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600, s-maxage=3600", // Cache for 1 hour
        },
    });
}

/**
 * Escape special XML characters
 */
function escapeXml(str: string): string {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}
