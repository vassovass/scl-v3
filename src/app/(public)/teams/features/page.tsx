import { Metadata } from "next";
import {
  BarChart3,
  Users,
  Smartphone,
  Zap,
  Target,
  Shield,
  Globe,
  Calendar,
  Award,
  Bell,
  Download,
  Settings,
} from "lucide-react";
import Link from "next/link";

/**
 * B2B Features Directory — /teams/features
 *
 * Detailed feature list organized by use case for HR buyers.
 *
 * PRD 34 — B2B Landing Pages
 */

export const metadata: Metadata = {
  title: "Features — StepLeague for Teams",
  description:
    "Explore StepLeague's team wellness features: leaderboards, AI verification, multi-league support, admin dashboard, analytics, and more.",
  openGraph: {
    title: "Features — StepLeague for Teams",
    description:
      "Everything you need to run engaging corporate step challenges.",
    type: "website",
    url: "/teams/features",
  },
};

interface Feature {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

interface FeatureCategory {
  title: string;
  description: string;
  features: Feature[];
}

const categories: FeatureCategory[] = [
  {
    title: "Competition & Engagement",
    description: "Keep teams motivated with friendly competition",
    features: [
      { icon: BarChart3, title: "Real-time Leaderboards", description: "Live rankings updated as submissions come in. Daily, weekly, and custom date ranges." },
      { icon: Users, title: "Multi-League Support", description: "Run department leagues, company-wide challenges, and cross-team competitions simultaneously." },
      { icon: Target, title: "Streaks & Badges", description: "Daily streak tracking, milestone celebrations, and shareable achievement badges." },
      { icon: Award, title: "High-Fives", description: "Social encouragement — teammates can send high-fives to celebrate achievements." },
    ],
  },
  {
    title: "Verification & Trust",
    description: "Fair competition with privacy-first verification",
    features: [
      { icon: Zap, title: "AI Step Extraction", description: "Gemini AI automatically reads step counts from screenshots — no manual entry needed." },
      { icon: Smartphone, title: "Any Device, Any App", description: "Apple Health, Fitbit, Garmin, Samsung Health, Google Fit — screenshot any step counter." },
      { icon: Shield, title: "Privacy-First Design", description: "No health app permissions, no GPS tracking, no sensitive data collected." },
      { icon: Globe, title: "World League", description: "Auto-enrolled global leaderboard with anonymous nicknames for cross-company benchmarking." },
    ],
  },
  {
    title: "Admin & Management",
    description: "Tools for HR managers and team leads",
    features: [
      { icon: Settings, title: "Admin Dashboard", description: "Manage leagues, view platform analytics, configure settings — all from one panel." },
      { icon: Download, title: "Data Export", description: "Export analytics as CSV. KPIs, trends, and league breakdowns at your fingertips." },
      { icon: Bell, title: "Engagement Prompts", description: "Smart reminders for missed days and streak warnings keep participation high." },
      { icon: Calendar, title: "Batch Submissions", description: "Submit multiple days at once — perfect for catching up after weekends or holidays." },
    ],
  },
];

export default function TeamsFeaturesPage() {
  return (
    <div className="min-h-screen pt-24 pb-16 px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
            Features Built for{" "}
            <span className="text-primary">Teams</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to run engaging, fair, and fun step challenges for your organization.
          </p>
        </div>

        {/* Feature Categories */}
        <div className="space-y-16">
          {categories.map((category) => (
            <section key={category.title}>
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-2">{category.title}</h2>
                <p className="text-muted-foreground">{category.description}</p>
              </div>
              <div className="grid sm:grid-cols-2 gap-6">
                {category.features.map((feature) => (
                  <div
                    key={feature.title}
                    className="flex gap-4 p-5 bg-card rounded-lg border hover:border-primary/30 transition-colors"
                  >
                    <div className="flex-shrink-0 p-2.5 bg-primary/10 rounded-lg h-fit">
                      <feature.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold mb-1">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 text-center p-8 bg-muted/30 rounded-xl border">
          <h2 className="text-2xl font-bold mb-3">
            Ready to get started?
          </h2>
          <p className="text-muted-foreground mb-6">
            Join the waitlist for early access to StepLeague for Teams.
          </p>
          <Link
            href="/teams"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
          >
            Join the Waitlist
          </Link>
        </div>
      </div>
    </div>
  );
}
