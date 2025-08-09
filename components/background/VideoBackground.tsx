'use client';

interface VideoBackgroundProps {
    children: React.ReactNode;
}

export default function VideoBackground({ children }: VideoBackgroundProps) {
    return (
        <div className="relative min-h-screen w-full bg-background">
            {/* Content with backdrop blur */}
            <div className="relative z-10">
                {children}
            </div>
        </div>
    );
} 