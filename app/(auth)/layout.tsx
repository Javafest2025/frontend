'use client';
import VideoBackground from '@/components/background/VideoBackground';

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <VideoBackground>
            {children}
        </VideoBackground>
    );
}
