'use client';
import VideoBackground from '@/components/background/VideoBackground';
import { Toaster } from '@/components/ui/toaster';

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <VideoBackground>
            {children}
            <Toaster />
        </VideoBackground>
    );
}
