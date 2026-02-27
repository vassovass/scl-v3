import { Metadata } from "next";
import {
  Users,
  Trophy,
  BarChart3,
  Shield,
  Smartphone,
  Zap,
  ArrowRight,
  Heart,
  Target,
} from "lucide-react";
import { WaitlistForm } from "@/components/teams/WaitlistForm";

/**
 * B2B Landing Page — /teams
 *
 * Corporate wellness landing page with waitlist signup.
 * Targets HR managers searching for employee step challenges.
 *
 * PRD 34 — B2B Landing Pages
 */

export const metadata: Metadata = {
  title: "StepLeague for Teams — Corporate Wellness Step Challenges",
  description:
    "Boost employee wellness and team engagement with competitive step challenges. Easy setup, real-time leaderboards, and privacy-first design. Join the waitlist.",
  keywords: [
    "corporate wellness program",
    "employee step challenge",
    "team fitness challenge",
    "workplace wellness",
    "step counting competition",
  ],
  openGraph: {
    title: "StepLeague for Teams — Corporate Wellness Step Challenges",
    description:
      "Boost employee wellness with competitive step challenges. Real-time leaderboards, privacy-first.",
    type: "website",
    url: "/teams",
  },
};

const valueProps = [
  {
    icon: Trophy,
    title: "Boost Engagement",
    description:
      "Teams with step challenges see 40% higher wellness program participation through friendly competition.",
  },
  {
    icon: Heart,
    title: "Improve Health Outcomes",
    description:
      "Regular walking reduces sick days, improves focus, and lowers healthcare costs for your organization.",
  },
  {
    icon: Users,
    title: "Build Team Culture",
    description:
      "Cross-department leagues break silos. Remote and in-office teams connect through shared goals.",
  },
  {
    icon: Shield,
    title: "Privacy-First Design",
    description:
      "Screenshot-based verification means no health app permissions, no GPS tracking, no sensitive data.",
  },
];

const features = [
  { icon: BarChart3, title: "Real-time Leaderboards", description: "Live rankings with daily, weekly, and custom date ranges" },
  { icon: Users, title: "Multi-League Support", description: "Department leagues, company-wide challenges, cross-team competitions" },
  { icon: Smartphone, title: "Works with Any Device", description: "Apple Health, Fitbit, Garmin, Samsung Health — screenshot any step counter" },
  { icon: Zap, title: "AI Verification", description: "Automatic step count extraction from screenshots with anti-cheat detection" },
  { icon: Target, title: "Streak & Badges", description: "Daily streak tracking, milestone badges, and personal records" },
  { icon: Shield, title: "Admin Dashboard", description: "Manage leagues, view analytics, export reports — all from one panel" },
];

const steps = [
  { number: "1", title: "Create Your League", description: "Set up a league for your team in under 2 minutes. Invite members via link." },
  { number: "2", title: "Employees Submit Steps", description: "Team members screenshot their step counter daily. AI extracts the count automatically." },
  { number: "3", title: "Compete & Celebrate", description: "Watch leaderboards update in real-time. Share achievements and high-five teammates." },
];

export default function TeamsLandingPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="pt-24 pb-16 px-6 lg:px-8">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            Coming Soon — Join the Waitlist
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6">
            Team Step Challenges{" "}
            <span className="text-primary">That Drive Engagement</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Turn daily steps into friendly competition. Boost wellness, build team culture,
            and see real engagement — all with a privacy-first approach.
          </p>
          <div className="flex justify-center">
            <WaitlistForm source="teams-hero" />
          </div>
        </div>
      </section>

      {/* Value Props */}
      <section className="py-16 px-6 lg:px-8 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Why HR Teams Choose StepLeague
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {valueProps.map((prop) => (
              <div key={prop.title} className="bg-card rounded-lg border p-6">
                <div className="p-3 bg-primary/10 rounded-lg w-fit mb-4">
                  <prop.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{prop.title}</h3>
                <p className="text-sm text-muted-foreground">{prop.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">
            Everything You Need
          </h2>
          <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">
            Built for organizations of any size. From small teams to enterprise wellness programs.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div key={feature.title} className="flex gap-4 p-4 rounded-lg hover:bg-muted/30 transition-colors">
                <div className="flex-shrink-0 p-2 bg-muted rounded-lg h-fit">
                  <feature.icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-medium mb-1">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <a
              href="/teams/features"
              className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium"
            >
              See all features <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-6 lg:px-8 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step) => (
              <div key={step.number} className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground font-bold text-xl flex items-center justify-center mx-auto mb-4">
                  {step.number}
                </div>
                <h3 className="font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Get Your Team Moving?
          </h2>
          <p className="text-muted-foreground mb-8">
            Join the waitlist for early access. Be first to launch step challenges for your team.
          </p>
          <div className="flex justify-center">
            <WaitlistForm source="teams-cta" />
          </div>
        </div>
      </section>

      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: "StepLeague for Teams",
            description:
              "Corporate wellness step challenge platform with real-time leaderboards and AI verification.",
            brand: {
              "@type": "Organization",
              name: "StepLeague",
              url: "https://stepleague.com",
            },
            offers: {
              "@type": "Offer",
              availability: "https://schema.org/PreOrder",
              description: "Join the waitlist for early access",
            },
          }),
        }}
      />
    </div>
  );
}
