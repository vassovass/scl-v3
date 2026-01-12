import Link from "next/link";

export default function PrivacyPolicyPage() {
    return (
        <main className="min-h-screen bg-background text-foreground">
            <div className="mx-auto max-w-3xl px-6 py-12">
                <Link href="/" className="text-sm text-primary hover:text-primary/80">← Back to Home</Link>

                <h1 className="mt-8 text-3xl font-bold text-foreground">Privacy Policy</h1>
                <p className="mt-2 text-sm text-muted-foreground">Last updated: December 2024</p>

                <section className="mt-8 space-y-6">
                    <div>
                        <h2 className="text-xl font-semibold text-foreground">1. Information We Collect</h2>
                        <p className="mt-2">
                            We collect information you provide directly to us when you create an account, including:
                        </p>
                        <ul className="mt-2 list-disc list-inside space-y-1">
                            <li>Email address (for authentication)</li>
                            <li>Display name or nickname (optional)</li>
                            <li>Step count data from screenshots you upload</li>
                            <li>League membership and participation data</li>
                        </ul>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-foreground">2. How We Use Your Information</h2>
                        <p className="mt-2">We use the information we collect to:</p>
                        <ul className="mt-2 list-disc list-inside space-y-1">
                            <li>Provide, maintain, and improve our services</li>
                            <li>Process your step submissions and display leaderboards</li>
                            <li>Communicate with you about your account and updates</li>
                            <li>Detect and prevent fraud or abuse</li>
                        </ul>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-foreground">3. Data Storage & Security</h2>
                        <p className="mt-2">
                            Your data is stored securely using Supabase, a trusted cloud database provider.
                            We implement industry-standard security measures including encryption in transit (HTTPS)
                            and at rest. Screenshots are processed by AI to extract step counts and may be stored
                            temporarily for verification purposes.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-foreground">4. Data Sharing</h2>
                        <p className="mt-2">
                            We do not sell your personal information. Your step data and display name are visible
                            to other members of leagues you join. We may share aggregated, anonymized data for
                            analytics purposes.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-foreground">5. Your Rights</h2>
                        <p className="mt-2">You have the right to:</p>
                        <ul className="mt-2 list-disc list-inside space-y-1">
                            <li>Access your personal data</li>
                            <li>Request correction of inaccurate data</li>
                            <li>Request deletion of your account and data</li>
                            <li>Export your submission history</li>
                        </ul>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-foreground">6. Contact Us</h2>
                        <p className="mt-2">
                            If you have questions about this Privacy Policy, please contact us through the
                            in-app feedback form or email the league administrator.
                        </p>
                    </div>
                </section>
            </div>
        </main>
    );
}
