"use client";

import { NavHeader } from "@/components/navigation/NavHeader";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            <NavHeader />
            <main>{children}</main>
        </>
    );
}
