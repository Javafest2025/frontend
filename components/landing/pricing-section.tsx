"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import {
    Sparkles,
    CheckCircle,
    Zap,
    Crown,
    CreditCard
} from "lucide-react"

const plans = [
    {
        name: "Basic Plan",
        icon: Zap,
        price: "Free",
        priceDescription: "",
        gradient: "from-blue-500/20 to-cyan-500/20",
        iconColor: "text-blue-500",
        borderColor: "border-blue-500/30",
        features: [
            "Core ScholarAI tools (search, summarize, cite)",
            "Community / self-serve help",
            "No interface customization"
        ],
        usageLimits: [
            "Starter pool of free credits, then capped each month until users top-up",
            "1 GB cloud library"
        ],
        additionalServices: null,
        buttonText: "Get Started",
        buttonVariant: "outline" as const
    },
    {
        name: "Premium Plan",
        icon: Crown,
        price: "৳500",
        priceDescription: "/ month",
        gradient: "from-yellow-500/20 to-amber-500/20",
        iconColor: "text-yellow-500",
        borderColor: "border-yellow-500/30",
        features: [
            "All Basic tools plus advanced writing & analytics features",
            "Standard e-mail/chat support",
            "Limited UI branding options"
        ],
        usageLimits: [
            "1000 credits deposited monthly (unused credits roll over)",
            "10 GB cloud library"
        ],
        additionalServices: [
            "Optional add-ons like domain-specific models and API keys are available separately."
        ],
        buttonText: "Choose Premium",
        buttonVariant: "default" as const,
        isPopular: true
    },
    {
        name: "Pay As You Go",
        icon: CreditCard,
        price: "৳1,000",
        priceDescription: " for 2,000 credits",
        gradient: "from-purple-500/20 to-violet-500/20",
        iconColor: "text-purple-500",
        borderColor: "border-purple-500/30",
        features: [
            "Full feature set unlocked",
            "Real-time priority support",
            "Complete workflow customisation for labs & departments"
        ],
        usageLimits: [
            "Unlimited usage & storage - constrained only by the credits you buy"
        ],
        additionalServices: [
            "Premium onboarding, data-migration help & research-workflow consulting included"
        ],
        buttonText: "Get Started",
        buttonVariant: "default" as const
    }
]

export function PricingSection() {
    const ref = useRef(null)
    const isInView = useInView(ref, { once: true, amount: 0.2 })

    return (
        <section id="pricing" className="py-12 sm:py-16 md:py-20 lg:py-24 bg-gradient-to-b from-muted/30 to-background" ref={ref}>
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                    transition={{ duration: 0.8 }}
                    className="text-center mb-16"
                >
                    <div className="flex items-center justify-center mb-4">
                        <Sparkles className="h-6 w-6 text-primary mr-2" />
                        <span className="text-sm font-medium text-primary uppercase tracking-wider">Pricing</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 sm:mb-6 px-4">
                        Choose Your
                        <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent"> Business Model</span>
                    </h2>
                    <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed px-4">
                        Flexible pricing plans designed to fit your research needs, from individual researchers to large teams.
                    </p>
                </motion.div>

                {/* Pricing Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-6 md:gap-8 lg:gap-6">
                    {plans.map((plan, index) => {
                        const Icon = plan.icon
                        return (
                            <motion.div
                                key={plan.name}
                                initial={{ opacity: 0, y: 50 }}
                                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
                                transition={{
                                    duration: 0.6,
                                    delay: index * 0.15,
                                    ease: "easeOut"
                                }}
                                whileHover={{ y: -8 }}
                                className="group relative"
                            >
                                <Card className={`h-full border-2 ${plan.borderColor} bg-gradient-to-br from-background/20 to-muted/10 hover:border-primary/50 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 overflow-hidden relative backdrop-blur-md ${plan.isPopular ? 'ring-2 ring-yellow-500/50' : ''}`}>
                                    {plan.isPopular && (
                                        <div className="absolute top-4 right-4 z-10">
                                            <Badge className="bg-gradient-to-r from-yellow-500/20 to-amber-500/20 text-yellow-500 border-yellow-500/30">
                                                Popular
                                            </Badge>
                                        </div>
                                    )}

                                    {/* Gradient overlay on hover */}
                                    <div className={`absolute inset-0 bg-gradient-to-br ${plan.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                                    <CardHeader className="relative z-10 pb-4">
                                        <div className="flex items-center justify-center mb-4">
                                            <motion.div
                                                whileHover={{ scale: 1.1, rotate: 5 }}
                                                className={`p-3 rounded-xl bg-gradient-to-br ${plan.gradient} border border-border/50`}
                                            >
                                                <Icon className={`h-6 w-6 ${plan.iconColor}`} />
                                            </motion.div>
                                        </div>
                                        <CardTitle className="text-xl sm:text-2xl font-bold text-center mb-2 group-hover:text-primary transition-colors duration-300">
                                            {plan.name}
                                        </CardTitle>
                                        <div className="text-center mb-4">
                                            <div className="flex items-baseline justify-center gap-1 flex-wrap">
                                                <span className="text-3xl sm:text-4xl md:text-4xl font-extrabold bg-gradient-to-r from-primary via-blue-400 to-purple-500 bg-clip-text text-transparent">
                                                    {plan.price}
                                                </span>
                                                {plan.priceDescription && (
                                                    <span className="text-base sm:text-lg text-muted-foreground">
                                                        {plan.priceDescription}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </CardHeader>

                                    <CardContent className="relative z-10 space-y-6">
                                        {/* Features */}
                                        <div>
                                            <h4 className="text-xs sm:text-sm font-semibold text-foreground mb-2 sm:mb-3 uppercase tracking-wider">Features</h4>
                                            <ul className="space-y-2">
                                                {plan.features.map((feature, featureIndex) => (
                                                    <motion.li
                                                        key={featureIndex}
                                                        initial={{ opacity: 0, x: -20 }}
                                                        animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                                                        transition={{ delay: index * 0.15 + featureIndex * 0.05 + 0.3 }}
                                                        className="flex items-start text-xs sm:text-sm"
                                                    >
                                                        <CheckCircle className="mr-2 h-3 w-3 sm:h-4 sm:w-4 text-green-500 flex-shrink-0 mt-0.5" />
                                                        <span className="text-muted-foreground">{feature}</span>
                                                    </motion.li>
                                                ))}
                                            </ul>
                                        </div>

                                        {/* Usage Limits */}
                                        <div>
                                            <h4 className="text-xs sm:text-sm font-semibold text-foreground mb-2 sm:mb-3 uppercase tracking-wider">Usage Limits</h4>
                                            <ul className="space-y-2">
                                                {plan.usageLimits.map((limit, limitIndex) => (
                                                    <motion.li
                                                        key={limitIndex}
                                                        initial={{ opacity: 0, x: -20 }}
                                                        animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                                                        transition={{ delay: index * 0.15 + limitIndex * 0.05 + 0.5 }}
                                                        className="flex items-start text-xs sm:text-sm"
                                                    >
                                                        <CheckCircle className="mr-2 h-3 w-3 sm:h-4 sm:w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                                                        <span className="text-muted-foreground">{limit}</span>
                                                    </motion.li>
                                                ))}
                                            </ul>
                                        </div>

                                        {/* Additional Services */}
                                        <div>
                                            <h4 className="text-xs sm:text-sm font-semibold text-foreground mb-2 sm:mb-3 uppercase tracking-wider">Additional Services</h4>
                                            {plan.additionalServices ? (
                                                <ul className="space-y-2">
                                                    {plan.additionalServices.map((service, serviceIndex) => (
                                                        <motion.li
                                                            key={serviceIndex}
                                                            initial={{ opacity: 0, x: -20 }}
                                                            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                                                            transition={{ delay: index * 0.15 + serviceIndex * 0.05 + 0.7 }}
                                                            className="flex items-start text-xs sm:text-sm"
                                                        >
                                                            <CheckCircle className="mr-2 h-3 w-3 sm:h-4 sm:w-4 text-purple-500 flex-shrink-0 mt-0.5" />
                                                            <span className="text-muted-foreground">{service}</span>
                                                        </motion.li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <p className="text-xs sm:text-sm text-muted-foreground/60">—</p>
                                            )}
                                        </div>

                                        {/* CTA Button */}
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
                                            transition={{ delay: index * 0.15 + 0.9 }}
                                            className="pt-4"
                                        >
                                            <Button
                                                variant={plan.buttonVariant}
                                                className="w-full group-hover:scale-105 transition-transform duration-300 text-sm sm:text-base"
                                                size="lg"
                                            >
                                                {plan.buttonText}
                                            </Button>
                                        </motion.div>
                                    </CardContent>

                                    {/* Shine effect */}
                                    <motion.div
                                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"
                                        style={{ transform: "skewX(-20deg)" }}
                                    />
                                </Card>
                            </motion.div>
                        )
                    })}
                </div>

                {/* Additional Info */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                    transition={{ duration: 0.8, delay: 0.8 }}
                    className="mt-12 sm:mt-16 text-center px-4"
                >
                    <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
                        All plans include access to our core research tools. Upgrade or downgrade at any time.
                        Need a custom solution? <a href="#contact" className="text-primary hover:underline">Contact us</a> for enterprise pricing.
                    </p>
                </motion.div>
            </div>
        </section>
    )
}

