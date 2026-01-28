/**
 * PlatformBadges Component
 *
 * Shows compatibility with various sharing platforms.
 * Visual grid demonstrating where share cards work.
 *
 * PRD-53 P-7: Platform compatibility badges grid
 */

import { MessageCircle, Twitter, Send, MessagesSquare, Facebook } from "lucide-react";

const PLATFORMS = [
    {
        name: "WhatsApp",
        icon: MessageCircle,
        color: "text-green-500",
        bg: "bg-green-500/10",
        description: "Beautiful link previews in chats",
    },
    {
        name: "X / Twitter",
        icon: Twitter,
        color: "text-sky-500",
        bg: "bg-sky-500/10",
        description: "Large image card format",
    },
    {
        name: "iMessage",
        icon: Send,
        color: "text-blue-500",
        bg: "bg-blue-500/10",
        description: "Rich preview bubbles",
    },
    {
        name: "Slack",
        icon: MessagesSquare,
        color: "text-purple-500",
        bg: "bg-purple-500/10",
        description: "Unfurled card embeds",
    },
    {
        name: "Facebook",
        icon: Facebook,
        color: "text-blue-600",
        bg: "bg-blue-600/10",
        description: "Full OG card support",
    },
    {
        name: "Discord",
        icon: MessagesSquare,
        color: "text-indigo-500",
        bg: "bg-indigo-500/10",
        description: "Embedded previews",
    },
];

export function PlatformBadges() {
    return (
        <section className="py-16">
            <div className="px-6 lg:px-8 max-w-5xl mx-auto">
                <div className="text-center mb-10">
                    <h3 className="text-xl font-bold mb-2">Works Everywhere</h3>
                    <p className="text-muted-foreground">
                        Beautiful previews on all major platforms
                    </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {PLATFORMS.map((platform) => (
                        <div
                            key={platform.name}
                            className="flex flex-col items-center p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors"
                        >
                            <div
                                className={`w-12 h-12 rounded-xl ${platform.bg} ${platform.color} flex items-center justify-center mb-3`}
                            >
                                <platform.icon className="w-6 h-6" />
                            </div>
                            <span className="font-medium text-sm">{platform.name}</span>
                            <span className="text-xs text-muted-foreground text-center mt-1">
                                {platform.description}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
