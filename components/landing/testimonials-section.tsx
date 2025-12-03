"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { motion } from "framer-motion"
import { useInView } from "framer-motion"
import { useRef, useState, useEffect } from "react"
import { Quote, Star, ChevronLeft, ChevronRight, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

const testimonials = [
    {
        id: 1,
        name: "Dr. Sarah Chen",
        role: "AI Research Scientist",
        institution: "Stanford University",
        avatar: "/api/placeholder/150/150",
        initials: "SC",
        quote: "ScholarAI has revolutionized my research workflow. What used to take weeks of manual paper review now takes just days. The gap analysis feature has helped me identify three novel research directions.",
        rating: 5,
        researchArea: "Machine Learning"
    },
    {
        id: 2,
        name: "Prof. Michael Rodriguez",
        role: "Department Head",
        institution: "MIT",
        avatar: "/api/placeholder/150/150",
        initials: "MR",
        quote: "The intelligent scoring system is remarkably accurate. ScholarAI consistently surfaces the most relevant papers, and the automated summarization saves me hours every week.",
        rating: 5,
        researchArea: "Computer Vision"
    },
    {
        id: 3,
        name: "Dr. Aisha Patel",
        role: "Postdoctoral Researcher",
        institution: "Oxford University",
        avatar: "/api/placeholder/150/150",
        initials: "AP",
        quote: "As someone working across multiple domains, ScholarAI's contextual Q&A has been invaluable. I can quickly understand connections between papers from different fields.",
        rating: 5,
        researchArea: "Interdisciplinary AI"
    },
    {
        id: 4,
        name: "Dr. James Wright",
        role: "Principal Researcher",
        institution: "Google DeepMind",
        avatar: "/api/placeholder/150/150",
        initials: "JW",
        quote: "The project management features keep our research team perfectly synchronized. We've increased our paper review efficiency by 300% since adopting ScholarAI.",
        rating: 5,
        researchArea: "Deep Learning"
    },
    {
        id: 5,
        name: "Dr. Lisa Kim",
        role: "Assistant Professor",
        institution: "Carnegie Mellon",
        avatar: "/api/placeholder/150/150",
        initials: "LK",
        quote: "ScholarAI's multi-source search capabilities are unmatched. It finds papers I would never have discovered manually, significantly expanding my research horizons.",
        rating: 5,
        researchArea: "Natural Language Processing"
    },
    {
        id: 6,
        name: "Dr. Ahmed Hassan",
        role: "Research Director",
        institution: "Microsoft Research",
        avatar: "/api/placeholder/150/150",
        initials: "AH",
        quote: "The automated gap analysis is like having a senior researcher as a collaborator. It consistently identifies opportunities that lead to high-impact publications.",
        rating: 5,
        researchArea: "AI Safety"
    }
]

export function TestimonialsSection() {
    const ref = useRef(null)
    const isInView = useInView(ref, { once: true, amount: 0.2 })
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isAutoPlaying, setIsAutoPlaying] = useState(true)

    // Auto-play carousel
    useEffect(() => {
        if (!isAutoPlaying) return

        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % Math.ceil(testimonials.length / 3))
        }, 5000)

        return () => clearInterval(interval)
    }, [isAutoPlaying])

    const nextSlide = () => {
        setCurrentIndex((prev) => (prev + 1) % Math.ceil(testimonials.length / 3))
        setIsAutoPlaying(false)
    }

    const prevSlide = () => {
        setCurrentIndex((prev) => (prev - 1 + Math.ceil(testimonials.length / 3)) % Math.ceil(testimonials.length / 3))
        setIsAutoPlaying(false)
    }

    const getVisibleTestimonials = () => {
        const itemsPerSlide = 3
        const startIndex = currentIndex * itemsPerSlide
        return testimonials.slice(startIndex, startIndex + itemsPerSlide)
    }

    return (
        <section id="testimonials" className="py-12 sm:py-16 md:py-20 lg:py-24 bg-gradient-to-b from-muted/30 to-background" ref={ref}>
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                    transition={{ duration: 0.8 }}
                    className="text-center mb-16"
                >
                    <div className="flex items-center justify-center mb-4">
                        <Sparkles className="h-6 w-6 text-primary mr-2" />
                        <span className="text-sm font-medium text-primary uppercase tracking-wider">Testimonials</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 sm:mb-6 px-4">
                        Trusted by
                        <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent"> Leading Researchers</span>
                    </h2>
                    <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed px-4">
                        Join thousands of researchers worldwide who are accelerating their discoveries with ScholarAI
                    </p>
                </motion.div>

                {/* Stats Row */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8 mb-12 sm:mb-16"
                >
                    {[
                        { value: "10,000+", label: "Active Researchers" },
                        { value: "500K+", label: "Papers Analyzed" },
                        { value: "95%", label: "Time Saved" },
                        { value: "4.9/5", label: "User Rating" }
                    ].map((stat, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.5, delay: index * 0.1 + 0.4 }}
                            className="text-center p-4 sm:p-5 md:p-6 rounded-lg sm:rounded-xl bg-gradient-to-br from-background/20 to-muted/10 border border-primary/30 hover:border-primary/50 transition-colors backdrop-blur-md"
                        >
                            <div className="text-xl sm:text-2xl md:text-3xl font-bold text-primary mb-1 sm:mb-2">{stat.value}</div>
                            <div className="text-xs sm:text-sm text-muted-foreground">{stat.label}</div>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Testimonials Carousel */}
                <div className="relative">
                    {/* Desktop View */}
                    <div className="hidden md:block">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
                            transition={{ duration: 0.8, delay: 0.6 }}
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8 mb-8"
                        >
                            {getVisibleTestimonials().map((testimonial, index) => (
                                <motion.div
                                    key={testimonial.id}
                                    initial={{ opacity: 0, y: 50 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: index * 0.1 }}
                                    whileHover={{ y: -5 }}
                                    className="group"
                                >
                                    <Card className="h-full border-primary/30 bg-gradient-to-br from-background/20 to-muted/10 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 overflow-hidden relative backdrop-blur-md">
                                        {/* Quote icon */}
                                        <div className="absolute top-4 right-4 opacity-20 group-hover:opacity-40 transition-opacity">
                                            <Quote className="h-8 w-8 text-primary" />
                                        </div>

                                        <CardContent className="p-6">
                                            {/* Rating */}
                                            <div className="flex items-center mb-4">
                                                {[...Array(testimonial.rating)].map((_, i) => (
                                                    <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                                                ))}
                                            </div>

                                            {/* Quote */}
                                            <blockquote className="text-muted-foreground mb-6 leading-relaxed italic">
                                                "{testimonial.quote}"
                                            </blockquote>

                                            {/* Author */}
                                            <div className="flex items-center space-x-4">
                                                <Avatar className="w-12 h-12 border-2 border-primary/20">
                                                    <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                                                    <AvatarFallback className="bg-gradient-to-br from-primary/20 to-purple-500/20 text-primary font-semibold">
                                                        {testimonial.initials}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1">
                                                    <div className="font-semibold text-foreground">{testimonial.name}</div>
                                                    <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                                                    <div className="text-xs text-primary">{testimonial.institution}</div>
                                                </div>
                                            </div>

                                            {/* Research Area Badge */}
                                            <div className="mt-4">
                                                <span className="inline-block px-3 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full">
                                                    {testimonial.researchArea}
                                                </span>
                                            </div>
                                        </CardContent>

                                        {/* Shine effect */}
                                        <motion.div
                                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"
                                            style={{ transform: "skewX(-20deg)" }}
                                        />
                                    </Card>
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>

                    {/* Mobile View */}
                    <div className="md:hidden">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
                            transition={{ duration: 0.8, delay: 0.6 }}
                            className="space-y-6 mb-8"
                        >
                            {testimonials.slice(0, 3).map((testimonial, index) => (
                                <motion.div
                                    key={testimonial.id}
                                    initial={{ opacity: 0, x: -50 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.5, delay: index * 0.1 }}
                                >
                                    <Card className="border-primary/30 bg-gradient-to-br from-background/20 to-muted/10 backdrop-blur-md">
                                        <CardContent className="p-6">
                                            <div className="flex items-center space-x-4 mb-4">
                                                <Avatar className="w-12 h-12 border-2 border-primary/20">
                                                    <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                                                    <AvatarFallback className="bg-gradient-to-br from-primary/20 to-purple-500/20 text-primary font-semibold">
                                                        {testimonial.initials}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1">
                                                    <div className="font-semibold text-foreground">{testimonial.name}</div>
                                                    <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                                                    <div className="text-xs text-primary">{testimonial.institution}</div>
                                                </div>
                                            </div>

                                            <div className="flex items-center mb-3">
                                                {[...Array(testimonial.rating)].map((_, i) => (
                                                    <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                                                ))}
                                            </div>

                                            <blockquote className="text-muted-foreground text-sm leading-relaxed italic">
                                                "{testimonial.quote}"
                                            </blockquote>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>
                </div>

                {/* Carousel Controls */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={isInView ? { opacity: 1 } : { opacity: 0 }}
                    transition={{ duration: 0.8, delay: 0.8 }}
                    className="flex items-center justify-center space-x-4"
                >
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={prevSlide}
                        className="hidden md:flex w-10 h-10 rounded-full p-0 border-primary/30 hover:border-primary/50 hover:bg-primary/5"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>

                    {/* Dots indicator */}
                    <div className="flex space-x-2">
                        {[...Array(Math.ceil(testimonials.length / 3))].map((_, index) => (
                            <button
                                key={index}
                                onClick={() => {
                                    setCurrentIndex(index)
                                    setIsAutoPlaying(false)
                                }}
                                className={`w-2 h-2 rounded-full transition-all duration-300 ${index === currentIndex
                                    ? 'bg-primary w-8'
                                    : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                                    }`}
                            />
                        ))}
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={nextSlide}
                        className="hidden md:flex w-10 h-10 rounded-full p-0 border-primary/30 hover:border-primary/50 hover:bg-primary/5"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </motion.div>

                {/* Call to Action */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                    transition={{ duration: 0.8, delay: 1 }}
                    className="text-center mt-16"
                >
                    <p className="text-muted-foreground mb-6">
                        Join the community of researchers accelerating discovery
                    </p>
                    <Link href="/login">
                        <Button
                            size="lg"
                            className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700"
                        >
                            Start Your Free Trial
                        </Button>
                    </Link>
                </motion.div>
            </div>
        </section>
    )
} 