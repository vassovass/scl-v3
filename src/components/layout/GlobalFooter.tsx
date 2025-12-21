"use client";

import Link from "next/link";

export function GlobalFooter() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="border-t border-slate-800 bg-slate-950 mt-auto">
            <div className="mx-auto max-w-6xl px-4 py-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {/* Brand */}
                    <div className="col-span-2 md:col-span-1">
                        <Link href="/dashboard" className="flex items-center gap-2 text-slate-200">
                            <span className="text-xl">👟</span>
                            <span className="font-bold">StepCountLeague</span>
                        </Link>
                        <p className="mt-2 text-xs text-slate-500">
                            Compete with friends to walk more steps together.
                        </p>
                    </div>

                    {/* Main Pages */}
                    <div>
                        <h4 className="text-sm font-medium text-slate-300 mb-3">Navigation</h4>
                        <ul className="space-y-2">
                            <li>
                                <Link href="/dashboard" className="text-sm text-slate-500 hover:text-slate-300 transition">
                                    Dashboard
                                </Link>
                            </li>
                            <li>
                                <Link href="/league/create" className="text-sm text-slate-500 hover:text-slate-300 transition">
                                    Create League
                                </Link>
                            </li>
                            <li>
                                <Link href="/join" className="text-sm text-slate-500 hover:text-slate-300 transition">
                                    Join League
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Account */}
                    <div>
                        <h4 className="text-sm font-medium text-slate-300 mb-3">Account</h4>
                        <ul className="space-y-2">
                            <li>
                                <Link href="/settings/profile" className="text-sm text-slate-500 hover:text-slate-300 transition">
                                    Profile Settings
                                </Link>
                            </li>
                            <li>
                                <Link href="/feedback" className="text-sm text-slate-500 hover:text-slate-300 transition">
                                    Send Feedback
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h4 className="text-sm font-medium text-slate-300 mb-3">Legal</h4>
                        <ul className="space-y-2">
                            <li>
                                <Link href="/privacy" className="text-sm text-slate-500 hover:text-slate-300 transition">
                                    Privacy Policy
                                </Link>
                            </li>
                            <li>
                                <Link href="/security" className="text-sm text-slate-500 hover:text-slate-300 transition">
                                    Security
                                </Link>
                            </li>
                            <li>
                                <Link href="/beta" className="text-sm text-slate-500 hover:text-slate-300 transition">
                                    Beta Info
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="mt-8 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-xs text-slate-600">
                        © {currentYear} Step Counter League. All rights reserved.
                    </p>
                    <div className="flex items-center gap-4 text-xs text-slate-600">
                        <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            Beta
                        </span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
