import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Development Stage | StepLeague",
    description: "Learn about the current development stage of StepLeague and what it means for users",
};

export default function StageInfoLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}

