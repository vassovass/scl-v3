"use client";

import { NavHeader } from "@/components/navigation/NavHeader";
import { GlobalFooter } from "@/components/layout/GlobalFooter";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen flex flex-col">
            <NavHeader />
            <main className="flex-1">{children}</main>
            <GlobalFooter />
        </div>
    );
}
