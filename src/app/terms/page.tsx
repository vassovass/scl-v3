"use client";

import Link from "next/link";
import { APP_CONFIG } from "@/lib/config";

export default function TermsOfServicePage() {
    return (
        <main className="min-h-screen bg-slate-950 text-slate-300">
            <div className="mx-auto max-w-3xl px-6 py-12">
                <Link href="/" className="text-sm text-sky-400 hover:text-sky-300">← Back to Home</Link>

                <h1 className="mt-8 text-3xl font-bold text-slate-100">Terms of Service</h1>
                <p className="mt-2 text-sm text-slate-500">Last updated: December 2024</p>

                <section className="mt-8 space-y-6">
                    <div>
                        <h2 className="text-xl font-semibold text-slate-100">1. Acceptance of Terms</h2>
                        <p className="mt-2">
                            By accessing or using {APP_CONFIG.name} (&quot;the Service&quot;), you agree to be bound by these
                            Terms of Service. If you do not agree to these terms, please do not use the Service.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-slate-100">2. Description of Service</h2>
                        <p className="mt-2">
                            {APP_CONFIG.name} is a step-tracking competition platform that allows users to create
                            leagues, submit step counts via screenshots, and compete with friends. The Service
                            includes AI-powered verification of submitted screenshots.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-slate-100">3. Service Availability</h2>
                        <p className="mt-2">
                            The Service is provided on an &quot;as is&quot; and &quot;as available&quot; basis. We reserve the right to:
                        </p>
                        <ul className="mt-2 list-disc list-inside space-y-1">
                            <li>Modify, suspend, or discontinue any part of the Service at any time</li>
                            <li>Update, change, or remove features without prior notice</li>
                            <li>Perform maintenance that may temporarily affect availability</li>
                            <li>Discontinue the Service entirely with 30 days written notice</li>
                        </ul>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-slate-100">4. Subscription Plans & Payments</h2>
                        <p className="mt-2">
                            Paid subscription plans grant access to premium features. By subscribing, you agree to:
                        </p>
                        <ul className="mt-2 list-disc list-inside space-y-1">
                            <li>Pay all applicable fees as described at time of purchase</li>
                            <li>Provide accurate billing information</li>
                            <li>Accept that subscriptions auto-renew unless cancelled</li>
                        </ul>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-slate-100">5. Lifetime Access Plans</h2>
                        <p className="mt-2">
                            &quot;Lifetime&quot; access means access for the lifetime of the Service, not the lifetime of
                            the user. Lifetime plans are subject to the following terms:
                        </p>
                        <ul className="mt-2 list-disc list-inside space-y-1">
                            <li>Access is granted for as long as the Service continues to operate</li>
                            <li>Features may be added, modified, or removed over time</li>
                            <li>If the Service is discontinued, no refund will be provided for lifetime plans</li>
                            <li>Lifetime plans may not include features developed after purchase unless specified</li>
                            <li>Lifetime access is non-transferable and tied to a single account</li>
                        </ul>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-slate-100">6. Refund Policy</h2>
                        <p className="mt-2">
                            Refunds are handled as follows:
                        </p>
                        <ul className="mt-2 list-disc list-inside space-y-1">
                            <li>Monthly subscriptions: No refunds for partial months</li>
                            <li>Annual subscriptions: Pro-rated refund within first 30 days only</li>
                            <li>Lifetime plans: Refund within 14 days of purchase if Service not used</li>
                            <li>Service discontinuation: No refunds for any plan type</li>
                        </ul>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-slate-100">7. User Conduct</h2>
                        <p className="mt-2">You agree not to:</p>
                        <ul className="mt-2 list-disc list-inside space-y-1">
                            <li>Submit fraudulent, manipulated, or fake screenshots</li>
                            <li>Attempt to circumvent AI verification systems</li>
                            <li>Share account credentials with others</li>
                            <li>Use the Service for any unlawful purpose</li>
                            <li>Harass, abuse, or harm other users</li>
                            <li>Attempt to access other users&apos; accounts or data</li>
                        </ul>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-slate-100">8. Account Termination</h2>
                        <p className="mt-2">
                            We reserve the right to suspend or terminate accounts that violate these terms.
                            You may delete your account at any time through the app settings. Upon termination:
                        </p>
                        <ul className="mt-2 list-disc list-inside space-y-1">
                            <li>Access to the Service will be immediately revoked</li>
                            <li>No refunds will be provided for remaining subscription time</li>
                            <li>Your data may be deleted in accordance with our Privacy Policy</li>
                        </ul>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-slate-100">9. Intellectual Property</h2>
                        <p className="mt-2">
                            The Service, including its code, design, and branding, is owned by {APP_CONFIG.name}.
                            You retain ownership of content you submit (screenshots, profile information) but
                            grant us a license to use this content to provide the Service.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-slate-100">10. Disclaimer of Warranties</h2>
                        <p className="mt-2">
                            The Service is provided &quot;as is&quot; without warranties of any kind, express or implied.
                            We do not guarantee:
                        </p>
                        <ul className="mt-2 list-disc list-inside space-y-1">
                            <li>Uninterrupted or error-free operation</li>
                            <li>Accuracy of AI verification (verification is automated and may err)</li>
                            <li>Availability of specific features indefinitely</li>
                            <li>Compatibility with all devices or fitness tracking apps</li>
                        </ul>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-slate-100">11. Limitation of Liability</h2>
                        <p className="mt-2">
                            To the maximum extent permitted by law, {APP_CONFIG.name} shall not be liable for any
                            indirect, incidental, special, consequential, or punitive damages, including loss of
                            data, profits, or goodwill. Our total liability shall not exceed the amount paid by
                            you for the Service in the 12 months preceding the claim.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-slate-100">12. Changes to Terms</h2>
                        <p className="mt-2">
                            We may update these Terms from time to time. Continued use of the Service after
                            changes constitutes acceptance of the new terms. Material changes will be
                            communicated via email or in-app notification.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-slate-100">13. Governing Law</h2>
                        <p className="mt-2">
                            These Terms shall be governed by and construed in accordance with applicable laws.
                            Any disputes shall be resolved through good-faith negotiation before pursuing
                            legal remedies.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-slate-100">14. Contact</h2>
                        <p className="mt-2">
                            For questions about these Terms, please contact us through the in-app feedback form.
                        </p>
                    </div>
                </section>
            </div>
        </main>
    );
}
