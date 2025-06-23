'use client';
import { useEffect, useState } from 'react';
import { backgroundStyles } from '@/utils/videoBackgrounds';

interface VideoBackgroundProps {
    children: React.ReactNode;
}

export default function VideoBackground({ children }: VideoBackgroundProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);

        // Inject background styles into the document head
        const styleElement = document.createElement('style');
        styleElement.textContent = backgroundStyles;
        document.head.appendChild(styleElement);

        return () => {
            // Cleanup styles when component unmounts
            if (document.head.contains(styleElement)) {
                document.head.removeChild(styleElement);
            }
        };
    }, []);

    return (
        <div
            className="relative min-h-screen w-full overflow-hidden background-container bg-gradient-to-br from-background via-background to-muted/20"
        >
            {/* Enhanced floating elements for visual depth */}
            {mounted && (
                <>
                    {/* Floating geometric elements */}
                    <div className="floating-element" />
                    <div className="floating-element" />
                    <div className="floating-element" />
                    <div className="floating-element" />

                    {/* Subtle glow effects */}
                    <div className="glow-element" />
                    <div className="glow-element" />

                    {/* Circuit board elements */}
                    <div className="absolute inset-0">
                        {[...Array(8)].map((_, i) => (
                            <div
                                key={`circuit-${i}`}
                                className="absolute"
                                style={{
                                    width: `${15 + Math.random() * 25}px`,
                                    height: `${15 + Math.random() * 25}px`,
                                    left: `${Math.random() * 100}%`,
                                    top: `${Math.random() * 100}%`,
                                    animation: `${i % 4 === 0 ? 'orbit' : i % 4 === 1 ? 'zigzag' : i % 4 === 2 ? 'float' : 'wave'} ${20 + Math.random() * 15}s ease-in-out infinite`,
                                    animationDelay: `${Math.random() * 10}s`,
                                }}
                            >
                                {i % 3 === 0 ? (
                                    // Square circuit nodes
                                    <div
                                        className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/30"
                                        style={{
                                            boxShadow: `0 0 15px hsl(var(--primary) / 0.4), 0 0 30px hsl(var(--primary) / 0.2), inset 0 0 10px hsl(var(--primary) / 0.1)`,
                                            filter: 'blur(0.3px)'
                                        }}
                                    />
                                ) : i % 3 === 1 ? (
                                    // Hexagonal circuit elements
                                    <div
                                        className="w-full h-full bg-gradient-radial from-primary/25 to-transparent border border-primary/40"
                                        style={{
                                            clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                                            boxShadow: `0 0 20px hsl(var(--primary) / 0.5), 0 0 40px hsl(var(--primary) / 0.2)`,
                                            filter: 'blur(0.4px)'
                                        }}
                                    />
                                ) : (
                                    // Diamond circuit connectors
                                    <div
                                        className="w-full h-full bg-gradient-to-t from-primary/15 to-primary/25 border border-primary/35 transform rotate-45"
                                        style={{
                                            boxShadow: `0 0 12px hsl(var(--primary) / 0.4), 0 0 24px hsl(var(--primary) / 0.2), inset 0 0 8px hsl(var(--primary) / 0.15)`,
                                            filter: 'blur(0.3px)'
                                        }}
                                    />
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Circuit connection lines */}
                    <div className="absolute inset-0">
                        {[...Array(6)].map((_, i) => (
                            <div
                                key={`circuit-line-${i}`}
                                className="absolute bg-gradient-to-r from-transparent via-primary/20 to-transparent"
                                style={{
                                    width: `${80 + Math.random() * 120}px`,
                                    height: `${i % 2 === 0 ? '2px' : '1px'}`,
                                    left: `${Math.random() * 80}%`,
                                    top: `${Math.random() * 80}%`,
                                    transform: `rotate(${Math.random() * 180}deg)`,
                                    animation: `wave ${15 + Math.random() * 10}s ease-in-out infinite`,
                                    animationDelay: `${Math.random() * 8}s`,
                                    boxShadow: `0 0 8px hsl(var(--primary) / 0.4), 0 0 16px hsl(var(--primary) / 0.2)`,
                                    filter: 'blur(0.2px)'
                                }}
                            />
                        ))}
                    </div>

                    {/* Pulsing circuit nodes */}
                    <div className="absolute inset-0">
                        {[...Array(5)].map((_, i) => (
                            <div
                                key={`node-${i}`}
                                className="absolute rounded-full"
                                style={{
                                    width: `${8 + Math.random() * 12}px`,
                                    height: `${8 + Math.random() * 12}px`,
                                    left: `${Math.random() * 100}%`,
                                    top: `${Math.random() * 100}%`,
                                    background: `radial-gradient(circle, hsl(var(--primary) / 0.6) 0%, hsl(var(--primary) / 0.3) 50%, transparent 100%)`,
                                    animation: `pulse-glow ${4 + Math.random() * 3}s ease-in-out infinite`,
                                    animationDelay: `${Math.random() * 5}s`,
                                    boxShadow: `0 0 20px hsl(var(--primary) / 0.6), 0 0 40px hsl(var(--primary) / 0.3), 0 0 60px hsl(var(--primary) / 0.1)`,
                                    filter: 'blur(0.5px)',
                                    border: `1px solid hsl(var(--primary) / 0.4)`
                                }}
                            />
                        ))}
                    </div>

                    {/* Enhanced animated particles */}
                    <div className="absolute inset-0">
                        {[...Array(25)].map((_, i) => (
                            <div
                                key={i}
                                className="absolute rounded-full bg-primary/20 animate-pulse"
                                style={{
                                    width: `${1 + Math.random() * 6}px`,
                                    height: `${1 + Math.random() * 6}px`,
                                    left: `${Math.random() * 100}%`,
                                    top: `${Math.random() * 100}%`,
                                    animationDelay: `${Math.random() * 5}s`,
                                    animation: `${i % 3 === 0 ? 'float' : i % 3 === 1 ? 'orbit' : 'zigzag'} ${8 + Math.random() * 6}s ease-in-out infinite`,
                                    boxShadow: `0 0 20px hsl(var(--primary) / 0.4), 0 0 40px hsl(var(--primary) / 0.2), 0 0 60px hsl(var(--primary) / 0.1)`,
                                    filter: 'blur(0.5px)'
                                }}
                            />
                        ))}
                    </div>

                    {/* Enhanced neural network connections */}
                    <div className="absolute inset-0">
                        {[...Array(12)].map((_, i) => (
                            <div
                                key={`line-${i}`}
                                className="absolute bg-gradient-to-r from-transparent via-primary/15 to-transparent"
                                style={{
                                    width: `${100 + Math.random() * 200}px`,
                                    height: '1px',
                                    left: `${Math.random() * 80}%`,
                                    top: `${Math.random() * 80}%`,
                                    transform: `rotate(${Math.random() * 360}deg)`,
                                    animation: `${i % 2 === 0 ? 'wave' : 'float'} ${12 + Math.random() * 8}s ease-in-out infinite`,
                                    animationDelay: `${Math.random() * 5}s`,
                                    boxShadow: `0 0 10px hsl(var(--primary) / 0.3), 0 0 20px hsl(var(--primary) / 0.1)`,
                                    filter: 'blur(0.3px)'
                                }}
                            />
                        ))}
                    </div>

                    {/* Larger floating orbs */}
                    <div className="absolute inset-0">
                        {[...Array(5)].map((_, i) => (
                            <div
                                key={`orb-${i}`}
                                className="absolute rounded-full bg-gradient-radial from-primary/25 via-primary/15 to-transparent"
                                style={{
                                    width: `${40 + Math.random() * 80}px`,
                                    height: `${40 + Math.random() * 80}px`,
                                    left: `${Math.random() * 100}%`,
                                    top: `${Math.random() * 100}%`,
                                    animation: `orbit ${25 + Math.random() * 15}s ease-in-out infinite`,
                                    animationDelay: `${Math.random() * 10}s`,
                                    boxShadow: `0 0 40px hsl(var(--primary) / 0.3), 0 0 80px hsl(var(--primary) / 0.15), 0 0 120px hsl(var(--primary) / 0.05)`,
                                    filter: 'blur(1px)'
                                }}
                            />
                        ))}
                    </div>

                    {/* Research-themed floating icons effect */}
                    <div className="absolute inset-0">
                        {[...Array(8)].map((_, i) => (
                            <div
                                key={`icon-${i}`}
                                className="absolute w-6 h-6 text-primary"
                                style={{
                                    left: `${10 + Math.random() * 80}%`,
                                    top: `${10 + Math.random() * 80}%`,
                                    animation: `${i % 2 === 0 ? 'zigzag' : 'float'} ${18 + Math.random() * 12}s ease-in-out infinite`,
                                    animationDelay: `${Math.random() * 8}s`,
                                    filter: 'drop-shadow(0 0 8px hsl(var(--primary) / 0.4)) drop-shadow(0 0 16px hsl(var(--primary) / 0.2))',
                                    opacity: 0.6
                                }}
                            >
                                {/* Simple geometric shapes representing research elements */}
                                <div className="w-full h-full border border-current rounded-sm transform rotate-45 animate-pulse" />
                            </div>
                        ))}
                    </div>

                    {/* Drifting light streaks */}
                    <div className="absolute inset-0">
                        {[...Array(4)].map((_, i) => (
                            <div
                                key={`streak-${i}`}
                                className="absolute bg-gradient-to-r from-transparent via-primary/20 to-transparent"
                                style={{
                                    width: `${200 + Math.random() * 300}px`,
                                    height: '2px',
                                    left: `-${100 + Math.random() * 100}px`,
                                    top: `${Math.random() * 100}%`,
                                    transform: `rotate(${Math.random() * 45 - 22.5}deg)`,
                                    animation: `drift ${20 + Math.random() * 10}s linear infinite`,
                                    animationDelay: `${Math.random() * 10}s`,
                                    boxShadow: `0 0 15px hsl(var(--primary) / 0.4), 0 0 30px hsl(var(--primary) / 0.2)`,
                                    filter: 'blur(0.5px)'
                                }}
                            />
                        ))}
                    </div>

                    {/* Neon burst effects */}
                    <div className="absolute inset-0">
                        {[...Array(6)].map((_, i) => (
                            <div
                                key={`burst-${i}`}
                                className="absolute rounded-full"
                                style={{
                                    width: `${20 + Math.random() * 40}px`,
                                    height: `${20 + Math.random() * 40}px`,
                                    left: `${Math.random() * 100}%`,
                                    top: `${Math.random() * 100}%`,
                                    background: `radial-gradient(circle, hsl(var(--primary) / 0.4) 0%, hsl(var(--primary) / 0.2) 30%, transparent 70%)`,
                                    animation: `pulse-glow ${6 + Math.random() * 4}s ease-in-out infinite`,
                                    animationDelay: `${Math.random() * 8}s`,
                                    boxShadow: `0 0 30px hsl(var(--primary) / 0.5), 0 0 60px hsl(var(--primary) / 0.3), 0 0 90px hsl(var(--primary) / 0.1)`,
                                    filter: 'blur(1px)'
                                }}
                            />
                        ))}
                    </div>

                    {/* Moving spotlight effects */}
                    <div className="absolute inset-0">
                        {[...Array(3)].map((_, i) => (
                            <div
                                key={`spotlight-${i}`}
                                className="absolute rounded-full"
                                style={{
                                    width: `${100 + Math.random() * 150}px`,
                                    height: `${100 + Math.random() * 150}px`,
                                    left: `${Math.random() * 100}%`,
                                    top: `${Math.random() * 100}%`,
                                    background: `radial-gradient(circle, hsl(var(--primary) / 0.08) 0%, hsl(var(--primary) / 0.04) 40%, transparent 80%)`,
                                    animation: `orbit ${35 + Math.random() * 25}s ease-in-out infinite`,
                                    animationDelay: `${Math.random() * 15}s`,
                                    filter: 'blur(2px)'
                                }}
                            />
                        ))}
                    </div>
                </>
            )}

            {/* Enhanced vignette effect */}
            <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-background/30" />

            {/* Content with enhanced backdrop blur */}
            <div className="relative z-10 backdrop-blur-[0.5px]">
                {children}
            </div>
        </div>
    );
} 