import Link from "next/link";
import { Footprints, Camera, Trophy, Users, ShieldCheck, Globe, Zap } from "lucide-react";

export const metadata = {
    title: "How It Works - StepLeague",
    description: "Learn how StepLeague verifies your steps and helps you compete fairly.",
};

export default function HowItWorksPage() {
    return (
        <div className="min-h-screen pt-24 pb-16 bg-background">
            {/* SECTION 1: THE LOOP */}
            <section className="px-6 lg:px-8 max-w-6xl mx-auto mb-24">
                <div className="text-center mb-16">
                    <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-6">
                        How StepLeague Works
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        A simple, fair way to compete with anyone, regardless of what fitness tracker they use.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-12 relative">
                    {/* Connecting Line (Desktop) */}
                    <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-sky-500/20 via-purple-500/20 to-sky-500/20" />

                    <StepCard
                        number="1"
                        icon={Footprints}
                        title="Walk & Track"
                        description="Use your favorite app (Apple Health, Google Fit, Garmin, etc.) to track your daily steps. Just keep moving!"
                        color="text-primary"
                        bg="bg-primary/10"
                    />
                    <StepCard
                        number="2"
                        icon={Camera}
                        title="Snap & Upload"
                        description="Take a screenshot of your daily summary. Upload it to StepLeague in seconds."
                        color="text-purple-400"
                        bg="bg-purple-500/10"
                    />
                    <StepCard
                        number="3"
                        icon={Trophy}
                        title="Rank & Celebrate"
                        description="Our AI verifies your steps valid instantly. Watch your climb the leaderboard and earn badges."
                        color="text-amber-400"
                        bg="bg-amber-500/10"
                    />
                </div>
            </section>

            {/* SECTION 2: FAIR PLAY */}
            <section className="bg-muted/30 py-24">
                <div className="px-6 lg:px-8 max-w-5xl mx-auto">
                    <div className="bg-card border border-border rounded-3xl p-8 lg:p-12 flex flex-col md:flex-row items-center gap-12">
                        <div className="flex-1">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-sm font-semibold mb-6">
                                <ShieldCheck className="w-4 h-4" />
                                <span>Fair Play Guarantee</span>
                            </div>
                            <h2 className="text-3xl font-bold mb-4">No Cheating. Just Walking.</h2>
                            <p className="text-lg text-muted-foreground mb-6">
                                In typical challenges, people can manually type in "50,000 steps". Not here.
                            </p>
                            <p className="text-lg text-muted-foreground">
                                Our AI analyzes every screenshot to verify the date, step count, and source app. We assume good intentions, but we verify everything to keep execution fair for everyone.
                            </p>
                        </div>
                        <div className="flex-shrink-0 relative w-full md:w-80 aspect-square bg-card rounded-2xl flex items-center justify-center border border-border shadow-2xl">
                            {/* Abstract visual of scanning */}
                            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent rounded-2xl" />
                            <Camera className="w-24 h-24 text-muted-foreground" />
                            <div className="absolute inset-x-0 top-1/2 h-1 bg-green-500/50 shadow-[0_0_20px_rgba(34,197,94,0.5)] animate-pulse" />
                            <div className="absolute bottom-8 bg-muted px-4 py-2 rounded-lg text-green-400 font-mono text-sm border border-border">
                                Verified: 10,432 steps
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* SECTION 3: LEAGUES vs GLOBAL */}
            <section className="px-6 lg:px-8 max-w-6xl mx-auto py-24">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold">Two Ways to Compete</h2>
                </div>
                <div className="grid md:grid-cols-2 gap-8">
                    <ModeCard
                        icon={Globe}
                        title="Global Leaderboard"
                        subtitle="The World Stage"
                        description="Automatically entered. Compare yourself against every user on the platform. Great for seeing where you stand among the top 1%."
                    />
                    <ModeCard
                        icon={Users}
                        title="Private Leagues"
                        subtitle="Your Circle"
                        description="Create a league for your friends, family, or office. Invite-only. Focus on connection and friendly banter away from the crowds."
                        highlight
                    />
                </div>

                <div className="mt-16 text-center">
                    <Link
                        href="/sign-up"
                        className="inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-primary-foreground bg-gradient-brand-primary rounded-full hover:scale-105 transition-transform glow-primary"
                    >
                        Start Your Journey
                    </Link>
                </div>
            </section>
        </div>
    );
}

function StepCard({ number, icon: Icon, title, description, color, bg }: any) {
    return (
        <div className="relative flex flex-col items-center text-center p-6 bg-card border border-border rounded-2xl z-10">
            <div className={`w-16 h-16 rounded-2xl ${bg} ${color} flex items-center justify-center mb-6`}>
                <Icon className="w-8 h-8" />
            </div>
            <div className="absolute -top-4 -right-4 w-12 h-12 bg-background border border-border rounded-full flex items-center justify-center font-bold text-xl text-muted-foreground shadow-sm">
                {number}
            </div>
            <h3 className="text-xl font-bold mb-3">{title}</h3>
            <p className="text-muted-foreground">{description}</p>
        </div>
    )
}

function ModeCard({ icon: Icon, title, subtitle, description, highlight }: any) {
    return (
        <div className={`p-8 rounded-3xl border ${highlight ? 'border-primary/50 bg-primary/5' : 'border-border bg-card'}`}>
            <div className="flex items-center gap-4 mb-4">
                <div className={`p-3 rounded-xl ${highlight ? 'bg-primary/20 text-primary' : 'bg-muted text-foreground'}`}>
                    <Icon className="w-8 h-8" />
                </div>
                <div>
                    <h3 className="text-2xl font-bold">{title}</h3>
                    <p className={`font-medium ${highlight ? 'text-primary' : 'text-muted-foreground'}`}>{subtitle}</p>
                </div>
            </div>
            <p className="text-lg text-muted-foreground leading-relaxed">
                {description}
            </p>
        </div>
    )
}

