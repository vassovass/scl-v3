import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'World Leaderboard | StepLeague',
    description: 'View platform-wide step rankings across all StepLeague leagues. See who is leading the world in daily steps and track your global rank.',
    keywords: ['step tracker', 'leaderboard', 'walking', 'fitness', 'step competition', 'global rankings'],
    openGraph: {
        title: 'World Leaderboard | StepLeague',
        description: 'View platform-wide step rankings across all StepLeague leagues. See who is leading the world in daily steps and track your global rank.',
        type: 'website',
        url: 'https://stepleague.app/leaderboard',
    },
};

export default function WorldLeaderboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
