import Link from "next/link";

export default function BetaNoticePage() {
    return (
        <main className="min-h-screen bg-slate-950 text-slate-300">
            <div className="mx-auto max-w-3xl px-6 py-12">
                <Link href="/" className="text-sm text-sky-400 hover:text-sky-300">← Back to Home</Link>

                <div className="mt-8 rounded-xl border border-amber-600/30 bg-amber-900/10 p-6">
                    <div className="flex items-center gap-3">
                        <span className="text-3xl">🚧</span>
                        <div>
                            <h1 className="text-2xl font-bold text-amber-400">Early Access (Beta)</h1>
                            <p className="text-amber-200/80">This application is currently in beta testing</p>
                        </div>
                    </div>
                </div>

                <section className="mt-8 space-y-6">
                    <div>
                        <h2 className="text-xl font-semibold text-slate-100">What This Means</h2>
                        <ul className="mt-2 list-disc list-inside space-y-1">
                            <li>Features may change without notice</li>
                            <li>You may encounter bugs or unexpected behavior</li>
                            <li>Data may be reset during major updates (we&apos;ll warn you first)</li>
                            <li>Performance optimizations are ongoing</li>
                        </ul>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-slate-100">Your Feedback Matters</h2>
                        <p className="mt-2">
                            We actively rely on user feedback to improve the application. Please use the
                            <Link href="/feedback" className="text-sky-400 hover:text-sky-300"> Feedback Form</Link> to
                            report bugs, suggest features, or share your experience.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-slate-100">Known Limitations</h2>
                        <ul className="mt-2 list-disc list-inside space-y-1">
                            <li>AI verification may occasionally misread step counts</li>
                            <li>Some fitness apps may have screenshot formats we haven&apos;t encountered yet</li>
                            <li>Mobile experience is functional but being optimized</li>
                        </ul>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-slate-100">Roadmap</h2>
                        <p className="mt-2">Upcoming features include:</p>
                        <ul className="mt-2 list-disc list-inside space-y-1">
                            <li>Goals and personal challenges</li>
                            <li>Enhanced analytics and trends</li>
                            <li>Mobile app (iOS/Android)</li>
                            <li>Integration with fitness platforms</li>
                        </ul>
                    </div>
                </section>
            </div>
        </main>
    );
}
