'use client'

import { useState, useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight, Target, Zap, Shield, ClipboardList, TrendingUp, AlertTriangle } from 'lucide-react'
import { motion, AnimatePresence, PanInfo } from 'framer-motion'
import type { AbstractAnalysisDto } from '@/lib/api/project-service/library'

interface InsightCardCarouselProps {
    insights: AbstractAnalysisDto
}

const cardConfig = [
    {
        key: 'focus',
        title: 'FOCUS',
        icon: Target,
        color: 'from-blue-400 via-blue-500 to-blue-600',
        radialColor: 'radial-gradient(circle at 30% 20%, rgba(59, 130, 246, 0.3) 0%, rgba(37, 99, 235, 0.2) 50%, rgba(29, 78, 216, 0.1) 100%)',
        borderColor: 'border-blue-400/30'
    },
    {
        key: 'approach',
        title: 'APPROACH',
        icon: Zap,
        color: 'from-purple-400 via-purple-500 to-purple-600',
        radialColor: 'radial-gradient(circle at 30% 20%, rgba(168, 85, 247, 0.3) 0%, rgba(147, 51, 234, 0.2) 50%, rgba(126, 34, 206, 0.1) 100%)',
        borderColor: 'border-purple-400/30'
    },
    {
        key: 'emphasis',
        title: 'EMPHASIS',
        icon: Shield,
        color: 'from-emerald-400 via-emerald-500 to-emerald-600',
        radialColor: 'radial-gradient(circle at 30% 20%, rgba(52, 211, 153, 0.3) 0%, rgba(16, 185, 129, 0.2) 50%, rgba(5, 150, 105, 0.1) 100%)',
        borderColor: 'border-emerald-400/30'
    },
    {
        key: 'methodology',
        title: 'METHODOLOGY',
        icon: ClipboardList,
        color: 'from-teal-400 via-teal-500 to-teal-600',
        radialColor: 'radial-gradient(circle at 30% 20%, rgba(45, 212, 191, 0.3) 0%, rgba(20, 184, 166, 0.2) 50%, rgba(13, 148, 136, 0.1) 100%)',
        borderColor: 'border-teal-400/30'
    },
    {
        key: 'impact',
        title: 'IMPACT',
        icon: TrendingUp,
        color: 'from-pink-400 via-pink-500 to-pink-600',
        radialColor: 'radial-gradient(circle at 30% 20%, rgba(244, 114, 182, 0.3) 0%, rgba(236, 72, 153, 0.2) 50%, rgba(219, 39, 119, 0.1) 100%)',
        borderColor: 'border-pink-400/30'
    },
    {
        key: 'challenges',
        title: 'CHALLENGES',
        icon: AlertTriangle,
        color: 'from-red-400 via-red-500 to-red-600',
        radialColor: 'radial-gradient(circle at 30% 20%, rgba(248, 113, 113, 0.3) 0%, rgba(239, 68, 68, 0.2) 50%, rgba(220, 38, 38, 0.1) 100%)',
        borderColor: 'border-red-400/30'
    }
]

export default function InsightCardCarousel({ insights }: InsightCardCarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isAutoPlaying, setIsAutoPlaying] = useState(true)
    const [lastInteractionTime, setLastInteractionTime] = useState(0)
    const cardsPerView = 2 // Show 2 cards at a time
    const containerRef = useRef<HTMLDivElement>(null)

    const totalCards = cardConfig.length
    const maxIndex = Math.max(0, totalCards - 1) // Allow sliding until the last card

    // Auto-slide functionality with resume after inactivity
    useEffect(() => {
        if (!isAutoPlaying) return

        const interval = setInterval(() => {
            setCurrentIndex(prev => {
                if (prev >= maxIndex) {
                    return 0 // Loop back to start
                }
                return prev + 1
            })
        }, 4000) // Change slide every 4 seconds for smoother flow

        return () => clearInterval(interval)
    }, [isAutoPlaying, maxIndex])

    // Resume auto-play after 10 seconds of inactivity
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (!isAutoPlaying && Date.now() - lastInteractionTime > 10000) {
                setIsAutoPlaying(true)
            }
        }, 10000)

        return () => clearTimeout(timeout)
    }, [isAutoPlaying, lastInteractionTime])

    const handleUserInteraction = () => {
        setLastInteractionTime(Date.now())
        setIsAutoPlaying(false)
    }

    const nextSlide = () => {
        handleUserInteraction()
        setCurrentIndex(prev => Math.min(prev + 1, maxIndex))
    }

    const prevSlide = () => {
        handleUserInteraction()
        setCurrentIndex(prev => Math.max(prev - 1, 0))
    }

    const goToSlide = (index: number) => {
        handleUserInteraction()
        setCurrentIndex(index)
    }

    // Touch/swipe handling
    const handleDragEnd = (event: any, info: PanInfo) => {
        const swipeThreshold = 50
        if (info.offset.x > swipeThreshold && currentIndex > 0) {
            prevSlide()
        } else if (info.offset.x < -swipeThreshold && currentIndex < maxIndex) {
            nextSlide()
        }
    }

    // Get the current card and the next card for smooth sliding
    const currentCard = cardConfig[currentIndex]
    const nextCard = cardConfig[(currentIndex + 1) % totalCards]
    const visibleCards = [currentCard, nextCard]

    return (
        <div className="w-full">
            <h3 className="text-lg font-semibold text-gray-200 mb-4 flex items-center gap-2">
                <span className="w-1 h-6 bg-gradient-to-b from-blue-400 to-purple-400 rounded-full"></span>
                Research Insights
            </h3>

            <div className="relative h-[320px]" ref={containerRef}>
                {/* Navigation Arrows */}
                {currentIndex > 0 && (
                    <button
                        onClick={prevSlide}
                        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-gray-800/80 hover:bg-gray-700/80 rounded-full flex items-center justify-center text-gray-300 hover:text-white backdrop-blur-sm border border-gray-600/30"
                    >
                        <ChevronLeft size={20} />
                    </button>
                )}

                {currentIndex < maxIndex && (
                    <button
                        onClick={nextSlide}
                        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-gray-800/80 hover:bg-gray-700/80 rounded-full flex items-center justify-center text-gray-300 hover:text-white backdrop-blur-sm border border-gray-600/30"
                    >
                        <ChevronRight size={20} />
                    </button>
                )}

                {/* Cards Container with Simple Right-to-Left Sliding */}
                <div className="flex gap-4 overflow-hidden h-[280px] relative">
                    <AnimatePresence mode="wait">
                        {visibleCards.map((config, index) => {
                            const Icon = config.icon
                            const content = insights[config.key as keyof AbstractAnalysisDto] || 'Not specified'

                            return (
                                <motion.div
                                    key={`${config.key}-${currentIndex}-${index}`}
                                    initial={{ x: 100, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    exit={{ x: -100, opacity: 0 }}
                                    transition={{
                                        duration: 0.4,
                                        ease: "easeOut"
                                    }}
                                    className={`w-1/2 min-w-0 relative group flex-shrink-0`}
                                >
                                    {/* Glassy Radial Gradient Card */}
                                    <div
                                        className={`
                                            relative overflow-hidden rounded-xl p-6 border
                                            ${config.borderColor} border
                                            backdrop-blur-xl bg-opacity-10
                                            h-[280px] w-full flex flex-col
                                            shadow-2xl shadow-black/20
                                        `}
                                        style={{
                                            background: config.radialColor,
                                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.05)'
                                        }}
                                    >
                                        {/* Enhanced Shimmer Effect */}
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>

                                        {/* Multi-layered Glassy Overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/5 rounded-xl"></div>
                                        <div className="absolute inset-0 bg-gradient-to-tl from-transparent via-white/5 to-transparent rounded-xl"></div>

                                        {/* Content */}
                                        <div className="relative z-10 flex items-start gap-3 flex-1">
                                            <div className={`
                                                p-3 rounded-xl bg-gradient-to-br ${config.color} 
                                                text-white shadow-xl backdrop-blur-sm
                                                relative overflow-hidden flex-shrink-0
                                                border border-white/20
                                            `}
                                                style={{
                                                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)'
                                                }}>
                                                {/* Enhanced Icon Shimmer */}
                                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out"></div>
                                                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-xl"></div>
                                                <Icon size={20} className="relative z-10 drop-shadow-sm" />
                                            </div>
                                            <div className="flex-1 min-w-0 flex flex-col">
                                                <h4 className="text-sm font-semibold text-white mb-2 uppercase tracking-wide drop-shadow-sm">
                                                    {config.title}
                                                </h4>
                                                <p className="text-gray-100 leading-relaxed flex-1 overflow-hidden drop-shadow-sm" style={{
                                                    fontSize: content.length > 300 ? '0.75rem' : content.length > 200 ? '0.8rem' : '0.875rem',
                                                    lineHeight: content.length > 300 ? '1.2' : content.length > 200 ? '1.3' : '1.5'
                                                }}>
                                                    {content}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )
                        })}
                    </AnimatePresence>
                </div>

                {/* Dots Indicator */}
                <div className="flex justify-center gap-2 mt-4">
                    {Array.from({ length: totalCards }, (_, i) => (
                        <button
                            key={i}
                            onClick={() => goToSlide(i)}
                            className={`w-2 h-2 rounded-full transition-all duration-300 ${i === currentIndex
                                ? 'bg-blue-400 w-6 shadow-lg shadow-blue-400/50'
                                : 'bg-gray-600 hover:bg-gray-500 hover:scale-125'
                                }`}
                        />
                    ))}
                </div>

                {/* Auto-play indicator */}
                <div className="flex justify-center mt-2">
                    <div className={`w-2 h-2 rounded-full transition-all duration-300 ${isAutoPlaying ? 'bg-green-400 animate-pulse' : 'bg-gray-500'
                        }`} title={isAutoPlaying ? 'Auto-playing' : 'Auto-play paused'}></div>
                </div>
            </div>
        </div>
    )
}
