import { HeroBackground } from '@/components/landing/hero-background';
import { Toaster } from '@/components/ui/toaster';
import { ThemeToggle } from '@/components/ui/theme-toggle';

export default function AuthLayout({
    children,
}: {
    readonly children: React.ReactNode;
}) {
    return (
        <div className="relative min-h-screen w-full bg-background">
            {/* Neural network background from landing page */}
            <HeroBackground />

            {/* Content with backdrop blur */}
            <div className="relative z-10">
                <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-50">
                    <ThemeToggle />
                </div>
                {children}
                <Toaster />
            </div>
        </div>
    );
}
