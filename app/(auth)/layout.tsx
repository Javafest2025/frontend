import VideoBackground from '@/components/background/VideoBackground';
import { Toaster } from '@/components/ui/toaster';
import { ThemeToggle } from '@/components/ui/theme-toggle';

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <VideoBackground>
            <div className="absolute top-6 right-6 z-50">
                <ThemeToggle />
            </div>
            {children}
            <Toaster />
        </VideoBackground>
    );
}
