import Link from "next/link";

export default function SecurityPolicyPage() {
    return (
        <main className="min-h-screen bg-background text-foreground">
            <div className="mx-auto max-w-3xl px-6 py-12">
                <Link href="/" className="text-sm text-primary hover:text-primary/80">← Back to Home</Link>

                <h1 className="mt-8 text-3xl font-bold text-foreground">Security Policy</h1>
                <p className="mt-2 text-sm text-muted-foreground">Last updated: December 2024</p>

                <section className="mt-8 space-y-6">
                    <div>
                        <h2 className="text-xl font-semibold text-foreground">1. Authentication & Access</h2>
                        <ul className="mt-2 list-disc list-inside space-y-1">
                            <li>Secure authentication via Supabase Auth with email/password or OAuth providers</li>
                            <li>Session tokens with automatic expiration and refresh</li>
                            <li>Row-Level Security (RLS) policies ensure users can only access their own data</li>
                        </ul>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-foreground">2. Data Protection</h2>
                        <ul className="mt-2 list-disc list-inside space-y-1">
                            <li>All data transmitted over HTTPS (TLS 1.3)</li>
                            <li>Data at rest encrypted using AES-256</li>
                            <li>Database hosted on Supabase with automatic backups</li>
                            <li>Uploaded images processed securely and not publicly accessible</li>
                        </ul>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-foreground">3. AI Processing</h2>
                        <p className="mt-2">
                            Screenshots are processed using Google&apos;s Gemini AI to extract step counts.
                            Images are transmitted securely and processed in real-time. We do not use your
                            images to train AI models.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-foreground">4. Verification System</h2>
                        <p className="mt-2">
                            Our AI verification system attempts to validate step counts from submitted screenshots.
                            While we strive for accuracy, automated verification is not infallible. League admins
                            can review and flag submissions for manual verification if needed.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-foreground">5. Reporting Security Issues</h2>
                        <p className="mt-2">
                            If you discover a security vulnerability, please report it through our feedback form.
                            We take all security reports seriously and will respond promptly.
                        </p>
                    </div>
                </section>
            </div>
        </main>
    );
}

